'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  Clock,
  DollarSign,
  Flame,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MODULES } from '@/lib/modules';
import { useAuthStore, type BusinessModule } from '@/store/auth';

const MODULE_WIDGETS: Record<
  Exclude<BusinessModule, 'ALL'>,
  { title: string; description: string; links: { label: string; href: string }[] }
> = {
  RESTAURANT: {
    title: 'Operacion de salon, cocina y caja restaurante',
    description: 'Gestion de mesas, reservas, KDS, pre-cuenta y cobro desde flujo restaurante.',
    links: [
      { label: 'Salon, reservas y KDS', href: '/dashboard/restaurant' },
      { label: 'Cobros y caja', href: '/dashboard/cash-register' },
      { label: 'Reporte operativo', href: '/dashboard/reports' },
    ],
  },
  MINIMARKET: {
    title: 'Operacion retail de alta rotacion',
    description: 'Caja rapida, reposicion sugerida, stock critico y control por cajero/turno.',
    links: [
      { label: 'Venta rapida', href: '/dashboard/sales' },
      { label: 'Inventario operativo', href: '/dashboard/inventory' },
      { label: 'Caja y turnos', href: '/dashboard/cash-register' },
    ],
  },
  BOTILLERIA: {
    title: 'Operacion especializada botilleria',
    description: 'Packs promocionales, validacion etaria, horario de venta y categorias alcoholicas top.',
    links: [
      { label: 'Venta con validaciones', href: '/dashboard/sales' },
      { label: 'Promociones y packs', href: '/dashboard/promotions' },
      { label: 'Reporte comercial', href: '/dashboard/reports' },
    ],
  },
  BOOKSTORE: {
    title: 'Operacion por catalogo y temporada',
    description: 'Campanas escolares, combos de oficina y rendimiento por categorias de libreria.',
    links: [
      { label: 'Venta y campañas', href: '/dashboard/sales' },
      { label: 'Catalogo e inventario', href: '/dashboard/products' },
      { label: 'Reportes por categoria', href: '/dashboard/reports' },
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

  const { data: cashRegister } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: () => api.get('/cash-register/current').then((res) => res.data).catch(() => null),
  });

  const { data: moduleOverview } = useQuery({
    queryKey: ['module-overview', moduleType],
    queryFn: async () => {
      if (moduleType === 'RESTAURANT') {
        return api.get('/restaurant/dashboard').then((res) => res.data);
      }
      if (moduleType === 'MINIMARKET') {
        return api.get('/minimarket/dashboard').then((res) => res.data);
      }
      if (moduleType === 'BOTILLERIA') {
        return api.get('/botilleria/dashboard').then((res) => res.data);
      }
      if (moduleType === 'BOOKSTORE') {
        return api.get('/bookstore/dashboard').then((res) => res.data);
      }
      return null;
    },
    enabled: moduleType !== 'ALL',
  });

  const isRegisterOpen = !!(cashRegister && !cashRegister.closedAt);
  const revenue = useMemo(() => Number(dailySales?.totalSales || 0), [dailySales?.totalSales]);

  const cards = useMemo(() => {
    if (moduleType === 'RESTAURANT') {
      return [
        {
          title: 'Mesas libres / ocupadas',
          value: `${Number(moduleOverview?.tables?.available || 0)} / ${Number(moduleOverview?.tables?.occupied || 0)}`,
          subtitle: `Reservadas: ${Number(moduleOverview?.tables?.reserved || 0)}`,
          icon: <UtensilsCrossed className="h-5 w-5" />,
          tone: 'bg-orange-50 text-orange-700',
        },
        {
          title: 'Ventas del dia',
          value: `$${Number(moduleOverview?.sales?.amount || 0).toLocaleString('es-CL')}`,
          subtitle: `Ticket prom.: $${Math.round(Number(moduleOverview?.sales?.averageTicket || 0)).toLocaleString('es-CL')}`,
          icon: <DollarSign className="h-5 w-5" />,
          tone: 'bg-emerald-50 text-emerald-700',
        },
        {
          title: 'Pedidos abiertos',
          value: `${Number(moduleOverview?.kitchen?.openOrders || 0)}`,
          subtitle: `Atrasados: ${Number(moduleOverview?.kitchen?.lateItems || 0)}`,
          icon: <Clock className="h-5 w-5" />,
          tone: 'bg-amber-50 text-amber-700',
        },
        {
          title: 'Estado cocina',
          value: `${Number(moduleOverview?.kitchen?.pendingItems || 0)} pendientes`,
          subtitle: `${Number(moduleOverview?.kitchen?.readyItems || 0)} listos`,
          icon: <BarChart3 className="h-5 w-5" />,
          tone: 'bg-red-50 text-red-700',
        },
      ];
    }

    if (moduleType === 'MINIMARKET') {
      const topCashier = moduleOverview?.salesByCashier?.[0];
      return [
        {
          title: 'Ventas de hoy',
          value: `${Number(moduleOverview?.sales?.count || dailySales?.salesCount || 0)}`,
          subtitle: `Ingresos: $${Number(moduleOverview?.sales?.amount || revenue).toLocaleString('es-CL')}`,
          icon: <ShoppingCart className="h-5 w-5" />,
          tone: 'bg-emerald-50 text-emerald-700',
        },
        {
          title: 'Stock critico',
          value: `${Number(moduleOverview?.stock?.criticalCount || 0)}`,
          subtitle: 'Productos para reposicion',
          icon: <AlertTriangle className="h-5 w-5" />,
          tone: 'bg-rose-50 text-rose-700',
        },
        {
          title: 'Aperturas / cierres',
          value: `${Number(moduleOverview?.cash?.openRegisters || 0)} / ${Number(moduleOverview?.cash?.closedRegisters || 0)}`,
          subtitle: 'Turnos de caja hoy',
          icon: <Banknote className="h-5 w-5" />,
          tone: 'bg-blue-50 text-blue-700',
        },
        {
          title: 'Top cajero',
          value: topCashier?.name || 'Sin datos',
          subtitle: topCashier ? `$${Number(topCashier.amount || 0).toLocaleString('es-CL')}` : 'Sin ventas hoy',
          icon: <Store className="h-5 w-5" />,
          tone: 'bg-indigo-50 text-indigo-700',
        },
      ];
    }

    if (moduleType === 'BOTILLERIA') {
      const topCategory = moduleOverview?.categories?.topAlcoholCategories?.[0];
      return [
        {
          title: 'Ventas del dia',
          value: `$${Number(moduleOverview?.sales?.totalAmount || revenue).toLocaleString('es-CL')}`,
          subtitle: `${Number(moduleOverview?.sales?.totalSales || dailySales?.salesCount || 0)} transacciones`,
          icon: <Wine className="h-5 w-5" />,
          tone: 'bg-red-50 text-red-700',
        },
        {
          title: 'Ticket promedio',
          value: `$${Math.round(Number(moduleOverview?.sales?.averageTicket || 0)).toLocaleString('es-CL')}`,
          subtitle: 'Comportamiento comercial',
          icon: <DollarSign className="h-5 w-5" />,
          tone: 'bg-amber-50 text-amber-700',
        },
        {
          title: 'Packs/promos activas',
          value: `${Number(moduleOverview?.promotions?.activeCount || 0)}`,
          subtitle: 'Promociones botilleria',
          icon: <Sparkles className="h-5 w-5" />,
          tone: 'bg-orange-50 text-orange-700',
        },
        {
          title: 'Categoria top',
          value: topCategory?.category || 'Sin datos',
          subtitle: topCategory ? `${topCategory.units} unidades` : 'Sin movimientos',
          icon: <Flame className="h-5 w-5" />,
          tone: 'bg-pink-50 text-pink-700',
        },
      ];
    }

    if (moduleType === 'BOOKSTORE') {
      const topCategory = moduleOverview?.categories?.[0];
      return [
        {
          title: 'Ventas del dia',
          value: `$${Number(moduleOverview?.sales?.amount || revenue).toLocaleString('es-CL')}`,
          subtitle: `${Number(moduleOverview?.sales?.count || dailySales?.salesCount || 0)} tickets`,
          icon: <BookOpen className="h-5 w-5" />,
          tone: 'bg-blue-50 text-blue-700',
        },
        {
          title: 'Categoria lider',
          value: topCategory?.category || 'Sin datos',
          subtitle: topCategory ? `$${Number(topCategory.revenue || 0).toLocaleString('es-CL')}` : 'Sin ventas',
          icon: <BarChart3 className="h-5 w-5" />,
          tone: 'bg-indigo-50 text-indigo-700',
        },
        {
          title: 'Campanas activas',
          value: `${Number(moduleOverview?.campaigns?.length || 0)}`,
          subtitle: moduleOverview?.season || 'Temporada actual',
          icon: <Sparkles className="h-5 w-5" />,
          tone: 'bg-violet-50 text-violet-700',
        },
        {
          title: 'Stock critico',
          value: `${Number(moduleOverview?.stock?.criticalCount || lowStock?.length || 0)}`,
          subtitle: 'Productos por reponer',
          icon: <Package className="h-5 w-5" />,
          tone: 'bg-rose-50 text-rose-700',
        },
      ];
    }

    return [
      {
        title: 'Ventas del dia',
        value: `${Number(dailySales?.salesCount || 0)}`,
        subtitle: `Ingresos: $${Number(revenue).toLocaleString('es-CL')}`,
        icon: <ShoppingCart className="h-5 w-5" />,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        title: 'Stock bajo',
        value: `${Number(lowStock?.length || 0)}`,
        subtitle: 'Items criticos',
        icon: <AlertTriangle className="h-5 w-5" />,
        tone: 'bg-rose-50 text-rose-700',
      },
      {
        title: 'Caja actual',
        value: isRegisterOpen ? 'Abierta' : 'Cerrada',
        subtitle: 'Estado de turno',
        icon: <Banknote className="h-5 w-5" />,
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        title: 'Modulo activo',
        value: moduleMeta.name,
        subtitle: 'Contexto operativo',
        icon: <Sparkles className="h-5 w-5" />,
        tone: 'bg-indigo-50 text-indigo-700',
      },
    ];
  }, [moduleType, moduleOverview, dailySales, revenue, lowStock, isRegisterOpen, moduleMeta.name]);

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
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <QuickLink href="/dashboard/sales" icon={<ShoppingCart className="h-5 w-5" />} label="Ventas" color="bg-emerald-50 text-emerald-700" />
        <QuickLink href="/dashboard/cash-register" icon={<Banknote className="h-5 w-5" />} label="Caja" color="bg-blue-50 text-blue-700" />
        <QuickLink href="/dashboard/inventory" icon={<Package className="h-5 w-5" />} label="Inventario" color="bg-amber-50 text-amber-700" />
        <QuickLink href="/dashboard/reports" icon={<BarChart3 className="h-5 w-5" />} label="Reportes" color="bg-indigo-50 text-indigo-700" />
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

function QuickLink({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className={`rounded-xl p-2.5 ${color}`}>{icon}</div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
    </Link>
  );
}


