import { PrismaClient, ModuleType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch' },
    update: {},
    create: {
      id: 'default-branch',
      name: 'Sucursal Principal',
      address: 'Av. Principal 123',
      phone: '+56912345678',
      email: 'sucursal@martinpos.com',
      moduleType: ModuleType.ALL,
      isActive: true,
      config: {
        currency: 'CLP',
        timezone: 'America/Santiago',
        taxRate: 0.19,
        printerConfig: {
          enabled: true,
          width: 48,
        },
        features: ['inventory', 'sales', 'reports', 'ai-assistant'],
      },
    },
  });

  console.log('✅ Branch created:', branch.name);

  // Create super admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@martinpos.com' },
    update: {},
    create: {
      email: 'admin@martinpos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      branchId: branch.id,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Abarrotes',
        description: 'Productos de almacén',
        branchId: branch.id,
        icon: '📦',
        color: '#f59e0b',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Frutas y Verduras',
        description: 'Productos perecederos',
        branchId: branch.id,
        icon: '🥬',
        color: '#10b981',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas',
        description: 'Bebidas y líquidos',
        branchId: branch.id,
        icon: '🥤',
        color: '#3b82f6',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lácteos',
        description: 'Productos lácteos',
        branchId: branch.id,
        icon: '🥛',
        color: '#8b5cf6',
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.length);

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'ABR-000001',
        barcode: '7800123456789',
        name: 'Arroz Grado 1 - 1kg',
        description: 'Arroz blanco grado 1',
        price: 1500,
        costPrice: 1000,
        stock: 50,
        minStock: 10,
        maxStock: 100,
        unit: 'UN',
        categoryId: categories[0].id,
        branchId: branch.id,
        isPerishable: false,
        taxable: true,
        taxRate: 0.19,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FRU-000001',
        barcode: '2000000000001',
        name: 'Manzanas Rojas',
        description: 'Manzanas rojas por kilo',
        price: 2500,
        costPrice: 1500,
        stock: 25.5,
        minStock: 5,
        maxStock: 50,
        unit: 'KG',
        categoryId: categories[1].id,
        branchId: branch.id,
        isPerishable: true,
        requiresWeighing: true,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        taxable: true,
        taxRate: 0.19,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'BEB-000001',
        barcode: '7800987654321',
        name: 'Coca Cola 1.5L',
        description: 'Bebida gaseosa',
        price: 1800,
        costPrice: 1200,
        stock: 30,
        minStock: 10,
        maxStock: 60,
        unit: 'UN',
        categoryId: categories[2].id,
        branchId: branch.id,
        isPerishable: false,
        taxable: true,
        taxRate: 0.19,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'LAC-000001',
        barcode: '7800555666777',
        name: 'Leche Entera 1L',
        description: 'Leche entera pasteurizada',
        price: 1200,
        costPrice: 800,
        stock: 20,
        minStock: 8,
        maxStock: 40,
        unit: 'UN',
        categoryId: categories[3].id,
        branchId: branch.id,
        isPerishable: true,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        taxable: true,
        taxRate: 0.19,
      },
    }),
  ]);

  console.log('✅ Products created:', products.length);

  // Create a sample customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Cliente Genérico',
      email: 'cliente@example.com',
      phone: '+56987654321',
      branchId: branch.id,
      loyaltyPoints: 0,
      totalPurchases: 0,
    },
  });

  console.log('✅ Customer created:', customer.name);

  // Create tables for restaurant module
  if (branch.moduleType === ModuleType.RESTAURANT || branch.moduleType === ModuleType.ALL) {
    const tables = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        prisma.table.create({
          data: {
            number: `${i + 1}`,
            capacity: Math.floor(Math.random() * 4) + 2, // 2-6 people
            branchId: branch.id,
          },
        })
      )
    );
    console.log('✅ Tables created:', tables.length);
  }

  // ============ EXTENDED FEATURES DEMO DATA ============

  // 1. Loyalty Program
  const loyaltyProgram = await prisma.loyaltyProgram.create({
    data: {
      name: 'Programa VIP Martin POS',
      description: 'Gana puntos por cada compra',
      pointsPerDollar: 10,
      dollarPerPoint: 0.01,
      minPointsToRedeem: 100,
      isActive: true,
      branchId: branch.id,
    },
  });

  // Add loyalty points to customer
  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer.id,
      programId: loyaltyProgram.id,
      points: 500,
      type: 'EARNED',
      description: 'Bono de bienvenida',
      balanceAfter: 500,
    },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { loyaltyPoints: 500 },
  });

  console.log('✅ Loyalty program created');

  // 2. Employees with shifts and commissions
  const cashier = await prisma.user.create({
    data: {
      email: 'cajero@martinpos.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: UserRole.CASHIER,
      isActive: true,
      branchId: branch.id,
    },
  });

  const shift = await prisma.employeeShift.create({
    data: {
      userId: cashier.id,
      startTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      endTime: new Date(),
      hoursWorked: 8,
    },
  });

  console.log('✅ Employees and shifts created');

  // 3. Second branch for transfers
  const secondBranch = await prisma.branch.create({
    data: {
      name: 'Sucursal Norte',
      address: 'Av. Norte 456',
      phone: '+56923456789',
      email: 'norte@martinpos.com',
      moduleType: ModuleType.ALL,
      isActive: true,
      config: {
        currency: 'CLP',
        timezone: 'America/Santiago',
        taxRate: 0.19,
      },
    },
  });

  // Create transfer between branches
  const transfer = await prisma.inventoryTransfer.create({
    data: {
      transferNumber: 'TRF-000001',
      status: 'PENDING',
      fromBranchId: branch.id,
      toBranchId: secondBranch.id,
      createdById: admin.id,
      notes: 'Transferencia inicial de productos',
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 10,
          },
        ],
      },
    },
  });

  console.log('✅ Branches and transfers created');

  // 4. Promotions
  const promotion = await prisma.promotion.create({
    data: {
      name: '2x1 en Bebidas',
      description: 'Compra 2 bebidas y paga 1',
      type: 'BUY_X_GET_Y',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      branchId: branch.id,
      conditions: {
        minQuantity: 2,
        applicableCategories: [categories[2].id],
      },
    },
  });

  const combo = await prisma.promotion.create({
    data: {
      name: 'Combo Desayuno',
      description: 'Leche + Pan a precio especial',
      type: 'COMBO',
      discountType: 'FIXED',
      discountValue: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isActive: true,
      branchId: branch.id,
      comboProducts: {
        create: [
          {
            productId: products[3].id, // Leche
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Promotions created');

  // 5. Sample sale with invoice
  const sale = await prisma.sale.create({
    data: {
      saleNumber: 'VTA-000001',
      subtotal: 3300,
      tax: 627,
      discount: 0,
      total: 3927,
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      branchId: branch.id,
      userId: cashier.id,
      customerId: customer.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            price: 1500,
            subtotal: 1500,
            tax: 285,
            total: 1785,
          },
          {
            productId: products[2].id,
            quantity: 1,
            price: 1800,
            subtotal: 1800,
            tax: 342,
            total: 2142,
          },
        ],
      },
    },
  });

  // Create invoice for the sale
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-000001',
      type: 'INVOICE',
      status: 'ISSUED',
      issuedAt: new Date(),
      saleId: sale.id,
      customerId: customer.id,
      branchId: branch.id,
      subtotal: 3300,
      tax: 627,
      total: 3927,
      items: {
        create: [
          {
            description: 'Arroz Grado 1 - 1kg',
            quantity: 1,
            unitPrice: 1500,
            subtotal: 1500,
            tax: 285,
            total: 1785,
          },
          {
            description: 'Coca Cola 1.5L',
            quantity: 1,
            unitPrice: 1800,
            subtotal: 1800,
            tax: 342,
            total: 2142,
          },
        ],
      },
    },
  });

  // Create commission for the sale
  await prisma.commission.create({
    data: {
      userId: cashier.id,
      saleId: sale.id,
      baseSaleAmount: 3927,
      percentage: 3,
      amount: 117.81,
      status: 'PENDING',
    },
  });

  console.log('✅ Sale and invoice created');

  // 6. Layaway (Apartado)
  const layaway = await prisma.layaway.create({
    data: {
      layawayNumber: 'APT-000001',
      customerId: customer.id,
      branchId: branch.id,
      totalAmount: 5000,
      paidAmount: 2000,
      remainingAmount: 3000,
      status: 'ACTIVE',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 3,
            price: 1500,
            subtotal: 4500,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 2000,
            paymentMethod: 'CASH',
            userId: cashier.id,
          },
        ],
      },
    },
  });

  console.log('✅ Layaway created');

  // 7. Delivery Order
  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      saleId: sale.id,
      provider: 'UBER_EATS',
      status: 'PENDING',
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: 'Calle Ejemplo 789, Depto 12',
      deliveryFee: 2500,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
    },
  });

  console.log('✅ Delivery order created');

  // 8. Fraud Alert (demo)
  const fraudAlert = await prisma.fraudAlert.create({
    data: {
      type: 'UNUSUAL_AMOUNT',
      severity: 'MEDIUM',
      description: 'Venta con monto inusualmente alto detectada',
      saleId: sale.id,
      status: 'PENDING',
      detectedAt: new Date(),
    },
  });

  console.log('✅ Fraud alert created');

  // 9. AI Records
  const ocrDoc = await prisma.aIOCRDocument.create({
    data: {
      imageUrl: 'https://example.com/invoice.jpg',
      documentType: 'SUPPLIER_INVOICE',
      extractedData: {
        supplier: 'Proveedor Demo',
        total: 50000,
        items: [
          { name: 'Producto 1', quantity: 10, price: 5000 },
        ],
      },
      confidence: 0.95,
      userId: admin.id,
      verified: false,
    },
  });

  const voiceCommand = await prisma.aIVoiceCommand.create({
    data: {
      transcript: 'Agregar dos coca colas a la venta',
      intent: 'ADD_TO_SALE',
      entities: {
        product: 'coca cola',
        quantity: 2,
      },
      confidence: 0.92,
      userId: cashier.id,
      executed: true,
    },
  });

  const productRecog = await prisma.aIProductRecognition.create({
    data: {
      imageUrl: 'https://example.com/product.jpg',
      recognizedProductId: products[2].id,
      confidence: 0.88,
      userId: cashier.id,
      verified: true,
    },
  });

  console.log('✅ AI records created');

  // 10. Consignment
  const consignment = await prisma.consignment.create({
    data: {
      consignmentNumber: 'CONS-000001',
      supplierName: 'Artesanías Don José',
      supplierContact: '+56911223344',
      commissionRate: 20,
      status: 'ACTIVE',
      branchId: branch.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 5,
            quantitySold: 2,
            unitPrice: 1500,
          },
        ],
      },
    },
  });

  console.log('✅ Consignment created');

  // 11. Payment Gateway Transaction
  const gatewayTx = await prisma.paymentGatewayTransaction.create({
    data: {
      saleId: sale.id,
      gateway: 'MERCADO_PAGO',
      transactionId: 'MP-123456789',
      amount: 3927,
      currency: 'CLP',
      status: 'APPROVED',
      paymentMethod: 'CREDIT_CARD',
      response: {
        status: 'approved',
        status_detail: 'accredited',
      },
    },
  });

  console.log('✅ Payment gateway transaction created');

  // 12. Hardware Integration
  const scale = await prisma.scale.create({
    data: {
      name: 'Balanza Principal',
      brand: 'Systel',
      model: 'Croma',
      serialPort: '/dev/ttyUSB0',
      baudRate: 9600,
      isActive: true,
      branchId: branch.id,
    },
  });

  const tempLog = await prisma.temperatureLog.create({
    data: {
      productId: products[1].id, // Manzanas
      temperature: 4.5,
      humidity: 65,
      location: 'Cámara frigorífica principal',
      branchId: branch.id,
    },
  });

  console.log('✅ Hardware records created');

  // 13. Customer preferences (AI learning)
  await prisma.customerPreference.create({
    data: {
      customerId: customer.id,
      productId: products[2].id, // Coca Cola
      frequency: 15,
      lastPurchase: new Date(),
      averageQuantity: 2,
      preferredDayOfWeek: 5, // Friday
      preferredTimeOfDay: 18, // 6 PM
    },
  });

  console.log('✅ Customer preferences created');

  // ============ BOTILLERÍA MODULE DEMO DATA ============

  // Create Botillería branch
  const botilleriaBranch = await prisma.branch.create({
    data: {
      name: 'Botillería Don Vino',
      address: 'Av. Providencia 1234',
      phone: '+56934567890',
      email: 'botilleria@martinpos.com',
      moduleType: 'BOTILLERIA' as any,
      isActive: true,
      config: {
        currency: 'CLP',
        timezone: 'America/Santiago',
        taxRate: 0.19,
        alcoholSalesRestriction: true,
      },
    },
  });

  // Create Botillería category
  const botilleriaCategory = await prisma.category.create({
    data: {
      name: 'Vinos Tintos',
      description: 'Vinos tintos de distintas cepas',
      icon: '🍷',
      color: '#722F37',
      branchId: botilleriaBranch.id,
    },
  });

  // Create wine product
  const wineProduct = await prisma.product.create({
    data: {
      sku: 'VIN-000001',
      barcode: '7800999888777',
      name: 'Casillero del Diablo Cabernet Sauvignon',
      description: 'Vino tinto chileno de Concha y Toro',
      price: 6990,
      costPrice: 4500,
      stock: 24,
      minStock: 6,
      maxStock: 48,
      unit: 'UN',
      categoryId: botilleriaCategory.id,
      branchId: botilleriaBranch.id,
      isPerishable: false,
      taxable: true,
      taxRate: 0.19,
    },
  });

  // Create alcoholic product details
  await prisma.alcoholicProduct.create({
    data: {
      productId: wineProduct.id,
      alcoholContent: 13.5,
      category: 'WINE_RED',
      vintage: 2022,
      origin: 'Chile - Valle Central',
      winery: 'Concha y Toro',
      grapeVariety: 'Cabernet Sauvignon',
      servingTemperature: '16-18°C',
      pairings: 'Carnes rojas, pastas, quesos maduros',
      tastingNotes: 'Color rubí intenso, aromas a frutos rojos y notas de vainilla',
      rating: 4.2,
      taxCategory: 'STANDARD',
      volume: 750,
      container: 'BOTTLE',
      isReturnable: true,
      depositAmount: 500,
    },
  });

  // Create beer product
  const beerProduct = await prisma.product.create({
    data: {
      sku: 'CER-000001',
      barcode: '7800111222333',
      name: 'Kunstmann Lager',
      description: 'Cerveza artesanal tipo Lager',
      price: 1990,
      costPrice: 1200,
      stock: 48,
      minStock: 12,
      maxStock: 96,
      unit: 'UN',
      categoryId: botilleriaCategory.id,
      branchId: botilleriaBranch.id,
      isPerishable: true,
      expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      taxable: true,
      taxRate: 0.19,
    },
  });

  await prisma.alcoholicProduct.create({
    data: {
      productId: beerProduct.id,
      alcoholContent: 5.0,
      category: 'BEER_CRAFT',
      origin: 'Chile - Valdivia',
      winery: 'Cervecería Kunstmann',
      servingTemperature: '4-6°C',
      pairings: 'Pizza, hamburguesas, comida alemana',
      rating: 4.5,
      taxCategory: 'STANDARD',
      volume: 500,
      container: 'BOTTLE',
      isReturnable: true,
      depositAmount: 300,
    },
  });

  // Create spirits product
  const piscoProduct = await prisma.product.create({
    data: {
      sku: 'PIS-000001',
      barcode: '7800444555666',
      name: 'Pisco Control Gran Reservado',
      description: 'Pisco chileno 40°',
      price: 12990,
      costPrice: 8500,
      stock: 12,
      minStock: 3,
      maxStock: 24,
      unit: 'UN',
      categoryId: botilleriaCategory.id,
      branchId: botilleriaBranch.id,
      isPerishable: false,
      taxable: true,
      taxRate: 0.19,
    },
  });

  await prisma.alcoholicProduct.create({
    data: {
      productId: piscoProduct.id,
      alcoholContent: 40.0,
      category: 'SPIRITS_PISCO',
      origin: 'Chile - Valle del Elqui',
      winery: 'Control',
      servingTemperature: 'Ambiente o con hielo',
      pairings: 'Pisco sour, cócteles',
      rating: 4.3,
      taxCategory: 'HIGH', // 31.5% ILA for spirits
      volume: 700,
      container: 'BOTTLE',
      isReturnable: false,
    },
  });

  // Sale hours restriction
  await prisma.saleHoursRestriction.createMany({
    data: [
      { branchId: botilleriaBranch.id, dayOfWeek: 0, openTime: '09:00', closeTime: '23:00' }, // Sunday
      { branchId: botilleriaBranch.id, dayOfWeek: 1, openTime: '09:00', closeTime: '23:00' }, // Monday
      { branchId: botilleriaBranch.id, dayOfWeek: 2, openTime: '09:00', closeTime: '23:00' }, // Tuesday
      { branchId: botilleriaBranch.id, dayOfWeek: 3, openTime: '09:00', closeTime: '23:00' }, // Wednesday
      { branchId: botilleriaBranch.id, dayOfWeek: 4, openTime: '09:00', closeTime: '23:00' }, // Thursday
      { branchId: botilleriaBranch.id, dayOfWeek: 5, openTime: '09:00', closeTime: '00:00' }, // Friday
      { branchId: botilleriaBranch.id, dayOfWeek: 6, openTime: '09:00', closeTime: '00:00' }, // Saturday
    ],
  });

  // Wine tasting event
  const tastingEvent = await prisma.tastingEvent.create({
    data: {
      name: 'Cata de Vinos del Valle Central',
      description: 'Degustación de 5 vinos premium del Valle Central de Chile',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      capacity: 20,
      pricePerPerson: 25000,
      status: 'OPEN_REGISTRATION',
      branchId: botilleriaBranch.id,
      products: {
        create: [{ productId: wineProduct.id, servingSize: '50ml' }],
      },
    },
  });

  // Wine club subscription
  await prisma.wineClubSubscription.create({
    data: {
      customerId: customer.id,
      planType: 'PREMIUM',
      status: 'ACTIVE',
      monthlyAmount: 45000,
      bottlesPerMonth: 3,
      preferredCategories: JSON.stringify(['WINE_RED', 'WINE_WHITE']),
      nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      branchId: botilleriaBranch.id,
    },
  });

  console.log('✅ Botillería module data created');

  // ============ TRANSBANK INTEGRATION DEMO DATA ============

  // Transbank config for main branch
  const tbkConfig = await prisma.transbankConfig.create({
    data: {
      branchId: branch.id,
      environment: 'integration',
      commerceCode: '597055555532',
      apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
      isWebpayEnabled: true,
      isOneclickEnabled: false,
      isPOSEnabled: true,
    },
  });

  // Sample Transbank transaction
  await prisma.transbankTransaction.create({
    data: {
      saleId: sale.id,
      buyOrder: `MPOS-DEMO-${Date.now()}`,
      sessionId: `SES-${sale.id}`,
      amount: 3927,
      status: 'AUTHORIZED',
      token: `TBK-DEMO-${Date.now()}`,
      responseCode: 0,
      authorizationCode: '123456',
      cardNumber: '6623',
      cardType: 'CREDIT',
      installmentsNumber: 0,
      environment: 'integration',
      completedAt: new Date(),
    },
  });

  // ============ PHYSICAL POS TERMINAL DEMO DATA ============

  // POS Terminal 1 - Main cashier
  const posTerminal1 = await prisma.pOSTerminal.create({
    data: {
      terminalId: 'TBK-POS-001',
      serialNumber: 'VX520-123456',
      model: 'Verifone VX520',
      name: 'Caja Principal',
      location: 'Entrada principal',
      connectionType: 'USB',
      port: '/dev/ttyUSB0',
      status: 'CONNECTED',
      branchId: branch.id,
      configId: tbkConfig.id,
      isActive: true,
      lastPingAt: new Date(),
    },
  });

  // POS Terminal 2 - Secondary cashier
  const posTerminal2 = await prisma.pOSTerminal.create({
    data: {
      terminalId: 'TBK-POS-002',
      serialNumber: 'VX680-789012',
      model: 'Verifone VX680',
      name: 'Caja Secundaria',
      location: 'Sector bebidas',
      connectionType: 'WIFI',
      ipAddress: '192.168.1.101',
      status: 'DISCONNECTED',
      branchId: branch.id,
      configId: tbkConfig.id,
      isActive: true,
    },
  });

  // Sample POS Transaction
  await prisma.pOSTransaction.create({
    data: {
      saleId: sale.id,
      terminalId: posTerminal1.id,
      operationCode: '0200', // Sale
      amount: 3927,
      tip: 500,
      totalAmount: 4427,
      installments: 0,
      status: 'APPROVED',
      authorizationCode: 'A1B2C3',
      responseCode: 0,
      responseMessage: 'Aprobado',
      cardNumber: '****6623',
      cardType: 'VISA',
      cardBrand: 'CREDIT',
      voucherNumber: 'V-001234',
      commerceCode: '597055555532',
      terminalCode: 'TBK-POS-001',
      transactionDate: new Date(),
      transactionTime: new Date().toTimeString().split(' ')[0],
      printData: `
═══════════════════════════════
      COMPROBANTE DE VENTA
        TRANSBANK POS
═══════════════════════════════
Fecha: ${new Date().toLocaleDateString('es-CL')}
Hora: ${new Date().toLocaleTimeString('es-CL')}

Tarjeta: VISA
Número: ****6623

Monto:    $3,927
Propina:  $500
────────────────────────────────
TOTAL:    $4,427

Estado: APROBADO
═══════════════════════════════
      `.trim(),
      completedAt: new Date(),
    },
  });

  // Create POS Batch
  await prisma.pOSBatch.create({
    data: {
      branchId: branch.id,
      terminalId: posTerminal1.id,
      batchNumber: 1,
      status: 'OPEN',
      totalTransactions: 1,
      totalSales: 1,
      totalVoids: 0,
      totalAmount: 4427,
      totalTips: 500,
      creditAmount: 4427,
      creditCount: 1,
      debitAmount: 0,
      debitCount: 0,
    },
  });

  console.log('✅ Transbank integration data created');
  console.log('✅ Physical POS terminal data created');

  // ============ SII ELECTRONIC INVOICING DEMO DATA ============

  // SII config for main branch
  await prisma.sIIConfig.create({
    data: {
      branchId: branch.id,
      rutEmisor: '76.XXX.XXX-X',
      razonSocial: 'Martin POS SpA',
      giroEmisor: 'Venta al por menor de alimentos y bebidas',
      direccionOrigen: 'Av. Principal 123',
      comunaOrigen: 'Santiago',
      ciudadOrigen: 'Santiago',
      environment: 'certificacion',
      isActive: true,
      folioBoletaInicio: 1,
      folioBoletaActual: 1,
      folioBoletaFin: 1000,
      folioFacturaInicio: 1,
      folioFacturaActual: 1,
      folioFacturaFin: 500,
    },
  });

  // Sample DTE (Boleta)
  const dteBoleta = await prisma.dTEDocument.create({
    data: {
      branchId: branch.id,
      saleId: sale.id,
      tipoDTE: 39, // Boleta
      folio: 1,
      rutEmisor: '76.XXX.XXX-X',
      razonSocialEmisor: 'Martin POS SpA',
      montoNeto: 3300,
      montoExento: 0,
      tasaIVA: 19,
      iva: 627,
      montoTotal: 3927,
      status: 'ACCEPTED',
      fechaEmision: new Date(),
      acceptedBySIIAt: new Date(),
      items: {
        create: [
          {
            numeroLinea: 1,
            nombreItem: 'Arroz Grado 1 - 1kg',
            cantidad: 1,
            precioUnitario: 1500,
            montoItem: 1500,
          },
          {
            numeroLinea: 2,
            nombreItem: 'Coca Cola 1.5L',
            cantidad: 1,
            precioUnitario: 1800,
            montoItem: 1800,
          },
        ],
      },
    },
  });

  // DTE Log
  await prisma.dTELog.create({
    data: {
      dteId: dteBoleta.id,
      action: 'ACCEPTED',
      status: 'SUCCESS',
      message: 'Boleta aceptada por SII',
    },
  });

  console.log('✅ SII electronic invoicing data created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 DEMO DATA SUMMARY:');
  console.log('  - 3 Branches (Principal + Norte + Botillería)');
  console.log('  - 2 Users (Admin + Cajero)');
  console.log('  - 5 Categories');
  console.log('  - 7 Products (4 general + 3 alcohol)');
  console.log('  - 1 Customer with loyalty points');
  console.log('  - 1 Loyalty Program');
  console.log('  - 1 Employee shift');
  console.log('  - 1 Inventory transfer');
  console.log('  - 2 Promotions (2x1 + Combo)');
  console.log('  - 1 Sale with invoice');
  console.log('  - 1 Layaway/Apartado');
  console.log('  - 1 Delivery order');
  console.log('  - 1 Fraud alert');
  console.log('  - 3 AI records (OCR, Voice, Recognition)');
  console.log('  - 1 Consignment');
  console.log('  - 1 Payment gateway transaction');
  console.log('  - 1 Scale + 1 Temperature log');
  console.log('');
  console.log('🍷 BOTILLERÍA:');
  console.log('  - 3 Alcoholic products (Wine, Beer, Pisco)');
  console.log('  - 7 Sale hours restrictions');
  console.log('  - 1 Tasting event');
  console.log('  - 1 Wine club subscription');
  console.log('');
  console.log('💳 TRANSBANK:');
  console.log('  - 1 Transbank configuration (integration)');
  console.log('  - 1 Sample Webpay transaction');
  console.log('');
  console.log('📄 SII (Facturación Electrónica):');
  console.log('  - 1 SII configuration');
  console.log('  - 1 Sample DTE (Boleta)');
  console.log('');
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('  Admin:   admin@martinpos.com / admin123');
  console.log('  Cashier: cajero@martinpos.com / admin123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
