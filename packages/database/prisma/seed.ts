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

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
