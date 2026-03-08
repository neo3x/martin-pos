'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, DollarSign, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { MODULES } from '@/lib/modules';
import { useAuthStore, type BusinessModule } from '@/store/auth';

const MODULE_WIDGETS: Record<
  Exclude<BusinessModule, 'ALL'>,
  { title: string; description: string; links: { label: string; href: string }[] }
> = {
  RESTAURANT: {
    title: 'Operacion de salon y cocina',
    description: 'Controla mesas activas, tiempos de servicio y rotacion de turnos.',
    links: [
      { label: 'Ver mesas y ordenes', href: '/dashboard/restaurant' },
      { label: 'Registrar nueva venta', href: '/dashboard/sales' },
    ],
  },
  MINIMARKET: {
    title: 'Rotacion retail diaria',
    description: 'Monitorea productos criticos, ventas por horario y reposicion sugerida.',
    links: [
      { label: 'Revisar inventario', href: '/dashboard/inventory' },
      { label: 'Gestionar productos', href: '/dashboard/products' },
    ],
  },
  BOTILLERIA: {
    title: 'Catalogo especializado y promociones',
    description: 'Prioriza mix de vinos/destilados y controla stock de alta rotacion.',
    links: [
      { label: 'Gestionar productos', href: '/dashboard/products' },
      { label: 'Ver reportes comerciales', href: '/dashboard/reports' },
    ],
  },
  BOOKSTORE: {
    title: 'Temporadas escolares y bazar',
    description: 'Sigue el rendimiento por categorias, packs y productos de temporada.',
    links: [
      { label: 'Gestionar catalogo', href: '/dashboard/products' },
      { label: 'Ver clientes', href: '/dashboard/customers' },
    ],
  },
};

export default function DashboardPage() {
  const { user, activeModule } = useAuthStore();
  const moduleType = (activeModule || user?.moduleType || 'ALL') as BusinessModule;
  const moduleMeta = MODULES.find((m) => m.id === moduleType) || MODULES.find((m) => m.id === 'MINIMARKET')!;
  const moduleWidget = moduleType === 'ALL' ? null : MODULE_WIDGETS[moduleType];

  const { data: dailySales } = useQuery({
    queryKey: ['daily-sales'],
    queryFn: () => api.get('/sales/daily').then((res) => res.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products/low-stock').then((res) => res.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['expiring'],
    queryFn: () => api.get('/products/expiring').then((res) => res.data),
  });

  const revenue = useMemo(() => Number(dailySales?.totalSales || 0), [dailySales?.totalSales]);
  const topSales = useMemo(() => (dailySales?.sales || []).slice(0, 6), [dailySales?.sales]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resumen Diario</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Dashboard {moduleMeta.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{moduleMeta.description}</p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${moduleMeta.accent}20`, color: moduleMeta.accent }}
          >
            <Sparkles className="h-4 w-4" />
            Modulo activo
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas del dia"
          value={`${dailySales?.salesCount || 0}`}
          subtitle="Transacciones completadas"
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="bg-sky-50 text-sky-700"
        />
        <StatCard
          title="Ingresos del dia"
          value={`$${revenue.toLocaleString('es-CL')}`}
          subtitle="Monto bruto de ventas"
          icon={<DollarSign className="h-5 w-5" />}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Productos con stock bajo"
          value={`${lowStock?.length || 0}`}
          subtitle="Prioridad de reposicion"
          icon={<Package className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Productos por vencer"
          value={`${expiring?.length || 0}`}
          subtitle="Control de caducidad"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-rose-50 text-rose-700"
        />
      </section>

      {moduleWidget && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Foco del modulo</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{moduleWidget.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{moduleWidget.description}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {moduleWidget.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                {link.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Ventas recientes</h2>
          <Link href="/dashboard/sales" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Ver todas
          </Link>
        </div>

        {topSales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Aun no hay ventas registradas para hoy.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topSales.map((sale: any) => (
              <div key={sale.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{sale.saleNumber}</p>
                <p className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString('es-CL')}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">${Number(sale.total).toLocaleString('es-CL')}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>{icon}</div>
      </div>
    </article>
  );
}
