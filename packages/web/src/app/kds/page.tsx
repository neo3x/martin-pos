'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle2, Clock, Maximize2, RefreshCcw, Soup } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { resolveRoleLandingPath } from '@/lib/role-access';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'KITCHEN'];

export default function KdsStandalonePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isInitialized, activeModule, setActiveModule } = useAuthStore();
  const [minWait, setMinWait] = useState('0');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      const landing = resolveRoleLandingPath(user?.role, activeModule || user?.moduleType);
      router.replace(landing);
      return;
    }

    setActiveModule('RESTAURANT');
  }, [isInitialized, isAuthenticated, user, router, activeModule, setActiveModule]);

  const { data: kdsData, isLoading } = useQuery({
    queryKey: ['kds-standalone', minWait],
    queryFn: () => api.get('/restaurant/kds', { params: { minWait: Number(minWait || 0) } }).then((res) => res.data),
    enabled: isAuthenticated && !!user && ALLOWED_ROLES.includes(user.role),
    refetchInterval: 8000,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }: { orderId: string; itemId: string; status: string }) =>
      api.put(`/restaurant/orders/${orderId}/items/${itemId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-standalone'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-kds'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar item'),
  });

  const summary = useMemo(() => {
    return kdsData?.summary || { pending: 0, preparing: 0, ready: 0, overdue: 0 };
  }, [kdsData?.summary]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      toast.error('No fue posible activar pantalla completa en este navegador');
    }
  };

  if (!isInitialized || !isAuthenticated || !user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm">
          Cargando pantalla de cocina...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-slate-100 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modo pantalla cocina</p>
              <h1 className="text-2xl font-black text-white">KDS (Kitchen Display System)</h1>
              <p className="mt-1 text-xs text-slate-400">Vista dedicada para uso continuo en pantalla secundaria.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Filtro espera (min)</label>
              <input
                type="number"
                min={0}
                value={minWait}
                onChange={(e) => setMinWait(e.target.value)}
                className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white"
              />
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['kds-standalone'] });
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refrescar
              </button>
              <button
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {isFullscreen ? 'Salir fullscreen' : 'Pantalla completa'}
              </button>
              <Link
                href="/dashboard/restaurant"
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Volver restaurante
              </Link>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <MetricCard label="Pendientes" value={`${summary.pending || 0}`} tone="bg-amber-500/15 text-amber-200" icon={<Soup className="h-4 w-4" />} />
            <MetricCard label="Preparando" value={`${summary.preparing || 0}`} tone="bg-blue-500/15 text-blue-200" icon={<Clock className="h-4 w-4" />} />
            <MetricCard label="Listos" value={`${summary.ready || 0}`} tone="bg-emerald-500/15 text-emerald-200" icon={<CheckCircle2 className="h-4 w-4" />} />
            <MetricCard label="Sobre SLA" value={`${summary.overdue || 0}`} tone="bg-rose-500/15 text-rose-200" icon={<Clock className="h-4 w-4" />} />
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center text-sm text-slate-400">
            Cargando cola de cocina...
          </div>
        )}

        <div className="grid gap-3 xl:grid-cols-3">
          {(kdsData?.queue || []).map((order: any) => (
            <article key={order.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm font-bold text-white">{order.orderNumber} - Mesa {order.table?.number || '-'}</p>
              <p className="mb-2 text-xs text-slate-400">Espera total: {order.waitMinutes} min</p>
              <div className="space-y-2">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-800 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{item.quantity}x {item.productName}</p>
                      <span className="text-xs text-slate-400">{item.waitMinutes} min</span>
                    </div>
                    {item.notes && (
                      <p className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
                        Obs: {item.notes}
                      </p>
                    )}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateItemMutation.mutate({
                          orderId: order.id,
                          itemId: item.id,
                          status: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="PREPARING">En preparacion</option>
                      <option value="READY">Listo</option>
                      <option value="SERVED">Entregado</option>
                    </select>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {(kdsData?.queue || []).length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center text-sm text-slate-400">
            No hay items en cola con este filtro.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-black text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}
