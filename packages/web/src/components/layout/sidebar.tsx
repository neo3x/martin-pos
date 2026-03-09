'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  Banknote,
  Clock,
  FileText,
  Gift,
  LayoutDashboard,
  Package,
  Repeat,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { MODULE_NAME_MAP } from '@/lib/modules';

type ModuleKey = 'RESTAURANT' | 'MINIMARKET' | 'BOTILLERIA' | 'BOOKSTORE' | 'ALL';

const ALL_MODULES = ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'];

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, modules: ALL_MODULES },
  { name: 'Ventas', href: '/dashboard/sales', icon: ShoppingCart, modules: ALL_MODULES },
  { name: 'Caja', href: '/dashboard/cash-register', icon: Banknote, modules: ALL_MODULES },
  { name: 'Productos', href: '/dashboard/products', icon: Package, modules: ALL_MODULES },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Store, modules: ALL_MODULES },
  { name: 'Transferencias', href: '/dashboard/transfers', icon: Repeat, modules: ALL_MODULES },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users, modules: ALL_MODULES },
  { name: 'Fidelizacion', href: '/dashboard/loyalty', icon: Star, modules: ALL_MODULES },
  { name: 'Empleados', href: '/dashboard/employees', icon: Clock, modules: ALL_MODULES },
  { name: 'Promociones', href: '/dashboard/promotions', icon: Gift, modules: ALL_MODULES },
  { name: 'Facturacion', href: '/dashboard/invoices', icon: FileText, modules: ALL_MODULES },
  { name: 'Delivery', href: '/dashboard/delivery', icon: Truck, modules: ['ALL', 'RESTAURANT', 'MINIMARKET'] },
  { name: 'Apartados', href: '/dashboard/layaway', icon: Wallet, modules: ALL_MODULES },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3, modules: ALL_MODULES },
  { name: 'Asistente IA', href: '/dashboard/ai', icon: Bot, modules: ALL_MODULES },
  { name: 'Alertas Fraude', href: '/dashboard/fraud', icon: Shield, modules: ALL_MODULES },
  { name: 'Restaurante', href: '/dashboard/restaurant', icon: UtensilsCrossed, modules: ['ALL', 'RESTAURANT'] },
  { name: 'Configuracion', href: '/dashboard/settings', icon: Settings, modules: ALL_MODULES },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const activeModule = (useAuthStore((state) => state.activeModule) || user?.moduleType || 'ALL') as ModuleKey;

  const filteredNav = navigation.filter((item) => item.modules.includes(activeModule));
  const moduleLabel = MODULE_NAME_MAP[activeModule] || 'Multimodulo';

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Martin POS</p>
        <p className="mt-2 text-2xl font-black">Control Center</p>
        <p className="mt-1 text-xs text-slate-400">Modulo activo: {moduleLabel}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition',
                isActive
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition',
                  isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4 text-xs text-slate-400">
        <p>Entorno: {user?.isDemo ? 'Demo' : 'Produccion'}</p>
        <p className="mt-1 truncate">{user?.email}</p>
      </div>
    </aside>
  );
}
