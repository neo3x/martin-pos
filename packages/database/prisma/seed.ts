import { PrismaClient, ModuleType, UserRole, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_PASSWORD_HASH = '$2b$10$TqkNqM4F2NfB9XHDUBNa7ebuQhMdvb5CWJPz1wHbPLbHygrkwQnzi'; // admin123

type Blueprint = {
  branchName: string;
  branchEmail: string;
  categories: { name: string; description: string }[];
  products: {
    sku: string;
    name: string;
    description: string;
    categoryName: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    expirationDays?: number;
  }[];
  customers: { name: string; email: string; phone: string; address: string }[];
  tables?: { number: string; capacity: number; status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' }[];
};

const blueprints: Record<Exclude<ModuleType, 'ALL'>, Blueprint> = {
  RESTAURANT: {
    branchName: 'Demo Restaurante',
    branchEmail: 'demo.restaurant@martinpos.local',
    categories: [
      { name: 'Entradas', description: 'Aperitivos y entradas' },
      { name: 'Fondos', description: 'Platos principales' },
      { name: 'Postres', description: 'Postres de la casa' },
      { name: 'Bebidas', description: 'Jugos y bebidas' },
    ],
    products: [
      {
        sku: 'RES-ENT-001',
        name: 'Empanadas de queso',
        description: 'Porcion x3',
        categoryName: 'Entradas',
        price: 4990,
        costPrice: 2800,
        stock: 24,
        minStock: 8,
      },
      {
        sku: 'RES-FON-001',
        name: 'Lomo vetado',
        description: 'Con pure rustico',
        categoryName: 'Fondos',
        price: 14990,
        costPrice: 8600,
        stock: 16,
        minStock: 6,
      },
      {
        sku: 'RES-POS-001',
        name: 'Cheesecake frutos rojos',
        description: 'Porcion individual',
        categoryName: 'Postres',
        price: 4990,
        costPrice: 2100,
        stock: 10,
        minStock: 4,
        expirationDays: 2,
      },
      {
        sku: 'RES-BEB-001',
        name: 'Limonada menta',
        description: '500ml',
        categoryName: 'Bebidas',
        price: 2990,
        costPrice: 1200,
        stock: 32,
        minStock: 10,
      },
    ],
    customers: [
      { name: 'Maria Lopez', email: 'maria.restaurant@demo.local', phone: '+56990000111', address: 'Centro 123' },
      { name: 'Jorge Diaz', email: 'jorge.restaurant@demo.local', phone: '+56990000222', address: 'Norte 55' },
    ],
    tables: [
      { number: '1', capacity: 4, status: 'AVAILABLE' },
      { number: '2', capacity: 2, status: 'OCCUPIED' },
      { number: '3', capacity: 6, status: 'AVAILABLE' },
      { number: '4', capacity: 4, status: 'RESERVED' },
      { number: '5', capacity: 2, status: 'CLEANING' },
      { number: '6', capacity: 4, status: 'OCCUPIED' },
    ],
  },
  MINIMARKET: {
    branchName: 'Demo Minimarket',
    branchEmail: 'demo.minimarket@martinpos.local',
    categories: [
      { name: 'Abarrotes', description: 'Despensa diaria' },
      { name: 'Bebidas', description: 'Bebidas y jugos' },
      { name: 'Snacks', description: 'Dulces y salados' },
      { name: 'Limpieza', description: 'Limpieza hogar y negocio' },
    ],
    products: [
      {
        sku: 'MIN-ABA-001',
        name: 'Arroz 1kg',
        description: 'Grado 1',
        categoryName: 'Abarrotes',
        price: 1490,
        costPrice: 980,
        stock: 40,
        minStock: 12,
      },
      {
        sku: 'MIN-ABA-002',
        name: 'Fideos spaghetti',
        description: '400g',
        categoryName: 'Abarrotes',
        price: 990,
        costPrice: 640,
        stock: 48,
        minStock: 14,
      },
      {
        sku: 'MIN-BEB-001',
        name: 'Bebida cola 1.5L',
        description: 'Retornable',
        categoryName: 'Bebidas',
        price: 1990,
        costPrice: 1290,
        stock: 28,
        minStock: 10,
      },
      {
        sku: 'MIN-SNK-001',
        name: 'Papas fritas 140g',
        description: 'Sabor original',
        categoryName: 'Snacks',
        price: 1790,
        costPrice: 1090,
        stock: 30,
        minStock: 10,
      },
      {
        sku: 'MIN-LIM-001',
        name: 'Detergente 3L',
        description: 'Ropa',
        categoryName: 'Limpieza',
        price: 5490,
        costPrice: 3900,
        stock: 12,
        minStock: 6,
      },
    ],
    customers: [
      { name: 'Camila Soto', email: 'camila.minimarket@demo.local', phone: '+56990000333', address: 'Sur 98' },
      { name: 'Pedro Rojas', email: 'pedro.minimarket@demo.local', phone: '+56990000444', address: 'Poniente 44' },
    ],
  },
  BOTILLERIA: {
    branchName: 'Demo Botilleria',
    branchEmail: 'demo.botilleria@martinpos.local',
    categories: [
      { name: 'Vinos', description: 'Tintos y blancos' },
      { name: 'Cervezas', description: 'Lager y artesanales' },
      { name: 'Destilados', description: 'Whisky, vodka, ron y pisco' },
      { name: 'Mixers', description: 'Energeticas y gaseosas' },
    ],
    products: [
      {
        sku: 'BOT-VIN-001',
        name: 'Vino tinto reserva',
        description: '750ml',
        categoryName: 'Vinos',
        price: 8990,
        costPrice: 5400,
        stock: 20,
        minStock: 8,
      },
      {
        sku: 'BOT-CER-001',
        name: 'Cerveza lager 330ml',
        description: 'Unidad',
        categoryName: 'Cervezas',
        price: 1690,
        costPrice: 900,
        stock: 55,
        minStock: 15,
      },
      {
        sku: 'BOT-DES-001',
        name: 'Whisky blend',
        description: '700ml',
        categoryName: 'Destilados',
        price: 18990,
        costPrice: 12900,
        stock: 10,
        minStock: 5,
      },
      {
        sku: 'BOT-MIX-001',
        name: 'Bebida energetica',
        description: '250ml',
        categoryName: 'Mixers',
        price: 1490,
        costPrice: 850,
        stock: 40,
        minStock: 12,
      },
    ],
    customers: [
      { name: 'Fernanda Ruiz', email: 'fernanda.botilleria@demo.local', phone: '+56990000555', address: 'Centro 999' },
      { name: 'Sebastian Reyes', email: 'sebastian.botilleria@demo.local', phone: '+56990000666', address: 'Los Pinos 13' },
    ],
  },
  BOOKSTORE: {
    branchName: 'Demo Libreria Bazar',
    branchEmail: 'demo.bookstore@martinpos.local',
    categories: [
      { name: 'Libros', description: 'Lectura y estudio' },
      { name: 'Cuadernos', description: 'Escolares y universitarios' },
      { name: 'Escritura', description: 'Lapices y marcadores' },
      { name: 'Oficina', description: 'Papeleria y accesorios' },
    ],
    products: [
      {
        sku: 'LIB-BOO-001',
        name: 'Novela clasica',
        description: 'Edicion tapa blanda',
        categoryName: 'Libros',
        price: 12990,
        costPrice: 7900,
        stock: 18,
        minStock: 6,
      },
      {
        sku: 'LIB-CUA-001',
        name: 'Cuaderno universitario',
        description: '100 hojas',
        categoryName: 'Cuadernos',
        price: 2490,
        costPrice: 1400,
        stock: 45,
        minStock: 15,
      },
      {
        sku: 'LIB-ESC-001',
        name: 'Set marcadores x12',
        description: 'Punta fina',
        categoryName: 'Escritura',
        price: 5990,
        costPrice: 3400,
        stock: 20,
        minStock: 8,
      },
      {
        sku: 'LIB-OFI-001',
        name: 'Resma papel carta',
        description: '500 hojas',
        categoryName: 'Oficina',
        price: 6990,
        costPrice: 4300,
        stock: 14,
        minStock: 6,
      },
    ],
    customers: [
      { name: 'Daniela Torres', email: 'daniela.bookstore@demo.local', phone: '+56990000777', address: 'Lago 45' },
      { name: 'Ignacio Morales', email: 'ignacio.bookstore@demo.local', phone: '+56990000888', address: 'Cordillera 81' },
    ],
  },
};

function getModulePrefix(moduleType: ModuleType) {
  return moduleType.substring(0, 3);
}

function getDefaultAdminEmail(moduleType: ModuleType) {
  if (moduleType === ModuleType.MINIMARKET) return 'admin@martinpos.com';
  return `admin.${moduleType.toLowerCase()}@martinpos.com`;
}

async function ensureBranch(moduleType: Exclude<ModuleType, 'ALL'>) {
  const blueprint = blueprints[moduleType];
  const existing = await prisma.branch.findFirst({
    where: { email: blueprint.branchEmail, deletedAt: null },
  });

  if (existing) {
    return prisma.branch.update({
      where: { id: existing.id },
      data: {
        name: blueprint.branchName,
        moduleType,
        config: {
          currency: 'CLP',
          timezone: 'America/Santiago',
          taxRate: 0.19,
          seededAt: new Date().toISOString(),
          moduleType,
        },
      },
    });
  }

  return prisma.branch.create({
    data: {
      name: blueprint.branchName,
      address: 'Demo Street 123',
      phone: '+56911111111',
      email: blueprint.branchEmail,
      moduleType,
      config: {
        currency: 'CLP',
        timezone: 'America/Santiago',
        taxRate: 0.19,
        seededAt: new Date().toISOString(),
        moduleType,
      },
    },
  });
}

async function ensureAdmin(branchId: string, moduleType: ModuleType, passwordHash: string) {
  const email = getDefaultAdminEmail(moduleType);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return prisma.user.update({
      where: { email },
      data: {
        password: passwordHash,
        firstName: 'Admin',
        lastName: moduleType === ModuleType.MINIMARKET ? 'Principal' : moduleType,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        branchId,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName: 'Admin',
      lastName: moduleType === ModuleType.MINIMARKET ? 'Principal' : moduleType,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      branchId,
    },
  });
}

async function seedModuleData(branchId: string, userId: string, moduleType: Exclude<ModuleType, 'ALL'>) {
  const blueprint = blueprints[moduleType];
  const categoryIds = new Map<string, string>();
  const products: { id: string; price: number; stock: number; minStock: number }[] = [];

  for (const category of blueprint.categories) {
    const existing = await prisma.category.findFirst({
      where: { branchId, name: category.name, deletedAt: null },
    });

    const saved = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { description: category.description },
        })
      : await prisma.category.create({
          data: {
            branchId,
            name: category.name,
            description: category.description,
          },
        });

    categoryIds.set(category.name, saved.id);
  }

  for (const product of blueprint.products) {
    const expirationDate = product.expirationDays
      ? new Date(Date.now() + product.expirationDays * 24 * 60 * 60 * 1000)
      : null;
    const payload = {
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: 'UN',
      status: 'ACTIVE' as const,
      isPerishable: !!product.expirationDays,
      expirationDate,
      taxable: true,
      taxRate: 0.19,
      branchId,
      categoryId: categoryIds.get(product.categoryName)!,
    };

    const existing = await prisma.product.findUnique({ where: { sku: product.sku } });
    const saved = existing
      ? await prisma.product.update({ where: { sku: product.sku }, data: payload })
      : await prisma.product.create({ data: { sku: product.sku, ...payload } });

    products.push({
      id: saved.id,
      price: Number(saved.price),
      stock: Number(saved.stock),
      minStock: Number(saved.minStock),
    });
  }

  for (const customer of blueprint.customers) {
    const existing = await prisma.customer.findFirst({
      where: { branchId, email: customer.email, deletedAt: null },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          branchId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
      });
    }
  }

  const paymentMethods: PaymentMethod[] = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER, PaymentMethod.QR];
  for (let i = 0; i < 8; i += 1) {
    const day = new Date();
    day.setDate(day.getDate() - (i % 4));
    day.setHours(11 + i, 5, 0, 0);

    const saleNumber = `${getModulePrefix(moduleType)}-${day.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
    const existing = await prisma.sale.findFirst({ where: { saleNumber, branchId } });
    if (existing) continue;

    const p1 = products[i % products.length];
    const p2 = products[(i + 1) % products.length];
    const q1 = 1 + (i % 2);
    const q2 = 1 + ((i + 1) % 3);
    const subtotal = q1 * p1.price + q2 * p2.price;
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        status: 'COMPLETED',
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        branchId,
        userId,
        createdAt: day,
        updatedAt: day,
        items: {
          create: [
            {
              productId: p1.id,
              quantity: q1,
              unitPrice: p1.price,
              subtotal: q1 * p1.price,
              tax: Math.round(q1 * p1.price * 0.19),
              discount: 0,
              total: Math.round(q1 * p1.price * 1.19),
            },
            {
              productId: p2.id,
              quantity: q2,
              unitPrice: p2.price,
              subtotal: q2 * p2.price,
              tax: Math.round(q2 * p2.price * 0.19),
              discount: 0,
              total: Math.round(q2 * p2.price * 1.19),
            },
          ],
        },
      },
      include: { items: true },
    });

    for (const item of sale.items) {
      const product = products.find((x) => x.id === item.productId);
      if (!product) continue;
      const previousStock = product.stock;
      const newStock = Math.max(0, previousStock - Number(item.quantity));

      await prisma.stockMovement.create({
        data: {
          type: 'SALE',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: 'Seed demo',
          referenceId: sale.id,
          inputMethod: 'MANUAL',
          productId: product.id,
          branchId,
          userId,
          createdAt: sale.createdAt,
          updatedAt: sale.createdAt,
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
        },
      });
      product.stock = newStock;
    }
  }

  const lowStockProducts = await prisma.product.findMany({
    where: { branchId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, name: true, stock: true, minStock: true },
  });

  for (const product of lowStockProducts.filter((p) => Number(p.stock) <= Number(p.minStock))) {
    const existingAlert = await prisma.inventoryAlert.findFirst({
      where: { branchId, productId: product.id, type: 'LOW_STOCK', isRead: false },
    });
    if (!existingAlert) {
      await prisma.inventoryAlert.create({
        data: {
          branchId,
          productId: product.id,
          type: 'LOW_STOCK',
          message: `Stock bajo para ${product.name}`,
          priority: 'HIGH',
          isRead: false,
        },
      });
    }
  }

  if (moduleType === ModuleType.RESTAURANT && blueprint.tables?.length) {
    const tableIds: string[] = [];
    for (const table of blueprint.tables) {
      const existing = await prisma.table.findFirst({
        where: { branchId, number: table.number, deletedAt: null },
      });
      const saved = existing
        ? await prisma.table.update({
            where: { id: existing.id },
            data: { capacity: table.capacity, status: table.status },
          })
        : await prisma.table.create({
            data: {
              branchId,
              number: table.number,
              capacity: table.capacity,
              status: table.status,
            },
          });
      tableIds.push(saved.id);
    }

    for (let i = 0; i < 4; i += 1) {
      const orderNumber = `RES-ORD-${String(i + 1).padStart(3, '0')}`;
      const existing = await prisma.order.findFirst({ where: { branchId, orderNumber } });
      if (existing) continue;
      const product = products[i % products.length];
      await prisma.order.create({
        data: {
          orderNumber,
          branchId,
          tableId: tableIds[i % tableIds.length],
          waiterId: userId,
          status: ['PENDING', 'PREPARING', 'READY'][i % 3] as any,
          items: {
            create: [
              {
                productId: product.id,
                quantity: 1 + (i % 2),
                status: 'PENDING',
              },
            ],
          },
        },
      });
    }
  }
}

async function main() {
  const modules: Exclude<ModuleType, 'ALL'>[] = [
    ModuleType.RESTAURANT,
    ModuleType.MINIMARKET,
    ModuleType.BOTILLERIA,
    ModuleType.BOOKSTORE,
  ];

  for (const moduleType of modules) {
    const branch = await ensureBranch(moduleType);
    const user = await ensureAdmin(branch.id, moduleType, ADMIN_PASSWORD_HASH);
    await seedModuleData(branch.id, user.id, moduleType);
    console.log(`Seed module ${moduleType}: ${branch.name} (${user.email})`);
  }

  console.log('Seed completed successfully');
  console.log('Main admin: admin@martinpos.com / admin123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
