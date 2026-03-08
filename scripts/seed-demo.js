/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function ymd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

async function ensureUser(email, data) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data,
    });
  }
  return prisma.user.create({ data: { email, ...data } });
}

async function ensureCategory(branchId, name, description) {
  const existing = await prisma.category.findFirst({
    where: { branchId, name, deletedAt: null },
  });
  if (existing) return existing;
  return prisma.category.create({ data: { branchId, name, description } });
}

async function ensureCustomer(branchId, data) {
  const existing = await prisma.customer.findFirst({
    where: { branchId, email: data.email, deletedAt: null },
  });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      ...data,
      branchId,
    },
  });
}

async function ensureTable(branchId, number, capacity) {
  const existing = await prisma.table.findFirst({
    where: { branchId, number, deletedAt: null },
  });
  if (existing) return existing;
  return prisma.table.create({
    data: { branchId, number, capacity, status: "AVAILABLE" },
  });
}

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@martinpos.com" },
  });
  if (!admin) {
    throw new Error("No existe admin@martinpos.com. Inicia sesión una vez y vuelve a ejecutar seed.");
  }

  const branchId = admin.branchId;
  const password = await bcrypt.hash("admin123", 10);
  const cashier = await ensureUser("cajero@martinpos.com", {
    password,
    firstName: "Cajero",
    lastName: "Demo",
    role: "CASHIER",
    isActive: true,
    branchId,
  });

  const catAbarrotes = await ensureCategory(branchId, "Abarrotes", "Productos de almacén");
  const catBebidas = await ensureCategory(branchId, "Bebidas", "Líquidos y refrescos");
  const catLacteos = await ensureCategory(branchId, "Lácteos", "Productos lácteos");
  const catLimpieza = await ensureCategory(branchId, "Limpieza", "Aseo hogar y negocio");
  const catSnacks = await ensureCategory(branchId, "Snacks", "Snacks y dulces");

  const productsData = [
    { sku: "DEMO-ABR-001", name: "Arroz 1kg", price: 1490, costPrice: 1000, stock: 30, minStock: 8, unit: "UN", categoryId: catAbarrotes.id },
    { sku: "DEMO-ABR-002", name: "Fideos 400g", price: 990, costPrice: 650, stock: 50, minStock: 10, unit: "UN", categoryId: catAbarrotes.id },
    { sku: "DEMO-ABR-003", name: "Aceite 1L", price: 2890, costPrice: 2100, stock: 14, minStock: 6, unit: "UN", categoryId: catAbarrotes.id },
    { sku: "DEMO-BEB-001", name: "Cola 1.5L", price: 1990, costPrice: 1350, stock: 20, minStock: 10, unit: "UN", categoryId: catBebidas.id },
    { sku: "DEMO-BEB-002", name: "Jugo Naranja 1L", price: 1690, costPrice: 1100, stock: 18, minStock: 8, unit: "UN", categoryId: catBebidas.id },
    { sku: "DEMO-BEB-003", name: "Agua Mineral 600ml", price: 890, costPrice: 500, stock: 60, minStock: 12, unit: "UN", categoryId: catBebidas.id },
    { sku: "DEMO-LAC-001", name: "Leche Entera 1L", price: 1250, costPrice: 850, stock: 4, minStock: 8, unit: "UN", categoryId: catLacteos.id, isPerishable: true, expirationOffsetDays: 3 },
    { sku: "DEMO-LAC-002", name: "Yogurt Frutilla", price: 690, costPrice: 420, stock: 22, minStock: 10, unit: "UN", categoryId: catLacteos.id, isPerishable: true, expirationOffsetDays: 5 },
    { sku: "DEMO-LAC-003", name: "Queso Laminado", price: 2490, costPrice: 1700, stock: 10, minStock: 5, unit: "UN", categoryId: catLacteos.id, isPerishable: true, expirationOffsetDays: 6 },
    { sku: "DEMO-LIM-001", name: "Detergente 3L", price: 5490, costPrice: 3900, stock: 12, minStock: 5, unit: "UN", categoryId: catLimpieza.id },
    { sku: "DEMO-LIM-002", name: "Cloro 1L", price: 1290, costPrice: 700, stock: 35, minStock: 10, unit: "UN", categoryId: catLimpieza.id },
    { sku: "DEMO-LIM-003", name: "Lavaloza 750ml", price: 1590, costPrice: 950, stock: 28, minStock: 9, unit: "UN", categoryId: catLimpieza.id },
    { sku: "DEMO-SNK-001", name: "Papas Fritas 140g", price: 1790, costPrice: 1100, stock: 26, minStock: 8, unit: "UN", categoryId: catSnacks.id },
    { sku: "DEMO-SNK-002", name: "Chocolate Barra", price: 990, costPrice: 550, stock: 40, minStock: 12, unit: "UN", categoryId: catSnacks.id },
    { sku: "DEMO-SNK-003", name: "Galletas Vainilla", price: 1190, costPrice: 700, stock: 32, minStock: 10, unit: "UN", categoryId: catSnacks.id },
  ];

  const products = [];
  for (const p of productsData) {
    const expirationDate = p.expirationOffsetDays
      ? new Date(Date.now() + p.expirationOffsetDays * 24 * 60 * 60 * 1000)
      : null;
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    const payload = {
      sku: p.sku,
      name: p.name,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      status: "ACTIVE",
      isPerishable: !!p.isPerishable,
      expirationDate,
      categoryId: p.categoryId,
      branchId,
      taxable: true,
      taxRate: 0.19,
    };
    const product = existing
      ? await prisma.product.update({ where: { sku: p.sku }, data: payload })
      : await prisma.product.create({ data: payload });
    products.push(product);
  }

  const customerNames = [
    "María López",
    "Pedro Rojas",
    "Camila Soto",
    "Jorge Díaz",
    "Fernanda Ruiz",
    "Sebastián Reyes",
    "Daniela Torres",
    "Ignacio Morales",
    "Paula Fuentes",
    "Cristian Navarro",
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i += 1) {
    const c = await ensureCustomer(branchId, {
      name: customerNames[i],
      email: `cliente${i + 1}@demo.local`,
      phone: `+56990000${(100 + i).toString()}`,
      loyaltyPoints: (i + 1) * 10,
      totalPurchases: (i + 1) * 15000,
    });
    customers.push(c);
  }

  const tables = [];
  for (let i = 1; i <= 12; i += 1) {
    const table = await ensureTable(branchId, String(i), 2 + (i % 4));
    tables.push(table);
  }

  const paymentMethods = ["CASH", "CARD", "TRANSFER", "QR"];
  const createdSales = [];
  for (let dayOffset = 0; dayOffset < 10; dayOffset += 1) {
    for (let n = 1; n <= 3; n += 1) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      d.setHours(10 + n * 3, 15, 0, 0);
      const saleNumber = `DEMO-${ymd(d)}-${String(n).padStart(2, "0")}`;

      const existing = await prisma.sale.findFirst({
        where: { saleNumber, branchId },
        include: { items: true },
      });
      if (existing) {
        createdSales.push(existing);
        continue;
      }

      const p1 = products[(dayOffset + n) % products.length];
      const p2 = products[(dayOffset + n + 4) % products.length];
      const q1 = 1 + ((dayOffset + n) % 3);
      const q2 = 1 + ((dayOffset + n + 1) % 2);
      const subtotal = q1 * Number(p1.price) + q2 * Number(p2.price);
      const tax = Math.round(subtotal * 0.19);
      const total = subtotal + tax;

      const sale = await prisma.sale.create({
        data: {
          saleNumber,
          status: "COMPLETED",
          subtotal,
          tax,
          discount: 0,
          total,
          paymentMethod: paymentMethods[(dayOffset + n) % paymentMethods.length],
          customerId: customers[(dayOffset + n) % customers.length].id,
          branchId,
          userId: cashier.id,
          createdAt: d,
          updatedAt: d,
          items: {
            create: [
              {
                productId: p1.id,
                quantity: q1,
                unitPrice: p1.price,
                subtotal: q1 * Number(p1.price),
                tax: Math.round(q1 * Number(p1.price) * 0.19),
                discount: 0,
                total: Math.round(q1 * Number(p1.price) * 1.19),
              },
              {
                productId: p2.id,
                quantity: q2,
                unitPrice: p2.price,
                subtotal: q2 * Number(p2.price),
                tax: Math.round(q2 * Number(p2.price) * 0.19),
                discount: 0,
                total: Math.round(q2 * Number(p2.price) * 1.19),
              },
            ],
          },
        },
        include: { items: true },
      });

      createdSales.push(sale);
    }
  }

  for (const sale of createdSales) {
    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const previousStock = Number(product.stock);
      const qty = Number(item.quantity);
      const newStock = Math.max(0, previousStock - qty);

      await prisma.stockMovement.create({
        data: {
          type: "SALE",
          quantity: qty,
          previousStock,
          newStock,
          reason: "Venta demo",
          referenceId: sale.id,
          inputMethod: "MANUAL",
          productId: product.id,
          branchId,
          userId: cashier.id,
          createdAt: sale.createdAt,
          updatedAt: sale.createdAt,
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          status: newStock === 0 ? "OUT_OF_STOCK" : "ACTIVE",
        },
      });

      product.stock = newStock;
    }
  }

  const lowStockProducts = await prisma.product.findMany({
    where: {
      branchId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  for (const p of lowStockProducts.filter((x) => Number(x.stock) <= Number(x.minStock))) {
    const exists = await prisma.inventoryAlert.findFirst({
      where: {
        branchId,
        productId: p.id,
        type: "LOW_STOCK",
        isRead: false,
      },
    });
    if (!exists) {
      await prisma.inventoryAlert.create({
        data: {
          type: "LOW_STOCK",
          message: `Stock bajo para ${p.name}`,
          priority: "HIGH",
          isRead: false,
          productId: p.id,
          branchId,
        },
      });
    }
  }

  const now = new Date();
  const activeOrderStatuses = ["PENDING", "PREPARING", "READY"];
  for (let i = 0; i < 6; i += 1) {
    const orderNumber = `DEMO-ORD-${String(i + 1).padStart(3, "0")}`;
    const exists = await prisma.order.findFirst({
      where: { orderNumber, branchId },
    });
    if (exists) continue;

    const table = tables[i % tables.length];
    const p = products[(i + 3) % products.length];
    const status = activeOrderStatuses[i % activeOrderStatuses.length];

    await prisma.table.update({
      where: { id: table.id },
      data: { status: status === "READY" ? "OCCUPIED" : "OCCUPIED" },
    });

    await prisma.order.create({
      data: {
        orderNumber,
        status,
        tableId: table.id,
        branchId,
        waiterId: cashier.id,
        items: {
          create: [
            {
              productId: p.id,
              quantity: 1 + (i % 3),
              status: "PENDING",
            },
          ],
        },
      },
    });
  }

  console.log("Demo seed OK");
  console.log(`Branch: ${branchId}`);
  console.log(`Products: ${products.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Sales: ${createdSales.length}`);
  console.log("Restaurant orders: 6");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
