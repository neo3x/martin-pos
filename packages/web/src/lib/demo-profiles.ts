import { type BusinessModule } from '@/store/auth';

type DemoRoleOption = {
  id: string;
  label: string;
  description: string;
};

type DemoRoleMap = Record<Exclude<BusinessModule, 'ALL'>, DemoRoleOption[]>;

export const DEMO_ROLE_OPTIONS: DemoRoleMap = {
  RESTAURANT: [
    { id: 'WAITER', label: 'Garzon', description: 'Atiende mesas, toma pedidos y actualiza comandas.' },
    { id: 'KITCHEN', label: 'Cocina', description: 'Gestiona preparacion y estados de platos.' },
    { id: 'CASHIER', label: 'Cajero', description: 'Cobra cuentas, maneja caja y cierra mesa.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Supervisa operacion del local.' },
    { id: 'ADMIN', label: 'Admin', description: 'Control total del modulo.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura y seguimiento operativo.' },
  ],
  MINIMARKET: [
    { id: 'CASHIER', label: 'Cajero', description: 'Venta rapida y cobro en caja.' },
    { id: 'STOCKER', label: 'Reponedor', description: 'Repone mercaderia, revisa stock critico y ajustes.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Control de inventario y operacion.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administracion completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
  BOTILLERIA: [
    { id: 'CASHIER', label: 'Cajero', description: 'Cobro y validacion en punto de venta.' },
    { id: 'SELLER', label: 'Vendedor', description: 'Arma packs, aplica promociones y vende categorias premium.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Control de catalogo y stock.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administracion completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
  BOOKSTORE: [
    { id: 'CASHIER', label: 'Cajero', description: 'Ventas y comprobantes.' },
    { id: 'SELLER', label: 'Vendedor', description: 'Gestiona campanas escolares, combos y venta asistida.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Gestion comercial y operacion.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administracion completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
};

export function resolveDemoModule(moduleType?: BusinessModule | null): Exclude<BusinessModule, 'ALL'> {
  if (moduleType === 'RESTAURANT' || moduleType === 'MINIMARKET' || moduleType === 'BOTILLERIA' || moduleType === 'BOOKSTORE') {
    return moduleType;
  }
  return 'MINIMARKET';
}

export function getDemoRoles(moduleType?: BusinessModule | null): DemoRoleOption[] {
  return DEMO_ROLE_OPTIONS[resolveDemoModule(moduleType)];
}
