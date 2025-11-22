import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Tipos de DTE según SII Chile
const DTE_TYPES = {
  FACTURA: 33,
  FACTURA_EXENTA: 34,
  BOLETA: 39,
  BOLETA_EXENTA: 41,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
};

@Injectable()
export class SIIService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CONFIGURATION
  // ============================================

  async getConfig(branchId: string) {
    return this.prisma.sIIConfig.findUnique({
      where: { branchId },
    });
  }

  async saveConfig(data: {
    branchId: string;
    rutEmisor: string;
    razonSocial: string;
    giroEmisor: string;
    direccionOrigen: string;
    comunaOrigen: string;
    ciudadOrigen: string;
    environment?: string;
  }) {
    return this.prisma.sIIConfig.upsert({
      where: { branchId: data.branchId },
      update: {
        rutEmisor: this.formatRut(data.rutEmisor),
        razonSocial: data.razonSocial,
        giroEmisor: data.giroEmisor,
        direccionOrigen: data.direccionOrigen,
        comunaOrigen: data.comunaOrigen,
        ciudadOrigen: data.ciudadOrigen,
        environment: data.environment || 'certificacion',
      },
      create: {
        branchId: data.branchId,
        rutEmisor: this.formatRut(data.rutEmisor),
        razonSocial: data.razonSocial,
        giroEmisor: data.giroEmisor,
        direccionOrigen: data.direccionOrigen,
        comunaOrigen: data.comunaOrigen,
        ciudadOrigen: data.ciudadOrigen,
        environment: data.environment || 'certificacion',
      },
    });
  }

  async updateFolios(branchId: string, dteType: string, folios: {
    inicio: number;
    actual: number;
    fin: number;
  }) {
    const updateData: any = {};

    switch (dteType) {
      case 'BOLETA':
        updateData.folioBoletaInicio = folios.inicio;
        updateData.folioBoletaActual = folios.actual;
        updateData.folioBoletaFin = folios.fin;
        break;
      case 'FACTURA':
        updateData.folioFacturaInicio = folios.inicio;
        updateData.folioFacturaActual = folios.actual;
        updateData.folioFacturaFin = folios.fin;
        break;
    }

    return this.prisma.sIIConfig.update({
      where: { branchId },
      data: updateData,
    });
  }

  // ============================================
  // BOLETA ELECTRÓNICA
  // ============================================

  async emitirBoleta(data: {
    branchId: string;
    saleId?: string;
    items: Array<{
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      esExento?: boolean;
      productId?: string;
    }>;
    montoTotal: number;
  }) {
    const config = await this.getConfig(data.branchId);
    if (!config) {
      throw new BadRequestException('Configuración SII no encontrada');
    }

    if (!config.folioBoletaActual || config.folioBoletaActual >= (config.folioBoletaFin || 0)) {
      throw new BadRequestException('No hay folios disponibles para boletas');
    }

    const folio = config.folioBoletaActual;

    // Calculate amounts
    const montoExento = data.items
      .filter((i) => i.esExento)
      .reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);
    const montoNeto = Math.round((data.montoTotal - montoExento) / 1.19);
    const iva = data.montoTotal - montoExento - montoNeto;

    // Create DTE document
    const dte = await this.prisma.dTEDocument.create({
      data: {
        branchId: data.branchId,
        saleId: data.saleId,
        tipoDTE: DTE_TYPES.BOLETA,
        folio,
        rutEmisor: config.rutEmisor,
        razonSocialEmisor: config.razonSocial,
        montoNeto,
        montoExento,
        tasaIVA: 19,
        iva,
        montoTotal: data.montoTotal,
        status: 'DRAFT',
        items: {
          create: data.items.map((item, index) => ({
            numeroLinea: index + 1,
            indicadorExento: item.esExento || false,
            nombreItem: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            montoItem: Math.round(item.cantidad * item.precioUnitario),
            productId: item.productId,
          })),
        },
      },
      include: { items: true },
    });

    // Generate XML
    const xml = this.generateBoletaXML(dte, config);

    // Update with XML and increment folio
    await this.prisma.$transaction([
      this.prisma.dTEDocument.update({
        where: { id: dte.id },
        data: { xmlContent: xml, status: 'SIGNED' },
      }),
      this.prisma.sIIConfig.update({
        where: { branchId: data.branchId },
        data: { folioBoletaActual: folio + 1 },
      }),
      this.prisma.dTELog.create({
        data: {
          dteId: dte.id,
          action: 'CREATED',
          status: 'SUCCESS',
          message: `Boleta ${folio} creada`,
        },
      }),
    ]);

    return {
      success: true,
      dte: { ...dte, xmlContent: xml },
      folio,
      tipoDTE: 'BOLETA',
    };
  }

  // ============================================
  // FACTURA ELECTRÓNICA
  // ============================================

  async emitirFactura(data: {
    branchId: string;
    saleId?: string;
    receptor: {
      rut: string;
      razonSocial: string;
      giro?: string;
      direccion?: string;
      comuna?: string;
    };
    items: Array<{
      nombre: string;
      descripcion?: string;
      cantidad: number;
      precioUnitario: number;
      esExento?: boolean;
      productId?: string;
      // Para productos con ILA (alcohol)
      codigoImpAdicional?: number;
      tasaImpAdicional?: number;
    }>;
    fechaVencimiento?: Date;
  }) {
    const config = await this.getConfig(data.branchId);
    if (!config) {
      throw new BadRequestException('Configuración SII no encontrada');
    }

    if (!config.folioFacturaActual || config.folioFacturaActual >= (config.folioFacturaFin || 0)) {
      throw new BadRequestException('No hay folios disponibles para facturas');
    }

    const folio = config.folioFacturaActual;

    // Calculate amounts
    let montoNeto = 0;
    let montoExento = 0;
    let montoImpAdicional = 0;

    data.items.forEach((item) => {
      const montoItem = item.cantidad * item.precioUnitario;
      if (item.esExento) {
        montoExento += montoItem;
      } else {
        montoNeto += montoItem;
      }
      // ILA for alcohol
      if (item.codigoImpAdicional && item.tasaImpAdicional) {
        montoImpAdicional += Math.round(montoItem * (item.tasaImpAdicional / 100));
      }
    });

    const iva = Math.round(montoNeto * 0.19);
    const montoTotal = montoNeto + montoExento + iva + montoImpAdicional;

    // Create DTE document
    const dte = await this.prisma.dTEDocument.create({
      data: {
        branchId: data.branchId,
        saleId: data.saleId,
        tipoDTE: DTE_TYPES.FACTURA,
        folio,
        rutEmisor: config.rutEmisor,
        razonSocialEmisor: config.razonSocial,
        rutReceptor: this.formatRut(data.receptor.rut),
        razonSocialReceptor: data.receptor.razonSocial,
        giroReceptor: data.receptor.giro,
        direccionReceptor: data.receptor.direccion,
        comunaReceptor: data.receptor.comuna,
        montoNeto,
        montoExento,
        tasaIVA: 19,
        iva,
        montoTotal,
        tipoImpAdicional: montoImpAdicional > 0 ? 24 : null, // 24 = ILA
        montoImpAdicional: montoImpAdicional > 0 ? montoImpAdicional : null,
        status: 'DRAFT',
        fechaVencimiento: data.fechaVencimiento,
        items: {
          create: data.items.map((item, index) => ({
            numeroLinea: index + 1,
            indicadorExento: item.esExento || false,
            nombreItem: item.nombre,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            montoItem: Math.round(item.cantidad * item.precioUnitario),
            productId: item.productId,
            codigoImpAdicional: item.codigoImpAdicional,
            tasaImpAdicional: item.tasaImpAdicional,
            montoImpAdicional: item.codigoImpAdicional
              ? Math.round(item.cantidad * item.precioUnitario * (item.tasaImpAdicional || 0) / 100)
              : null,
          })),
        },
      },
      include: { items: true },
    });

    // Generate XML
    const xml = this.generateFacturaXML(dte, config);

    // Update with XML and increment folio
    await this.prisma.$transaction([
      this.prisma.dTEDocument.update({
        where: { id: dte.id },
        data: { xmlContent: xml, status: 'SIGNED' },
      }),
      this.prisma.sIIConfig.update({
        where: { branchId: data.branchId },
        data: { folioFacturaActual: folio + 1 },
      }),
      this.prisma.dTELog.create({
        data: {
          dteId: dte.id,
          action: 'CREATED',
          status: 'SUCCESS',
          message: `Factura ${folio} creada`,
        },
      }),
    ]);

    return {
      success: true,
      dte: { ...dte, xmlContent: xml },
      folio,
      tipoDTE: 'FACTURA',
    };
  }

  // ============================================
  // NOTA DE CRÉDITO
  // ============================================

  async emitirNotaCredito(data: {
    branchId: string;
    referenciaFolio: number;
    referenciaTipoDTE: number;
    razon: string;
    items: Array<{
      nombre: string;
      cantidad: number;
      precioUnitario: number;
    }>;
  }) {
    const config = await this.getConfig(data.branchId);
    if (!config) {
      throw new BadRequestException('Configuración SII no encontrada');
    }

    // Get original document
    const originalDTE = await this.prisma.dTEDocument.findFirst({
      where: {
        branchId: data.branchId,
        tipoDTE: data.referenciaTipoDTE,
        folio: data.referenciaFolio,
      },
    });

    if (!originalDTE) {
      throw new BadRequestException('Documento original no encontrado');
    }

    // Use factura folio counter for nota de credito
    const folio = (config.folioFacturaActual || 1);

    const montoNeto = data.items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);
    const iva = Math.round(montoNeto * 0.19);
    const montoTotal = montoNeto + iva;

    const dte = await this.prisma.dTEDocument.create({
      data: {
        branchId: data.branchId,
        tipoDTE: DTE_TYPES.NOTA_CREDITO,
        folio,
        rutEmisor: config.rutEmisor,
        razonSocialEmisor: config.razonSocial,
        rutReceptor: originalDTE.rutReceptor,
        razonSocialReceptor: originalDTE.razonSocialReceptor,
        montoNeto,
        montoExento: 0,
        tasaIVA: 19,
        iva,
        montoTotal,
        status: 'SIGNED',
        referenciaTipoDTE: data.referenciaTipoDTE,
        referenciaFolio: data.referenciaFolio,
        referenciaRazon: data.razon,
        items: {
          create: data.items.map((item, index) => ({
            numeroLinea: index + 1,
            indicadorExento: false,
            nombreItem: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            montoItem: Math.round(item.cantidad * item.precioUnitario),
          })),
        },
      },
      include: { items: true },
    });

    await this.prisma.dTELog.create({
      data: {
        dteId: dte.id,
        action: 'CREATED',
        status: 'SUCCESS',
        message: `Nota de Crédito ${folio} creada, referencia: ${data.referenciaTipoDTE}-${data.referenciaFolio}`,
      },
    });

    return {
      success: true,
      dte,
      folio,
      tipoDTE: 'NOTA_CREDITO',
    };
  }

  // ============================================
  // SII COMMUNICATION (MOCK)
  // ============================================

  async enviarAlSII(dteId: string) {
    const dte = await this.prisma.dTEDocument.findUnique({
      where: { id: dteId },
      include: { items: true },
    });

    if (!dte) {
      throw new BadRequestException('DTE no encontrado');
    }

    if (!dte.xmlSigned && !dte.xmlContent) {
      throw new BadRequestException('DTE no tiene XML firmado');
    }

    // In production, this would send to actual SII SOAP service
    // Mock successful response
    const trackId = `T${Date.now()}`;

    await this.prisma.$transaction([
      this.prisma.dTEDocument.update({
        where: { id: dteId },
        data: {
          status: 'SENT',
          trackId,
          sentToSIIAt: new Date(),
        },
      }),
      this.prisma.dTELog.create({
        data: {
          dteId,
          action: 'SENT',
          status: 'SUCCESS',
          message: `Enviado al SII con trackId: ${trackId}`,
        },
      }),
    ]);

    return {
      success: true,
      trackId,
      message: 'Documento enviado al SII correctamente',
    };
  }

  async consultarEstadoSII(dteId: string) {
    const dte = await this.prisma.dTEDocument.findUnique({
      where: { id: dteId },
    });

    if (!dte) {
      throw new BadRequestException('DTE no encontrado');
    }

    // In production, query actual SII status
    // Mock accepted response
    const estadoSII = 'DOK'; // DOK = Documento OK
    const glosaEstado = 'Documento recibido y aceptado por SII';

    await this.prisma.$transaction([
      this.prisma.dTEDocument.update({
        where: { id: dteId },
        data: {
          status: 'ACCEPTED',
          estadoSII,
          glosaEstadoSII: glosaEstado,
          acceptedBySIIAt: new Date(),
        },
      }),
      this.prisma.dTELog.create({
        data: {
          dteId,
          action: 'ACCEPTED',
          status: 'SUCCESS',
          message: glosaEstado,
        },
      }),
    ]);

    return {
      trackId: dte.trackId,
      estado: estadoSII,
      glosa: glosaEstado,
    };
  }

  // ============================================
  // QUERIES
  // ============================================

  async getDTEsByBranch(branchId: string, filters?: {
    tipoDTE?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { branchId };

    if (filters?.tipoDTE) where.tipoDTE = filters.tipoDTE;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.fechaEmision = {};
      if (filters.startDate) where.fechaEmision.gte = filters.startDate;
      if (filters.endDate) where.fechaEmision.lte = filters.endDate;
    }

    return this.prisma.dTEDocument.findMany({
      where,
      include: { items: true },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async getDTEById(dteId: string) {
    return this.prisma.dTEDocument.findUnique({
      where: { id: dteId },
      include: { items: true },
    });
  }

  async getDTELogs(dteId: string) {
    return this.prisma.dTELog.findMany({
      where: { dteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // XML GENERATION
  // ============================================

  private generateBoletaXML(dte: any, config: any): string {
    const fechaEmision = dte.fechaEmision.toISOString().slice(0, 10);

    // Simplified XML structure (in production use proper XML builder)
    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="MPOS-${dte.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${dte.tipoDTE}</TipoDTE>
        <Folio>${dte.folio}</Folio>
        <FchEmis>${fechaEmision}</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${config.rutEmisor}</RUTEmisor>
        <RznSoc>${config.razonSocial}</RznSoc>
        <GiroEmis>${config.giroEmisor}</GiroEmis>
        <DirOrigen>${config.direccionOrigen}</DirOrigen>
        <CmnaOrigen>${config.comunaOrigen}</CmnaOrigen>
        <CiudadOrigen>${config.ciudadOrigen}</CiudadOrigen>
      </Emisor>
      <Totales>
        <MntNeto>${dte.montoNeto}</MntNeto>
        <MntExe>${dte.montoExento}</MntExe>
        <IVA>${dte.iva}</IVA>
        <MntTotal>${dte.montoTotal}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
${dte.items.map((item: any) => `      <Item>
        <NroLinDet>${item.numeroLinea}</NroLinDet>
        <NmbItem>${this.escapeXml(item.nombreItem)}</NmbItem>
        <QtyItem>${item.cantidad}</QtyItem>
        <PrcItem>${item.precioUnitario}</PrcItem>
        <MontoItem>${item.montoItem}</MontoItem>
      </Item>`).join('\n')}
    </Detalle>
  </Documento>
</DTE>`;

    return xml;
  }

  private generateFacturaXML(dte: any, config: any): string {
    const fechaEmision = dte.fechaEmision.toISOString().slice(0, 10);

    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="MPOS-${dte.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${dte.tipoDTE}</TipoDTE>
        <Folio>${dte.folio}</Folio>
        <FchEmis>${fechaEmision}</FchEmis>
        ${dte.fechaVencimiento ? `<FchVenc>${dte.fechaVencimiento.toISOString().slice(0, 10)}</FchVenc>` : ''}
      </IdDoc>
      <Emisor>
        <RUTEmisor>${config.rutEmisor}</RUTEmisor>
        <RznSoc>${config.razonSocial}</RznSoc>
        <GiroEmis>${config.giroEmisor}</GiroEmis>
        <DirOrigen>${config.direccionOrigen}</DirOrigen>
        <CmnaOrigen>${config.comunaOrigen}</CmnaOrigen>
        <CiudadOrigen>${config.ciudadOrigen}</CiudadOrigen>
      </Emisor>
      <Receptor>
        <RUTRecep>${dte.rutReceptor}</RUTRecep>
        <RznSocRecep>${this.escapeXml(dte.razonSocialReceptor || '')}</RznSocRecep>
        ${dte.giroReceptor ? `<GiroRecep>${this.escapeXml(dte.giroReceptor)}</GiroRecep>` : ''}
        ${dte.direccionReceptor ? `<DirRecep>${this.escapeXml(dte.direccionReceptor)}</DirRecep>` : ''}
        ${dte.comunaReceptor ? `<CmnaRecep>${dte.comunaReceptor}</CmnaRecep>` : ''}
      </Receptor>
      <Totales>
        <MntNeto>${dte.montoNeto}</MntNeto>
        <MntExe>${dte.montoExento}</MntExe>
        <TasaIVA>${dte.tasaIVA}</TasaIVA>
        <IVA>${dte.iva}</IVA>
        ${dte.montoImpAdicional ? `<ImptoReten><TipoImp>${dte.tipoImpAdicional}</TipoImp><MontoImp>${dte.montoImpAdicional}</MontoImp></ImptoReten>` : ''}
        <MntTotal>${dte.montoTotal}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
${dte.items.map((item: any) => `      <Item>
        <NroLinDet>${item.numeroLinea}</NroLinDet>
        ${item.indicadorExento ? '<IndExe>1</IndExe>' : ''}
        <NmbItem>${this.escapeXml(item.nombreItem)}</NmbItem>
        ${item.descripcion ? `<DscItem>${this.escapeXml(item.descripcion)}</DscItem>` : ''}
        <QtyItem>${item.cantidad}</QtyItem>
        <PrcItem>${item.precioUnitario}</PrcItem>
        <MontoItem>${item.montoItem}</MontoItem>
      </Item>`).join('\n')}
    </Detalle>
    ${dte.referenciaTipoDTE ? `<Referencia>
      <TpoDocRef>${dte.referenciaTipoDTE}</TpoDocRef>
      <FolioRef>${dte.referenciaFolio}</FolioRef>
      <RazonRef>${this.escapeXml(dte.referenciaRazon || '')}</RazonRef>
    </Referencia>` : ''}
  </Documento>
</DTE>`;

    return xml;
  }

  // ============================================
  // HELPERS
  // ============================================

  private formatRut(rut: string): string {
    // Remove dots and spaces, keep hyphen
    return rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  validateRut(rut: string): boolean {
    const cleanRut = this.formatRut(rut);
    const match = cleanRut.match(/^(\d+)-?([\dkK])$/);
    if (!match) return false;

    const body = match[1];
    const dv = match[2].toUpperCase();

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const dvChar = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : String(expectedDv);

    return dv === dvChar;
  }
}
