-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN', 'VIEWER');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('RESTAURANT', 'BOOKSTORE', 'MINIMARKET', 'BOTILLERIA', 'ALL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'CARD_POS', 'CARD_WEBPAY', 'TRANSFER', 'QR', 'CREDIT', 'MIXED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'WASTE', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'OVERSTOCK', 'REORDER_SUGGESTION');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('MANUAL', 'BARCODE', 'QR', 'VOICE', 'IMAGE', 'OCR');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY_SALES', 'INVENTORY', 'CASH_FLOW', 'PRODUCT_MOVEMENT', 'EMPLOYEE_PERFORMANCE', 'PROFIT_LOSS', 'TAX');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('DISCOUNT', 'COMBO', 'BUY_X_GET_Y', 'SEASONAL', 'CLEARANCE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryProvider" AS ENUM ('UBER_EATS', 'RAPPI', 'PEDIDOS_YA', 'IN_HOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LayawayStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "ConsignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOIDED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FraudType" AS ENUM ('UNUSUAL_AMOUNT', 'UNUSUAL_TIME', 'MULTIPLE_REFUNDS', 'EXCESSIVE_DISCOUNTS', 'SUSPICIOUS_PATTERN', 'DUPLICATE_TRANSACTION');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'PAYPAL', 'MERCADO_PAGO', 'TRANSBANK', 'WEBPAY', 'FLOW', 'KUSHKI', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "AlcoholCategory" AS ENUM ('WINE_RED', 'WINE_WHITE', 'WINE_ROSE', 'WINE_SPARKLING', 'BEER_LAGER', 'BEER_ALE', 'BEER_CRAFT', 'SPIRITS_WHISKY', 'SPIRITS_VODKA', 'SPIRITS_GIN', 'SPIRITS_RUM', 'SPIRITS_TEQUILA', 'SPIRITS_PISCO', 'SPIRITS_BRANDY', 'LIQUEUR', 'APERITIF', 'VERMOUTH', 'CIDER', 'NON_ALCOHOLIC', 'OTHER');

-- CreateEnum
CREATE TYPE "AlcoholTaxCategory" AS ENUM ('STANDARD', 'HIGH', 'EXEMPT');

-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('BOTTLE', 'CAN', 'BOX', 'KEG', 'BAG_IN_BOX', 'TETRA', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('RUT', 'ID_CARD', 'PASSPORT', 'VERBAL_CONFIRMATION', 'SYSTEM_REGISTERED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'OPEN_REGISTRATION', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WineClubPlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransbankStatus" AS ENUM ('INITIALIZED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REVERSED', 'NULLIFIED', 'TIMEOUT', 'ERROR');

-- CreateEnum
CREATE TYPE "DTEStatus" AS ENUM ('DRAFT', 'SIGNED', 'SENT', 'ACCEPTED', 'ACCEPTED_WITH_OBJECTIONS', 'REJECTED', 'VOIDED', 'ERROR');

-- CreateEnum
CREATE TYPE "POSConnectionType" AS ENUM ('USB', 'SERIAL', 'ETHERNET', 'WIFI', 'BLUETOOTH');

-- CreateEnum
CREATE TYPE "POSTerminalStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'BUSY', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "POSTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'DECLINED', 'CANCELLED', 'VOIDED', 'TIMEOUT', 'ERROR');

-- CreateEnum
CREATE TYPE "POSBatchStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "avatar" TEXT,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "moduleType" "ModuleType" NOT NULL DEFAULT 'MINIMARKET',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "maxStock" DECIMAL(10,3),
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "hasLotControl" BOOLEAN NOT NULL DEFAULT false,
    "requiresWeighing" BOOLEAN NOT NULL DEFAULT false,
    "expirationDate" TIMESTAMP(3),
    "isRecipe" BOOLEAN NOT NULL DEFAULT false,
    "preparationTime" INTEGER,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(5,4),
    "categoryId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_lots" (
    "id" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "previousStock" DECIMAL(10,3) NOT NULL,
    "newStock" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "reason" TEXT,
    "referenceId" TEXT,
    "inputMethod" "InputMethod" NOT NULL DEFAULT 'MANUAL',
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "tableId" TEXT,
    "orderId" TEXT,
    "customerId" TEXT,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "productId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentOrderId" TEXT,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "tableId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "waiterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "preparedAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "yield" INTEGER NOT NULL DEFAULT 1,
    "costPerServing" DECIMAL(10,2) NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialCash" DECIMAL(10,2) NOT NULL,
    "finalCash" DECIMAL(10,2),
    "expectedCash" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "totalSales" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "description" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "context" JSONB,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerDollar" DECIMAL(10,2) NOT NULL,
    "dollarPerPoint" DECIMAL(10,2) NOT NULL,
    "minPointsToRedeem" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "description" TEXT,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_preferences" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "lastPurchase" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_shifts" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "totalHours" DECIMAL(10,2),
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "baseSaleAmount" DECIMAL(10,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_products" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "fromBranchId" TEXT NOT NULL,
    "toBranchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_items" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "productId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "provider" "DeliveryProvider" NOT NULL,
    "externalId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "notes" TEXT,
    "branchId" TEXT NOT NULL,
    "orderId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaways" (
    "id" TEXT NOT NULL,
    "layawayNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(10,2) NOT NULL,
    "status" "LayawayStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaway_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "productId" TEXT NOT NULL,
    "layawayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layaway_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaway_payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "layawayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layaway_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignments" (
    "id" TEXT NOT NULL,
    "consignmentNumber" TEXT NOT NULL,
    "status" "ConsignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "supplierId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "productId" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'INVOICE',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerTaxId" TEXT,
    "customerAddress" TEXT,
    "branchId" TEXT NOT NULL,
    "saleId" TEXT,
    "xmlData" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "productId" TEXT,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scales" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "port" TEXT NOT NULL,
    "baudRate" INTEGER NOT NULL DEFAULT 9600,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_logs" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "humidity" DECIMAL(5,2),
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "type" "FraudType" NOT NULL,
    "severity" "Priority" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "saleId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_transactions" (
    "id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL,
    "saleId" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_voice_commands" (
    "id" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcript" TEXT NOT NULL,
    "command" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_voice_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_ocr_documents" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_ocr_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_product_recognitions" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "productId" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_product_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alcoholic_products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "alcoholContent" DECIMAL(5,2) NOT NULL,
    "vintage" INTEGER,
    "origin" TEXT,
    "winery" TEXT,
    "grapeVariety" TEXT,
    "servingTemperature" TEXT,
    "pairings" TEXT,
    "tastingNotes" TEXT,
    "rating" DECIMAL(3,1),
    "category" "AlcoholCategory" NOT NULL,
    "taxCategory" "AlcoholTaxCategory" NOT NULL DEFAULT 'STANDARD',
    "volume" INTEGER,
    "container" "ContainerType" NOT NULL DEFAULT 'BOTTLE',
    "isReturnable" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alcoholic_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_verifications" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerRut" TEXT,
    "customerBirthDate" TIMESTAMP(3),
    "verificationMethod" "VerificationMethod" NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "age_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returnable_containers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "totalIssued" INTEGER NOT NULL DEFAULT 0,
    "totalReturned" INTEGER NOT NULL DEFAULT 0,
    "pendingQuantity" INTEGER NOT NULL DEFAULT 0,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returnable_containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "container_returns" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "customerId" TEXT,
    "processedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "container_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasting_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasting_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasting_event_products" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "servingSize" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasting_event_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasting_event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "attendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasting_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wine_club_subscriptions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planType" "WineClubPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "bottlesPerMonth" INTEGER NOT NULL DEFAULT 2,
    "preferredCategories" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDeliveryDate" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wine_club_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wine_club_deliveries" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "products" JSONB NOT NULL,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wine_club_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_hours_restrictions" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_hours_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transbank_transactions" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "buyOrder" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "TransbankStatus" NOT NULL DEFAULT 'INITIALIZED',
    "token" TEXT,
    "responseCode" INTEGER,
    "authorizationCode" TEXT,
    "cardNumber" TEXT,
    "cardType" TEXT,
    "installmentsNumber" INTEGER,
    "installmentsAmount" INTEGER,
    "tbkUser" TEXT,
    "tbkAuthCode" TEXT,
    "returnUrl" TEXT,
    "finalUrl" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "environment" TEXT NOT NULL DEFAULT 'integration',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transbank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transbank_configs" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'integration',
    "commerceCode" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isWebpayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isOneclickEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPOSEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transbank_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "connectionType" "POSConnectionType" NOT NULL DEFAULT 'USB',
    "port" TEXT,
    "baudRate" INTEGER NOT NULL DEFAULT 9600,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "status" "POSTerminalStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastPingAt" TIMESTAMP(3),
    "lastTransactionAt" TIMESTAMP(3),
    "configId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transactions" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "terminalId" TEXT NOT NULL,
    "operationCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "tip" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 0,
    "status" "POSTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "authorizationCode" TEXT,
    "responseCode" INTEGER,
    "responseMessage" TEXT,
    "cardNumber" TEXT,
    "cardType" TEXT,
    "cardBrand" TEXT,
    "voucherNumber" TEXT,
    "commerceCode" TEXT,
    "terminalCode" TEXT,
    "transactionDate" TIMESTAMP(3),
    "transactionTime" TEXT,
    "printData" TEXT,
    "rawResponse" JSONB,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_batches" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" "POSBatchStatus" NOT NULL DEFAULT 'OPEN',
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalVoids" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "totalTips" INTEGER NOT NULL DEFAULT 0,
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "creditCount" INTEGER NOT NULL DEFAULT 0,
    "debitAmount" INTEGER NOT NULL DEFAULT 0,
    "debitCount" INTEGER NOT NULL DEFAULT 0,
    "closingData" JSONB,
    "closingReport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sii_configs" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "rutEmisor" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "giroEmisor" TEXT NOT NULL,
    "direccionOrigen" TEXT NOT NULL,
    "comunaOrigen" TEXT NOT NULL,
    "ciudadOrigen" TEXT NOT NULL,
    "certificatePath" TEXT,
    "certificatePassword" TEXT,
    "cafBoletaPath" TEXT,
    "cafFacturaPath" TEXT,
    "cafNotaCreditoPath" TEXT,
    "folioBoletaInicio" INTEGER,
    "folioBoletaActual" INTEGER,
    "folioBoletaFin" INTEGER,
    "folioFacturaInicio" INTEGER,
    "folioFacturaActual" INTEGER,
    "folioFacturaFin" INTEGER,
    "environment" TEXT NOT NULL DEFAULT 'certificacion',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sii_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dte_documents" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "saleId" TEXT,
    "tipoDTE" INTEGER NOT NULL,
    "folio" INTEGER NOT NULL,
    "rutEmisor" TEXT NOT NULL,
    "razonSocialEmisor" TEXT NOT NULL,
    "rutReceptor" TEXT,
    "razonSocialReceptor" TEXT,
    "giroReceptor" TEXT,
    "direccionReceptor" TEXT,
    "comunaReceptor" TEXT,
    "montoNeto" INTEGER NOT NULL,
    "montoExento" INTEGER NOT NULL DEFAULT 0,
    "tasaIVA" INTEGER NOT NULL DEFAULT 19,
    "iva" INTEGER NOT NULL,
    "montoTotal" INTEGER NOT NULL,
    "tipoImpAdicional" INTEGER,
    "tasaImpAdicional" DECIMAL(5,2),
    "montoImpAdicional" INTEGER,
    "status" "DTEStatus" NOT NULL DEFAULT 'DRAFT',
    "trackId" TEXT,
    "estadoSII" TEXT,
    "glosaEstadoSII" TEXT,
    "xmlContent" TEXT,
    "xmlSigned" TEXT,
    "pdfUrl" TEXT,
    "tedBarcode" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "referenciaTipoDTE" INTEGER,
    "referenciaFolio" INTEGER,
    "referenciaRazon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentToSIIAt" TIMESTAMP(3),
    "acceptedBySIIAt" TIMESTAMP(3),

    CONSTRAINT "dte_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dte_items" (
    "id" TEXT NOT NULL,
    "dteId" TEXT NOT NULL,
    "numeroLinea" INTEGER NOT NULL,
    "indicadorExento" BOOLEAN NOT NULL DEFAULT false,
    "nombreItem" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidadMedida" TEXT,
    "precioUnitario" INTEGER NOT NULL,
    "montoItem" INTEGER NOT NULL,
    "descuentoPct" DECIMAL(5,2),
    "descuentoMonto" INTEGER,
    "codigoImpAdicional" INTEGER,
    "tasaImpAdicional" DECIMAL(5,2),
    "montoImpAdicional" INTEGER,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dte_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dte_logs" (
    "id" TEXT NOT NULL,
    "dteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dte_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_idx" ON "users"("branchId");

-- CreateIndex
CREATE INDEX "branches_moduleType_idx" ON "branches"("moduleType");

-- CreateIndex
CREATE INDEX "categories_branchId_idx" ON "categories"("branchId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_branchId_idx" ON "products"("branchId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_lots_expirationDate_idx" ON "product_lots"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "product_lots_productId_lotNumber_key" ON "product_lots"("productId", "lotNumber");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_branchId_idx" ON "stock_movements"("branchId");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_alerts_productId_idx" ON "inventory_alerts"("productId");

-- CreateIndex
CREATE INDEX "inventory_alerts_branchId_idx" ON "inventory_alerts"("branchId");

-- CreateIndex
CREATE INDEX "inventory_alerts_isRead_idx" ON "inventory_alerts"("isRead");

-- CreateIndex
CREATE INDEX "inventory_alerts_priority_idx" ON "inventory_alerts"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");

-- CreateIndex
CREATE INDEX "sales_saleNumber_idx" ON "sales"("saleNumber");

-- CreateIndex
CREATE INDEX "sales_branchId_idx" ON "sales"("branchId");

-- CreateIndex
CREATE INDEX "sales_userId_idx" ON "sales"("userId");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_taxId_key" ON "customers"("taxId");

-- CreateIndex
CREATE INDEX "customers_branchId_idx" ON "customers"("branchId");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "tables_branchId_idx" ON "tables"("branchId");

-- CreateIndex
CREATE INDEX "tables_status_idx" ON "tables"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tables_branchId_number_key" ON "tables"("branchId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_tableId_idx" ON "orders"("tableId");

-- CreateIndex
CREATE INDEX "orders_branchId_idx" ON "orders"("branchId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_status_idx" ON "order_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_productId_key" ON "recipes"("productId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_productId_idx" ON "recipe_ingredients"("productId");

-- CreateIndex
CREATE INDEX "cash_registers_branchId_idx" ON "cash_registers"("branchId");

-- CreateIndex
CREATE INDEX "cash_registers_userId_idx" ON "cash_registers"("userId");

-- CreateIndex
CREATE INDEX "cash_registers_status_idx" ON "cash_registers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_saleId_key" ON "cash_transactions"("saleId");

-- CreateIndex
CREATE INDEX "cash_transactions_cashRegisterId_idx" ON "cash_transactions"("cashRegisterId");

-- CreateIndex
CREATE INDEX "cash_transactions_type_idx" ON "cash_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_taxId_key" ON "suppliers"("taxId");

-- CreateIndex
CREATE INDEX "suppliers_branchId_idx" ON "suppliers"("branchId");

-- CreateIndex
CREATE INDEX "ai_queries_userId_idx" ON "ai_queries"("userId");

-- CreateIndex
CREATE INDEX "ai_queries_createdAt_idx" ON "ai_queries"("createdAt");

-- CreateIndex
CREATE INDEX "reports_branchId_idx" ON "reports"("branchId");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_branchId_key" ON "settings"("branchId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_customerId_idx" ON "loyalty_transactions"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_programId_idx" ON "loyalty_transactions"("programId");

-- CreateIndex
CREATE INDEX "customer_preferences_customerId_idx" ON "customer_preferences"("customerId");

-- CreateIndex
CREATE INDEX "employee_shifts_userId_idx" ON "employee_shifts"("userId");

-- CreateIndex
CREATE INDEX "employee_shifts_startTime_idx" ON "employee_shifts"("startTime");

-- CreateIndex
CREATE INDEX "commissions_userId_idx" ON "commissions"("userId");

-- CreateIndex
CREATE INDEX "promotions_branchId_idx" ON "promotions"("branchId");

-- CreateIndex
CREATE INDEX "promotions_isActive_idx" ON "promotions"("isActive");

-- CreateIndex
CREATE INDEX "combo_products_promotionId_idx" ON "combo_products"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transfers_transferNumber_key" ON "inventory_transfers"("transferNumber");

-- CreateIndex
CREATE INDEX "inventory_transfers_fromBranchId_idx" ON "inventory_transfers"("fromBranchId");

-- CreateIndex
CREATE INDEX "inventory_transfers_toBranchId_idx" ON "inventory_transfers"("toBranchId");

-- CreateIndex
CREATE INDEX "inventory_transfers_status_idx" ON "inventory_transfers"("status");

-- CreateIndex
CREATE INDEX "transfer_items_transferId_idx" ON "transfer_items"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_orderNumber_key" ON "delivery_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "delivery_orders_branchId_idx" ON "delivery_orders"("branchId");

-- CreateIndex
CREATE INDEX "delivery_orders_provider_idx" ON "delivery_orders"("provider");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "layaways_layawayNumber_key" ON "layaways"("layawayNumber");

-- CreateIndex
CREATE INDEX "layaways_customerId_idx" ON "layaways"("customerId");

-- CreateIndex
CREATE INDEX "layaways_status_idx" ON "layaways"("status");

-- CreateIndex
CREATE INDEX "layaway_items_layawayId_idx" ON "layaway_items"("layawayId");

-- CreateIndex
CREATE INDEX "layaway_payments_layawayId_idx" ON "layaway_payments"("layawayId");

-- CreateIndex
CREATE UNIQUE INDEX "consignments_consignmentNumber_key" ON "consignments"("consignmentNumber");

-- CreateIndex
CREATE INDEX "consignment_items_consignmentId_idx" ON "consignment_items"("consignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_branchId_idx" ON "invoices"("branchId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "temperature_logs_branchId_idx" ON "temperature_logs"("branchId");

-- CreateIndex
CREATE INDEX "temperature_logs_createdAt_idx" ON "temperature_logs"("createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_status_idx" ON "fraud_alerts"("status");

-- CreateIndex
CREATE INDEX "fraud_alerts_createdAt_idx" ON "fraud_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "payment_gateway_transactions_gateway_idx" ON "payment_gateway_transactions"("gateway");

-- CreateIndex
CREATE INDEX "payment_gateway_transactions_status_idx" ON "payment_gateway_transactions"("status");

-- CreateIndex
CREATE INDEX "ai_voice_commands_userId_idx" ON "ai_voice_commands"("userId");

-- CreateIndex
CREATE INDEX "ai_ocr_documents_userId_idx" ON "ai_ocr_documents"("userId");

-- CreateIndex
CREATE INDEX "ai_ocr_documents_documentType_idx" ON "ai_ocr_documents"("documentType");

-- CreateIndex
CREATE INDEX "ai_product_recognitions_productId_idx" ON "ai_product_recognitions"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "alcoholic_products_productId_key" ON "alcoholic_products"("productId");

-- CreateIndex
CREATE INDEX "alcoholic_products_category_idx" ON "alcoholic_products"("category");

-- CreateIndex
CREATE INDEX "alcoholic_products_taxCategory_idx" ON "alcoholic_products"("taxCategory");

-- CreateIndex
CREATE INDEX "age_verifications_saleId_idx" ON "age_verifications"("saleId");

-- CreateIndex
CREATE INDEX "returnable_containers_productId_idx" ON "returnable_containers"("productId");

-- CreateIndex
CREATE INDEX "returnable_containers_branchId_idx" ON "returnable_containers"("branchId");

-- CreateIndex
CREATE INDEX "container_returns_containerId_idx" ON "container_returns"("containerId");

-- CreateIndex
CREATE INDEX "tasting_events_branchId_idx" ON "tasting_events"("branchId");

-- CreateIndex
CREATE INDEX "tasting_events_eventDate_idx" ON "tasting_events"("eventDate");

-- CreateIndex
CREATE INDEX "tasting_event_products_eventId_idx" ON "tasting_event_products"("eventId");

-- CreateIndex
CREATE INDEX "tasting_event_attendees_eventId_idx" ON "tasting_event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "wine_club_subscriptions_customerId_idx" ON "wine_club_subscriptions"("customerId");

-- CreateIndex
CREATE INDEX "wine_club_subscriptions_branchId_idx" ON "wine_club_subscriptions"("branchId");

-- CreateIndex
CREATE INDEX "wine_club_subscriptions_status_idx" ON "wine_club_subscriptions"("status");

-- CreateIndex
CREATE INDEX "wine_club_deliveries_subscriptionId_idx" ON "wine_club_deliveries"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_hours_restrictions_branchId_dayOfWeek_key" ON "sale_hours_restrictions"("branchId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "transbank_transactions_buyOrder_key" ON "transbank_transactions"("buyOrder");

-- CreateIndex
CREATE UNIQUE INDEX "transbank_transactions_token_key" ON "transbank_transactions"("token");

-- CreateIndex
CREATE INDEX "transbank_transactions_saleId_idx" ON "transbank_transactions"("saleId");

-- CreateIndex
CREATE INDEX "transbank_transactions_buyOrder_idx" ON "transbank_transactions"("buyOrder");

-- CreateIndex
CREATE INDEX "transbank_transactions_status_idx" ON "transbank_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transbank_configs_branchId_key" ON "transbank_configs"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_terminalId_key" ON "pos_terminals"("terminalId");

-- CreateIndex
CREATE INDEX "pos_terminals_branchId_idx" ON "pos_terminals"("branchId");

-- CreateIndex
CREATE INDEX "pos_terminals_status_idx" ON "pos_terminals"("status");

-- CreateIndex
CREATE INDEX "pos_transactions_saleId_idx" ON "pos_transactions"("saleId");

-- CreateIndex
CREATE INDEX "pos_transactions_terminalId_idx" ON "pos_transactions"("terminalId");

-- CreateIndex
CREATE INDEX "pos_transactions_status_idx" ON "pos_transactions"("status");

-- CreateIndex
CREATE INDEX "pos_transactions_createdAt_idx" ON "pos_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "pos_batches_branchId_idx" ON "pos_batches"("branchId");

-- CreateIndex
CREATE INDEX "pos_batches_terminalId_idx" ON "pos_batches"("terminalId");

-- CreateIndex
CREATE INDEX "pos_batches_status_idx" ON "pos_batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sii_configs_branchId_key" ON "sii_configs"("branchId");

-- CreateIndex
CREATE INDEX "dte_documents_branchId_idx" ON "dte_documents"("branchId");

-- CreateIndex
CREATE INDEX "dte_documents_rutReceptor_idx" ON "dte_documents"("rutReceptor");

-- CreateIndex
CREATE INDEX "dte_documents_status_idx" ON "dte_documents"("status");

-- CreateIndex
CREATE INDEX "dte_documents_fechaEmision_idx" ON "dte_documents"("fechaEmision");

-- CreateIndex
CREATE UNIQUE INDEX "dte_documents_branchId_tipoDTE_folio_key" ON "dte_documents"("branchId", "tipoDTE", "folio");

-- CreateIndex
CREATE INDEX "dte_items_dteId_idx" ON "dte_items"("dteId");

-- CreateIndex
CREATE INDEX "dte_logs_dteId_idx" ON "dte_logs"("dteId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_preferences" ADD CONSTRAINT "customer_preferences_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "inventory_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaways" ADD CONSTRAINT "layaways_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaway_items" ADD CONSTRAINT "layaway_items_layawayId_fkey" FOREIGN KEY ("layawayId") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaway_payments" ADD CONSTRAINT "layaway_payments_layawayId_fkey" FOREIGN KEY ("layawayId") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_returns" ADD CONSTRAINT "container_returns_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "returnable_containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasting_event_products" ADD CONSTRAINT "tasting_event_products_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "tasting_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasting_event_attendees" ADD CONSTRAINT "tasting_event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "tasting_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wine_club_deliveries" ADD CONSTRAINT "wine_club_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "wine_club_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_configId_fkey" FOREIGN KEY ("configId") REFERENCES "transbank_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dte_items" ADD CONSTRAINT "dte_items_dteId_fkey" FOREIGN KEY ("dteId") REFERENCES "dte_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

