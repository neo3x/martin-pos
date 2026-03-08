'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { MODULE_NAME_MAP } from '@/lib/modules';

type ModuleKey = 'RESTAURANT' | 'MINIMARKET' | 'BOTILLERIA' | 'BOOKSTORE' | 'ALL';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Ventas', href: '/dashboard/sales', icon: ShoppingCart, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Productos', href: '/dashboard/products', icon: Package, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Store, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Asistente IA', href: '/dashboard/ai', icon: Bot, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
  { name: 'Restaurante', href: '/dashboard/restaurant', icon: UtensilsCrossed, modules: ['ALL', 'RESTAURANT'] },
  { name: 'Configuracion', href: '/dashboard/settings', icon: Settings, modules: ['ALL', 'RESTAURANT', 'MINIMARKET', 'BOTILLERIA', 'BOOKSTORE'] },
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

      <nav className="flex-1 space-y-1 px-4 py-4">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
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
