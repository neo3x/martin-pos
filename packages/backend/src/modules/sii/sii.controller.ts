import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SIIService } from './sii.service';

@Controller('sii')
@UseGuards(JwtAuthGuard)
export class SIIController {
  constructor(private siiService: SIIService) {}

  // ============================================
  // CONFIGURATION
  // ============================================

  @Get('config/:branchId')
  getConfig(@Param('branchId') branchId: string) {
    return this.siiService.getConfig(branchId);
  }

  @Post('config')
  saveConfig(@Body() data: any) {
    return this.siiService.saveConfig(data);
  }

  @Put('config/:branchId/folios')
  updateFolios(
    @Param('branchId') branchId: string,
    @Body() data: { dteType: string; folios: { inicio: number; actual: number; fin: number } },
  ) {
    return this.siiService.updateFolios(branchId, data.dteType, data.folios);
  }

  // ============================================
  // BOLETA ELECTRÓNICA
  // ============================================

  @Post('boleta')
  emitirBoleta(@Body() data: any) {
    return this.siiService.emitirBoleta(data);
  }

  // ============================================
  // FACTURA ELECTRÓNICA
  // ============================================

  @Post('factura')
  emitirFactura(@Body() data: any) {
    return this.siiService.emitirFactura(data);
  }

  // ============================================
  // NOTA DE CRÉDITO
  // ============================================

  @Post('nota-credito')
  emitirNotaCredito(@Body() data: any) {
    return this.siiService.emitirNotaCredito(data);
  }

  // ============================================
  // SII COMMUNICATION
  // ============================================

  @Post('enviar/:dteId')
  enviarAlSII(@Param('dteId') dteId: string) {
    return this.siiService.enviarAlSII(dteId);
  }

  @Get('estado/:dteId')
  consultarEstado(@Param('dteId') dteId: string) {
    return this.siiService.consultarEstadoSII(dteId);
  }

  // ============================================
  // QUERIES
  // ============================================

  @Get('documentos/:branchId')
  getDTEs(
    @Param('branchId') branchId: string,
    @Query('tipoDTE') tipoDTE?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.siiService.getDTEsByBranch(branchId, {
      tipoDTE: tipoDTE ? parseInt(tipoDTE) : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('documento/:dteId')
  getDTE(@Param('dteId') dteId: string) {
    return this.siiService.getDTEById(dteId);
  }

  @Get('documento/:dteId/logs')
  getDTELogs(@Param('dteId') dteId: string) {
    return this.siiService.getDTELogs(dteId);
  }

  // ============================================
  // UTILITIES
  // ============================================

  @Get('validar-rut/:rut')
  validarRut(@Param('rut') rut: string) {
    const isValid = this.siiService.validateRut(rut);
    return {
      rut,
      isValid,
      message: isValid ? 'RUT válido' : 'RUT inválido',
    };
  }
}
