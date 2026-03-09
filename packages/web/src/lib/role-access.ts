import { type BusinessModule } from '@/store/auth';

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'SELLER'
  | 'STOCKER'
  | 'WAITER'
  | 'KITCHEN'
  | 'VIEWER';

export const EXECUTIVE_DASHBOARD_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN'];

export function canViewExecutiveDashboard(role?: string | null) {
  return EXECUTIVE_DASHBOARD_ROLES.includes((role || 'VIEWER') as AppRole);
}

export function resolveRoleLandingPath(role?: string | null, moduleType?: BusinessModule | null) {
  const safeRole = (role || 'VIEWER') as AppRole;
  const safeModule = moduleType || 'ALL';

  if (canViewExecutiveDashboard(safeRole)) {
    return '/dashboard';
  }

  if (safeRole === 'KITCHEN') {
    return '/kds';
  }

  if (safeRole === 'WAITER') {
    return '/dashboard/restaurant';
  }

  if (safeRole === 'CASHIER') {
    return '/dashboard/cash-register';
  }

  if (safeRole === 'SELLER') {
    return '/dashboard/sales';
  }

  if (safeRole === 'STOCKER') {
    return '/dashboard/inventory';
  }

  if (safeRole === 'MANAGER') {
    if (safeModule === 'RESTAURANT') return '/dashboard/restaurant';
    return '/dashboard/sales';
  }

  if (safeRole === 'VIEWER') {
    if (safeModule === 'RESTAURANT') return '/dashboard/restaurant';
    return '/dashboard/sales';
  }

  return '/dashboard/sales';
}
