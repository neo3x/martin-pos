import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AdvancedAIService } from './advanced-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai/advanced')
@UseGuards(JwtAuthGuard)
export class AdvancedAIController {
  constructor(private aiService: AdvancedAIService) {}

  @Post('ocr/invoice')
  processInvoice(@Body() data: { imageUrl: string }, @Request() req) {
    return this.aiService.processInvoiceOCR(data.imageUrl, req.user.id);
  }

  @Post('recognize/product')
  recognizeProduct(@Body() data: { imageUrl: string }, @Request() req) {
    return this.aiService.recognizeProduct(data.imageUrl, req.user.id);
  }

  @Post('voice/command')
  processVoice(@Body() data: { transcript: string }, @Request() req) {
    return this.aiService.processVoiceCommand(data.transcript, req.user.id);
  }
}
