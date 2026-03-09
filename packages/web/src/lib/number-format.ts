export function toInteger(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
}

export function formatInteger(value: unknown, locale: string = 'es-CL'): string {
  return toInteger(value).toLocaleString(locale);
}

export function formatCurrencyInt(
  value: unknown,
  options?: {
    locale?: string;
    prefix?: string;
  },
): string {
  const locale = options?.locale || 'es-CL';
  const prefix = options?.prefix ?? '$';
  return `${prefix}${formatInteger(value, locale)}`;
}

export function formatMinutes(value: unknown): string {
  return `${formatInteger(value)} min`;
}
