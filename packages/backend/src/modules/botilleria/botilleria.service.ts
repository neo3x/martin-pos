import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BotilleriaService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ALCOHOLIC PRODUCTS
  // ============================================

  async createAlcoholicProduct(data: {
    productId: string;
    alcoholContent: number;
    category: string;
    vintage?: number;
    origin?: string;
    winery?: string;
    grapeVariety?: string;
    servingTemperature?: string;
    pairings?: string;
    tastingNotes?: string;
    volume?: number;
    container?: string;
    isReturnable?: boolean;
    depositAmount?: number;
    taxCategory?: string;
  }) {
    return this.prisma.alcoholicProduct.create({
      data: {
        productId: data.productId,
        alcoholContent: data.alcoholContent,
        category: data.category as any,
        vintage: data.vintage,
        origin: data.origin,
        winery: data.winery,
        grapeVariety: data.grapeVariety,
        servingTemperature: data.servingTemperature,
        pairings: data.pairings,
        tastingNotes: data.tastingNotes,
        volume: data.volume,
        container: (data.container as any) || 'BOTTLE',
        isReturnable: data.isReturnable || false,
        depositAmount: data.depositAmount,
        taxCategory: (data.taxCategory as any) || 'STANDARD',
      },
    });
  }

  async getAlcoholicProducts(filters: {
    category?: string;
    origin?: string;
    minPrice?: number;
    maxPrice?: number;
    minAlcohol?: number;
    maxAlcohol?: number;
    vintage?: number;
    branchId?: string;
  }) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.origin) {
      where.origin = { contains: filters.origin, mode: 'insensitive' };
    }
    if (filters.minAlcohol || filters.maxAlcohol) {
      where.alcoholContent = {};
      if (filters.minAlcohol) where.alcoholContent.gte = filters.minAlcohol;
      if (filters.maxAlcohol) where.alcoholContent.lte = filters.maxAlcohol;
    }
    if (filters.vintage) {
      where.vintage = filters.vintage;
    }

    return this.prisma.alcoholicProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWines(branchId: string) {
    return this.prisma.alcoholicProduct.findMany({
      where: {
        category: {
          in: ['WINE_RED', 'WINE_WHITE', 'WINE_ROSE', 'WINE_SPARKLING'],
        },
      },
      orderBy: [{ vintage: 'desc' }, { rating: 'desc' }],
    });
  }

  async getBeers(branchId: string) {
    return this.prisma.alcoholicProduct.findMany({
      where: {
        category: {
          in: ['BEER_LAGER', 'BEER_ALE', 'BEER_CRAFT'],
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async getSpirits(branchId: string) {
    return this.prisma.alcoholicProduct.findMany({
      where: {
        category: {
          in: [
            'SPIRITS_WHISKY', 'SPIRITS_VODKA', 'SPIRITS_GIN', 'SPIRITS_RUM',
            'SPIRITS_TEQUILA', 'SPIRITS_PISCO', 'SPIRITS_BRANDY', 'LIQUEUR',
          ],
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  // ============================================
  // AGE VERIFICATION
  // ============================================

  async verifyAge(data: {
    saleId: string;
    customerRut?: string;
    customerBirthDate?: Date;
    verificationMethod: string;
    verifiedBy: string;
    notes?: string;
  }) {
    // Verificar si es mayor de 18 años
    let isApproved = true;
    if (data.customerBirthDate) {
      const today = new Date();
      const birthDate = new Date(data.customerBirthDate);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        isApproved = age - 1 >= 18;
      } else {
        isApproved = age >= 18;
      }
    }

    return this.prisma.ageVerification.create({
      data: {
        saleId: data.saleId,
        customerRut: data.customerRut,
        customerBirthDate: data.customerBirthDate,
        verificationMethod: data.verificationMethod as any,
        verifiedBy: data.verifiedBy,
        isApproved,
        notes: data.notes,
      },
    });
  }

  async checkSaleHoursRestriction(branchId: string): Promise<{
    isAllowed: boolean;
    message: string;
    currentTime: string;
    allowedHours?: { open: string; close: string };
  }> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const restriction = await this.prisma.saleHoursRestriction.findUnique({
      where: {
        branchId_dayOfWeek: { branchId, dayOfWeek },
      },
    });

    if (!restriction || !restriction.isEnabled) {
      return {
        isAllowed: true,
        message: 'Sin restricción de horario',
        currentTime,
      };
    }

    const isWithinHours = currentTime >= restriction.openTime && currentTime <= restriction.closeTime;

    return {
      isAllowed: isWithinHours,
      message: isWithinHours
        ? 'Venta permitida en este horario'
        : `Venta de alcohol no permitida. Horario: ${restriction.openTime} - ${restriction.closeTime}`,
      currentTime,
      allowedHours: {
        open: restriction.openTime,
        close: restriction.closeTime,
      },
    };
  }

  // ============================================
  // ALCOHOL TAX CALCULATION (ILA)
  // ============================================

  calculateILA(baseAmount: number, taxCategory: string): {
    baseAmount: number;
    ilaRate: number;
    ilaAmount: number;
    ivaAmount: number;
    totalAmount: number;
  } {
    let ilaRate: number;

    switch (taxCategory) {
      case 'HIGH':
        ilaRate = 0.315; // 31.5% para destilados
        break;
      case 'EXEMPT':
        ilaRate = 0;
        break;
      case 'STANDARD':
      default:
        ilaRate = 0.205; // 20.5% para vinos y cervezas
        break;
    }

    const ilaAmount = Math.round(baseAmount * ilaRate);
    const subtotalWithILA = baseAmount + ilaAmount;
    const ivaAmount = Math.round(subtotalWithILA * 0.19);
    const totalAmount = subtotalWithILA + ivaAmount;

    return {
      baseAmount,
      ilaRate,
      ilaAmount,
      ivaAmount,
      totalAmount,
    };
  }

  // ============================================
  // RETURNABLE CONTAINERS
  // ============================================

  async createReturnableContainer(data: {
    productId: string;
    containerType: string;
    depositAmount: number;
    branchId: string;
  }) {
    return this.prisma.returnableContainer.create({
      data: {
        productId: data.productId,
        containerType: data.containerType,
        depositAmount: data.depositAmount,
        branchId: data.branchId,
      },
    });
  }

  async processContainerReturn(data: {
    containerId: string;
    quantity: number;
    customerId?: string;
    processedBy: string;
  }) {
    const container = await this.prisma.returnableContainer.findUnique({
      where: { id: data.containerId },
    });

    if (!container) {
      throw new BadRequestException('Contenedor no encontrado');
    }

    const refundAmount = Number(container.depositAmount) * data.quantity;

    const [containerReturn] = await this.prisma.$transaction([
      this.prisma.containerReturn.create({
        data: {
          containerId: data.containerId,
          quantity: data.quantity,
          refundAmount,
          customerId: data.customerId,
          processedBy: data.processedBy,
        },
      }),
      this.prisma.returnableContainer.update({
        where: { id: data.containerId },
        data: {
          totalReturned: { increment: data.quantity },
          pendingQuantity: { decrement: data.quantity },
        },
      }),
    ]);

    return { containerReturn, refundAmount };
  }

  async getPendingContainers(branchId: string) {
    return this.prisma.returnableContainer.findMany({
      where: {
        branchId,
        pendingQuantity: { gt: 0 },
      },
    });
  }

  // ============================================
  // TASTING EVENTS
  // ============================================

  async createTastingEvent(data: {
    name: string;
    description?: string;
    eventDate: Date;
    capacity: number;
    pricePerPerson: number;
    branchId: string;
    productIds?: string[];
  }) {
    return this.prisma.tastingEvent.create({
      data: {
        name: data.name,
        description: data.description,
        eventDate: data.eventDate,
        capacity: data.capacity,
        pricePerPerson: data.pricePerPerson,
        branchId: data.branchId,
        products: data.productIds
          ? {
              create: data.productIds.map((productId) => ({
                productId,
              })),
            }
          : undefined,
      },
      include: {
        products: true,
        attendees: true,
      },
    });
  }

  async registerAttendee(data: {
    eventId: string;
    name: string;
    email?: string;
    phone?: string;
    customerId?: string;
  }) {
    const event = await this.prisma.tastingEvent.findUnique({
      where: { id: data.eventId },
      include: { attendees: true },
    });

    if (!event) {
      throw new BadRequestException('Evento no encontrado');
    }

    if (event.attendees.length >= event.capacity) {
      throw new BadRequestException('Evento lleno');
    }

    return this.prisma.tastingEventAttendee.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        customerId: data.customerId,
      },
    });
  }

  async getUpcomingEvents(branchId: string) {
    return this.prisma.tastingEvent.findMany({
      where: {
        branchId,
        eventDate: { gte: new Date() },
        status: { in: ['SCHEDULED', 'OPEN_REGISTRATION'] },
      },
      include: {
        products: true,
        _count: { select: { attendees: true } },
      },
      orderBy: { eventDate: 'asc' },
    });
  }

  // ============================================
  // WINE CLUB SUBSCRIPTIONS
  // ============================================

  async createSubscription(data: {
    customerId: string;
    planType: string;
    monthlyAmount: number;
    bottlesPerMonth: number;
    preferredCategories?: string[];
    branchId: string;
  }) {
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);

    return this.prisma.wineClubSubscription.create({
      data: {
        customerId: data.customerId,
        planType: data.planType as any,
        monthlyAmount: data.monthlyAmount,
        bottlesPerMonth: data.bottlesPerMonth,
        preferredCategories: data.preferredCategories
          ? JSON.stringify(data.preferredCategories)
          : null,
        nextDeliveryDate,
        branchId: data.branchId,
      },
    });
  }

  async getActiveSubscriptions(branchId: string) {
    return this.prisma.wineClubSubscription.findMany({
      where: {
        branchId,
        status: 'ACTIVE',
      },
      orderBy: { nextDeliveryDate: 'asc' },
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.prisma.wineClubSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  // ============================================
  // AI RECOMMENDATIONS
  // ============================================

  async getProductRecommendations(customerId: string, limit: number = 5) {
    // Get customer purchase history
    const purchases = await this.prisma.sale.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Analyze preferences (simplified)
    const categoryPreferences = new Map<string, number>();
    purchases.forEach((sale) => {
      sale.items.forEach((item) => {
        const count = categoryPreferences.get(item.product.categoryId) || 0;
        categoryPreferences.set(item.product.categoryId, count + 1);
      });
    });

    // Get top categories
    const sortedCategories = Array.from(categoryPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    if (sortedCategories.length === 0) {
      // Return popular products if no history
      return this.prisma.alcoholicProduct.findMany({
        take: limit,
        orderBy: { rating: 'desc' },
      });
    }

    // Recommend based on preferences
    return this.prisma.alcoholicProduct.findMany({
      take: limit,
      orderBy: { rating: 'desc' },
    });
  }

  async getPairingRecommendation(food: string) {
    // Basic pairing logic - in production would use AI
    const pairings: Record<string, string[]> = {
      'carne roja': ['WINE_RED'],
      'pescado': ['WINE_WHITE', 'WINE_SPARKLING'],
      'mariscos': ['WINE_WHITE', 'WINE_SPARKLING'],
      'pollo': ['WINE_WHITE', 'WINE_ROSE'],
      'pasta': ['WINE_RED', 'WINE_WHITE'],
      'pizza': ['BEER_LAGER', 'WINE_RED'],
      'asado': ['WINE_RED', 'SPIRITS_PISCO'],
      'sushi': ['WINE_WHITE', 'BEER_LAGER'],
      'queso': ['WINE_RED', 'WINE_WHITE'],
      'postre': ['WINE_SPARKLING', 'LIQUEUR'],
    };

    const foodLower = food.toLowerCase();
    const matchedCategories: string[] = [];

    Object.entries(pairings).forEach(([key, categories]) => {
      if (foodLower.includes(key)) {
        matchedCategories.push(...categories);
      }
    });

    if (matchedCategories.length === 0) {
      return { food, recommendations: [], message: 'No se encontraron maridajes específicos' };
    }

    const products = await this.prisma.alcoholicProduct.findMany({
      where: {
        category: { in: matchedCategories as any[] },
      },
      take: 5,
      orderBy: { rating: 'desc' },
    });

    return {
      food,
      recommendations: products,
      message: `Encontramos ${products.length} recomendaciones para ${food}`,
    };
  }
}
