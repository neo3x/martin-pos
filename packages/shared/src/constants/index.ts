export const APP_NAME = 'Martin POS';
export const APP_VERSION = '1.0.0';

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_TIMEZONE = 'America/Santiago';
export const DEFAULT_LANGUAGE = 'es';

export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  CLP: { symbol: '$', name: 'Chilean Peso' },
  EUR: { symbol: '€', name: 'Euro' },
  MXN: { symbol: '$', name: 'Mexican Peso' },
  ARS: { symbol: '$', name: 'Argentine Peso' },
};

export const UNITS = [
  'UN', // Unidad
  'KG', // Kilogramo
  'G', // Gramo
  'L', // Litro
  'ML', // Mililitro
  'M', // Metro
  'CM', // Centímetro
  'PACK', // Paquete
  'BOX', // Caja
  'DOZEN', // Docena
];

export const TAX_RATES = {
  IVA_CL: 0.19, // Chile
  IVA_MX: 0.16, // Mexico
  VAT_US: 0.0, // US (varies by state)
};

export const PRINTER_WIDTHS = {
  MM_58: 32,
  MM_80: 48,
};

export const FILE_UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const AI_CONFIG = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  MAX_CONTEXT_MESSAGES: 10,
};

export const EXPIRATION_WARNING_DAYS = {
  CRITICAL: 3,
  WARNING: 7,
  INFO: 14,
};

export const STOCK_LEVELS = {
  CRITICAL_PERCENTAGE: 0.1, // 10% of min stock
  LOW_PERCENTAGE: 0.3, // 30% of min stock
  OVERSTOCK_PERCENTAGE: 1.5, // 150% of max stock
};

export const RESTAURANT_CONFIG = {
  DEFAULT_PREPARATION_TIME: 15, // minutes
  MAX_TABLE_CAPACITY: 20,
  ORDER_TIMEOUT_MINUTES: 120,
};

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'Acceso denegado',
  NOT_FOUND: 'Recurso no encontrado',
  VALIDATION_ERROR: 'Error de validación',
  INTERNAL_ERROR: 'Error interno del servidor',
  INSUFFICIENT_STOCK: 'Stock insuficiente',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  SALE_NOT_FOUND: 'Venta no encontrada',
  USER_NOT_FOUND: 'Usuario no encontrado',
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
};
