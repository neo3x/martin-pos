import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AdvancedAIService {
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  // OCR para facturas de proveedores
  async processInvoiceOCR(imageUrl: string, userId: string) {
    // TODO: Implement actual OCR with Vision API
    const extractedData = {
      supplier: 'Proveedor Ejemplo',
      date: new Date(),
      total: 1500,
      items: [],
    };

    return this.prisma.aIOCRDocument.create({
      data: {
        imageUrl,
        documentType: 'SUPPLIER_INVOICE',
        extractedData,
        confidence: 0.95,
        userId,
      },
    });
  }

  // Reconocimiento de productos por imagen
  async recognizeProduct(imageUrl: string, userId: string) {
    // TODO: Implement with GPT-4 Vision
    return this.prisma.aIProductRecognition.create({
      data: {
        imageUrl,
        productId: null,
        confidence: 0.85,
        userId,
      },
    });
  }

  // Procesamiento de comandos de voz
  async processVoiceCommand(transcript: string, userId: string) {
    if (!this.anthropic) {
      throw new Error('AI not configured');
    }

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Extrae el comando de POS de este texto: "${transcript}". Responde en JSON con: {action, params}`,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    return this.prisma.aIVoiceCommand.create({
      data: {
        transcript,
        command: response,
        confidence: 0.9,
        userId,
      },
    });
  }
}
