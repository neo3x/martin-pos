import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { IAIQuery, IAIResponse, IAIInventoryAnalysis } from '@martin-pos/shared';

@Injectable()
export class AIService {
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private productsService: ProductsService
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async query(queryData: IAIQuery): Promise<IAIResponse> {
    if (!this.anthropic) {
      return {
        response: 'AI service not configured. Please add ANTHROPIC_API_KEY to your .env file.',
        suggestions: [],
      };
    }

    try {
      // Get context data
      const contextData = await this.getContextData(queryData.branchId, queryData.context);

      const systemPrompt = this.buildSystemPrompt(queryData.branchId);
      const userPrompt = this.buildUserPrompt(queryData.query, contextData);

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Save query to history
      await this.prisma.aIQuery.create({
        data: {
          query: queryData.query,
          response: responseText,
          context: queryData.context || {},
          userId: queryData.userId,
        },
      });

      return {
        response: responseText,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('AI Query Error:', error);
      return {
        response: `Error: ${error.message}`,
        confidence: 0,
      };
    }
  }

  async analyzeInventory(branchId: string): Promise<IAIInventoryAnalysis[]> {
    if (!this.anthropic) {
      return [];
    }

    try {
      // Get products with sales data
      const products = await this.prisma.product.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'ACTIVE',
        },
        include: {
          stockMovements: {
            where: {
              type: 'SALE',
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        take: 50,
      });

      const analyses: IAIInventoryAnalysis[] = [];

      for (const product of products) {
        const salesData = product.stockMovements;
        const totalSold = salesData.reduce((sum, mov) => sum + Number(mov.quantity), 0);
        const averageDailySales = totalSold / 30;

        if (averageDailySales === 0) continue;

        const daysUntilStockout = Number(product.stock) / averageDailySales;
        const recommendedReorderQuantity = Math.ceil(averageDailySales * 14); // 2 weeks supply

        // Determine reorder date
        const reorderThreshold = 7; // days
        const daysUntilReorder = daysUntilStockout - reorderThreshold;
        const reorderDate = new Date();
        reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysUntilReorder));

        const analysis: IAIInventoryAnalysis = {
          productId: product.id,
          productName: product.name,
          currentStock: Number(product.stock),
          averageDailySales,
          daysUntilStockout,
          recommendedReorderQuantity,
          reorderDate,
          confidence: 0.8,
          reasoning: `Basado en ${salesData.length} ventas en los últimos 30 días, con un promedio de ${averageDailySales.toFixed(2)} unidades por día.`,
        };

        analyses.push(analysis);
      }

      // Sort by urgency (lowest days until stockout first)
      return analyses.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
    } catch (error) {
      console.error('Inventory Analysis Error:', error);
      return [];
    }
  }

  async generateDailyReport(branchId: string, date: Date = new Date()): Promise<string> {
    if (!this.anthropic) {
      return 'AI service not configured';
    }

    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Get sales data
      const sales = await this.prisma.sale.findMany({
        where: {
          branchId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalSales = sales.length;
      const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

      // Get top products
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          const existing = productSales.get(item.productId) || {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += Number(item.quantity);
          existing.revenue += Number(item.total);
          productSales.set(item.productId, existing);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Build prompt for AI analysis
      const prompt = `Analiza los siguientes datos de ventas del día ${date.toLocaleDateString('es-CL')}:

- Total de ventas: ${totalSales}
- Ingresos totales: $${totalRevenue.toFixed(2)}
- Total de artículos vendidos: ${totalItems}
- Ticket promedio: $${(totalRevenue / (totalSales || 1)).toFixed(2)}

Top 5 productos más vendidos:
${topProducts
  .map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} unidades, $${p.revenue.toFixed(2)} en ingresos`)
  .join('\n')}

Por favor, genera un informe conciso (máximo 300 palabras) con:
1. Resumen ejecutivo del día
2. Insights clave y patrones observados
3. Recomendaciones para mejorar las ventas
4. Alertas o áreas de atención

Usa un tono profesional y enfócate en información accionable.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      console.error('Daily Report Error:', error);
      return `Error generating report: ${error.message}`;
    }
  }

  async suggestOptimalPricing(productId: string): Promise<any> {
    // Get product and sales history
    const product = await this.productsService.findOne(productId);

    const salesData = await this.prisma.saleItem.findMany({
      where: {
        productId,
        sale: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      },
      include: {
        sale: true,
      },
    });

    const totalSold = salesData.reduce((sum, item) => sum + Number(item.quantity), 0);
    const averagePrice = salesData.reduce((sum, item) => sum + Number(item.unitPrice), 0) / salesData.length;

    const profitMargin = ((Number(product.price) - Number(product.costPrice)) / Number(product.price)) * 100;

    return {
      currentPrice: Number(product.price),
      costPrice: Number(product.costPrice),
      profitMargin,
      averageHistoricalPrice: averagePrice,
      totalSold90Days: totalSold,
      recommendation: this.calculatePriceRecommendation(product, totalSold, profitMargin),
    };
  }

  private calculatePriceRecommendation(product: any, totalSold: number, profitMargin: number): any {
    const targetMargin = 30; // 30% profit margin target

    if (profitMargin < targetMargin && totalSold > 0) {
      const suggestedPrice = Number(product.costPrice) * (1 + targetMargin / 100);
      return {
        action: 'INCREASE',
        suggestedPrice,
        reasoning: `Current margin (${profitMargin.toFixed(1)}%) is below target (${targetMargin}%). Product is selling well, consider price increase.`,
      };
    } else if (totalSold === 0) {
      const suggestedPrice = Number(product.price) * 0.9; // 10% discount
      return {
        action: 'DECREASE',
        suggestedPrice,
        reasoning: 'No sales in 90 days. Consider promotional pricing.',
      };
    }

    return {
      action: 'MAINTAIN',
      suggestedPrice: Number(product.price),
      reasoning: 'Price is optimal based on current performance.',
    };
  }

  private buildSystemPrompt(branchId: string): string {
    return `Eres un asistente inteligente para el sistema POS "OmniPunto". Tu rol es ayudar con:

1. Análisis de inventario y predicciones de stock
2. Insights de ventas y tendencias
3. Recomendaciones de reorden de productos
4. Optimización de precios y márgenes
5. Detección de productos por vencer
6. Sugerencias para reducir mermas
7. Análisis de rendimiento de productos

Siempre proporciona respuestas:
- Concisas y accionables
- Basadas en datos cuando sea posible
- En español
- Con formato claro y fácil de leer
- Enfocadas en ayudar al negocio a ser más rentable

ID de sucursal: ${branchId}`;
  }

  private buildUserPrompt(query: string, contextData: any): string {
    let prompt = query;

    if (contextData && Object.keys(contextData).length > 0) {
      prompt += '\n\nContexto adicional:\n';
      prompt += JSON.stringify(contextData, null, 2);
    }

    return prompt;
  }

  private async getContextData(branchId: string, context?: Record<string, any>): Promise<any> {
    const data: any = {};

    // If specific context is requested, fetch that data
    if (context?.includeInventory) {
      const lowStock = await this.productsService.getLowStockProducts(branchId);
      data.lowStockProducts = lowStock.length;
    }

    if (context?.includeExpiring) {
      const expiring = await this.productsService.getExpiringProducts(branchId, 7);
      data.expiringProducts = expiring.length;
    }

    if (context?.includeSales) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      const sales = await this.prisma.sale.findMany({
        where: {
          branchId,
          status: 'COMPLETED',
          createdAt: { gte: startOfDay },
        },
      });

      data.todaySales = sales.length;
      data.todayRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    }

    return data;
  }
}
