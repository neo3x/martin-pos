/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { hour: '2-digit', minute: '2-digit' };

  return new Intl.DateTimeFormat('es-CL', options).format(date);
}

/**
 * Calculate tax
 */
export function calculateTax(amount: number, taxRate: number): number {
  return Number((amount * taxRate).toFixed(2));
}

/**
 * Calculate discount
 */
export function calculateDiscount(amount: number, discountPercentage: number): number {
  return Number((amount * (discountPercentage / 100)).toFixed(2));
}

/**
 * Generate unique ID
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Generate SKU
 */
export function generateSKU(categoryCode: string, sequence: number): string {
  return `${categoryCode.toUpperCase()}-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Calculate days until date
 */
export function daysUntil(date: Date): number {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if product is expiring soon
 */
export function isExpiringSoon(expirationDate: Date, warningDays: number = 7): boolean {
  const days = daysUntil(expirationDate);
  return days <= warningDays && days >= 0;
}

/**
 * Check if product is expired
 */
export function isExpired(expirationDate: Date): boolean {
  return daysUntil(expirationDate) < 0;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

/**
 * Sanitize string for search
 */
export function sanitizeSearchTerm(term: string): string {
  return term.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(2));
}

/**
 * Round to decimals
 */
export function roundTo(value: number, decimals: number = 2): number {
  return Number(value.toFixed(decimals));
}

/**
 * Parse barcode
 */
export function parseBarcode(barcode: string): { valid: boolean; type?: string } {
  // EAN-13
  if (/^\d{13}$/.test(barcode)) {
    return { valid: true, type: 'EAN-13' };
  }
  // EAN-8
  if (/^\d{8}$/.test(barcode)) {
    return { valid: true, type: 'EAN-8' };
  }
  // UPC-A
  if (/^\d{12}$/.test(barcode)) {
    return { valid: true, type: 'UPC-A' };
  }
  return { valid: false };
}

/**
 * Calculate sale total
 */
export function calculateSaleTotal(
  subtotal: number,
  taxRate: number,
  discountAmount: number = 0
): { subtotal: number; tax: number; discount: number; total: number } {
  const discount = roundTo(discountAmount);
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount, taxRate);
  const total = roundTo(afterDiscount + tax);

  return {
    subtotal: roundTo(subtotal),
    tax,
    discount,
    total,
  };
}

/**
 * Chunk array
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
