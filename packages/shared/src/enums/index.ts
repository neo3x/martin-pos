export enum ModuleType {
  RESTAURANT = 'RESTAURANT',
  BOOKSTORE = 'BOOKSTORE',
  MINIMARKET = 'MINIMARKET',
  BOTILLERIA = 'BOTILLERIA',
  ALL = 'ALL',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  VIEWER = 'VIEWER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',           // Generic card (backward compatibility)
  CARD_POS = 'CARD_POS',   // Physical POS terminal (Transbank)
  CARD_WEBPAY = 'CARD_WEBPAY', // Online Webpay Plus (Transbank)
  TRANSFER = 'TRANSFER',
  QR = 'QR',
  CREDIT = 'CREDIT',
  MIXED = 'MIXED',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
  WASTE = 'WASTE',
  PRODUCTION = 'PRODUCTION',
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  OVERSTOCK = 'OVERSTOCK',
  REORDER_SUGGESTION = 'REORDER_SUGGESTION',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum InputMethod {
  MANUAL = 'MANUAL',
  BARCODE = 'BARCODE',
  QR = 'QR',
  VOICE = 'VOICE',
  IMAGE = 'IMAGE',
  OCR = 'OCR',
}

export enum ReportType {
  DAILY_SALES = 'DAILY_SALES',
  INVENTORY = 'INVENTORY',
  CASH_FLOW = 'CASH_FLOW',
  PRODUCT_MOVEMENT = 'PRODUCT_MOVEMENT',
  EMPLOYEE_PERFORMANCE = 'EMPLOYEE_PERFORMANCE',
  PROFIT_LOSS = 'PROFIT_LOSS',
  TAX = 'TAX',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}
