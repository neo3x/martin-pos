import {
  ModuleType,
  UserRole,
  PaymentMethod,
  SaleStatus,
  ProductStatus,
  StockMovementType,
  AlertType,
  TableStatus,
  OrderStatus,
  InputMethod,
  ReportType,
  TransactionType,
} from '../enums';

// Base Types
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// User Types
export interface IUser extends ITimestamps {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  branchId?: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId?: string;
  phoneNumber?: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// Branch/Sucursal Types
export interface IBranch extends ITimestamps {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  moduleType: ModuleType;
  isActive: boolean;
  config: IBranchConfig;
}

export interface IBranchConfig {
  currency: string;
  timezone: string;
  taxRate: number;
  printerConfig: IPrinterConfig;
  features: string[];
}

export interface IPrinterConfig {
  enabled: boolean;
  port?: string;
  width: number;
  encoding?: string;
}

// Product Types
export interface IProduct extends ITimestamps {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  status: ProductStatus;
  imageUrl?: string;
  expirationDate?: Date;
  branchId: string;

  // Module-specific
  isPerishable: boolean;
  hasLotControl: boolean;
  requiresWeighing: boolean;

  // Restaurant specific
  isRecipe?: boolean;
  preparationTime?: number;

  // Tax
  taxable: boolean;
  taxRate?: number;
}

export interface IProductCreate {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  imageUrl?: string;
  expirationDate?: Date;
  isPerishable?: boolean;
  hasLotControl?: boolean;
  requiresWeighing?: boolean;
  taxable?: boolean;
  taxRate?: number;
}

// Category Types
export interface ICategory extends ITimestamps {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  branchId: string;
  icon?: string;
  color?: string;
}

// Sale Types
export interface ISale extends ITimestamps {
  id: string;
  saleNumber: string;
  branchId: string;
  userId: string;
  customerId?: string;
  status: SaleStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  items: ISaleItem[];
  notes?: string;

  // Restaurant specific
  tableId?: string;
  orderId?: string;
}

export interface ISaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface ISaleCreate {
  customerId?: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }[];
  discount?: number;
  notes?: string;
  tableId?: string;
  orderId?: string;
  ageVerified?: boolean;
}

// Stock Movement Types
export interface IStockMovement extends ITimestamps {
  id: string;
  productId: string;
  branchId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  userId: string;
  referenceId?: string;
  inputMethod: InputMethod;
}

// Inventory Alert Types
export interface IInventoryAlert extends ITimestamps {
  id: string;
  productId: string;
  branchId: string;
  type: AlertType;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  metadata?: Record<string, any>;
}

// Customer Types
export interface ICustomer extends ITimestamps {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  branchId: string;
}

// Restaurant Specific Types
export interface ITable extends ITimestamps {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  branchId: string;
  currentOrderId?: string;
  currentDiners: number;
  openedAt?: Date;
}

export interface IOrder extends ITimestamps {
  id: string;
  orderNumber: string;
  tableId: string;
  branchId: string;
  status: OrderStatus;
  diners: number;
  items: IOrderItem[];
  waiterId?: string;
  notes?: string;
  closedAt?: Date;
}

export interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  paidQuantity: number;
  status: OrderStatus;
  notes?: string;
  preparedAt?: Date;
}

export interface IRecipe extends ITimestamps {
  id: string;
  productId: string;
  name: string;
  ingredients: IRecipeIngredient[];
  instructions?: string;
  yield: number;
  costPerServing: number;
}

export interface IRecipeIngredient {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

// Cash Register Types
export interface ICashRegister extends ITimestamps {
  id: string;
  branchId: string;
  userId: string;
  openedAt: Date;
  closedAt?: Date;
  initialCash: number;
  finalCash?: number;
  expectedCash?: number;
  difference?: number;
  totalSales?: number;
  totalExpenses?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface ICashTransaction extends ITimestamps {
  id: string;
  cashRegisterId: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  userId: string;
  saleId?: string;
}

// AI Assistant Types
export interface IAIQuery {
  query: string;
  context?: Record<string, any>;
  userId: string;
  branchId: string;
}

export interface IAIResponse {
  response: string;
  suggestions?: string[];
  data?: Record<string, any>;
  confidence?: number;
}

export interface IAIInventoryAnalysis {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number;
  recommendedReorderQuantity: number;
  reorderDate: Date;
  confidence: number;
  reasoning: string;
}

export interface IAIReport {
  type: ReportType;
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  data: Record<string, any>;
  generatedAt: Date;
}

// Settings Types
export interface ISettings extends ITimestamps {
  id: string;
  branchId: string;
  moduleType: ModuleType;
  config: Record<string, any>;
}

// Report Types
export interface IReport {
  id: string;
  type: ReportType;
  title: string;
  dateFrom: Date;
  dateTo: Date;
  branchId: string;
  generatedBy: string;
  data: Record<string, any>;
  generatedAt: Date;
}
