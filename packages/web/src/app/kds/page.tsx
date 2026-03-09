'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle2, Clock, Maximize2, Moon, RefreshCcw, Soup, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { resolveRoleLandingPath } from '@/lib/role-access';
import { formatInteger, formatMinutes } from '@/lib/number-format';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'KITCHEN'];
const KDS_THEME_STORAGE_KEY = 'omnipunto.kds.theme';

type KdsTheme = 'light' | 'dark';

export default function KdsStandalonePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isInitialized, activeModule, setActiveModule } = useAuthStore();
  const [minWait, setMinWait] = useState('0');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<KdsTheme>('dark');
  const [etaPad, setEtaPad] = useState<{ orderId: string; itemId: string; value: string } | null>(null);

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

  useEffect(() => {
    const stored = localStorage.getItem(KDS_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  const { data: kdsData, isLoading } = useQuery({
    queryKey: ['kds-standalone', minWait],
    queryFn: () => api.get('/restaurant/kds', { params: { minWait: Number(minWait || 0) } }).then((res) => res.data),
    enabled: isAuthenticated && !!user && ALLOWED_ROLES.includes(user.role),
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (!kdsData?.settings?.theme) return;
    const stored = localStorage.getItem(KDS_THEME_STORAGE_KEY);
    if (!stored && (kdsData.settings.theme === 'light' || kdsData.settings.theme === 'dark')) {
      setTheme(kdsData.settings.theme);
    }
  }, [kdsData?.settings?.theme]);

  const persistTheme = (nextTheme: KdsTheme) => {
    setTheme(nextTheme);
    localStorage.setItem(KDS_THEME_STORAGE_KEY, nextTheme);
  };

  const updateItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, payload }: { orderId: string; itemId: string; payload: any }) =>
      api.put(`/restaurant/orders/${orderId}/items/${itemId}`, payload),
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

  const themeClasses = theme === 'dark'
    ? {
        page: 'bg-slate-950 text-slate-100',
        panel: 'border-slate-700 bg-slate-900',
        card: 'border-slate-700 bg-slate-900',
        item: 'border-slate-700 bg-slate-800',
        muted: 'text-slate-400',
        input: 'border-slate-600 bg-slate-800 text-slate-100',
        secondaryBtn: 'border-slate-600 text-slate-200 hover:bg-slate-800',
        textPrimary: 'text-white',
      }
    : {
        page: 'bg-slate-100 text-slate-900',
        panel: 'border-slate-200 bg-white',
        card: 'border-slate-200 bg-white',
        item: 'border-slate-200 bg-slate-50',
        muted: 'text-slate-500',
        input: 'border-slate-300 bg-white text-slate-900',
        secondaryBtn: 'border-slate-300 text-slate-700 hover:bg-slate-100',
        textPrimary: 'text-slate-900',
      };

  if (!isInitialized || !isAuthenticated || !user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themeClasses.page}`}>
        <div className={`rounded-xl border px-5 py-4 text-sm ${themeClasses.panel}`}>Cargando pantalla de cocina...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-4 lg:px-6 ${themeClasses.page}`}>
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <div className={`rounded-2xl border p-4 ${themeClasses.panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.muted}`}>Modo pantalla cocina</p>
              <h1 className={`text-2xl font-black ${themeClasses.textPrimary}`}>KDS (Kitchen Display System)</h1>
              <p className={`mt-1 text-xs ${themeClasses.muted}`}>Vista dedicada para uso continuo en pantalla secundaria.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`text-xs ${themeClasses.muted}`}>Filtro espera (min)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={minWait}
                onChange={(e) => setMinWait(e.target.value)}
                className={`w-20 rounded-lg border px-2 py-1 text-xs ${themeClasses.input}`}
              />
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['kds-standalone'] })}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${themeClasses.secondaryBtn}`}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refrescar
              </button>
              <button
                onClick={() => persistTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${themeClasses.secondaryBtn}`}
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
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
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${themeClasses.secondaryBtn}`}
              >
                Volver restaurante
              </Link>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <MetricCard label="Pendientes" value={formatInteger(summary.pending || 0)} tone="bg-amber-500/15 text-amber-200" icon={<Soup className="h-4 w-4" />} theme={theme} />
            <MetricCard label="Preparando" value={formatInteger(summary.preparing || 0)} tone="bg-blue-500/15 text-blue-200" icon={<Clock className="h-4 w-4" />} theme={theme} />
            <MetricCard label="Listos" value={formatInteger(summary.ready || 0)} tone="bg-emerald-500/15 text-emerald-200" icon={<CheckCircle2 className="h-4 w-4" />} theme={theme} />
            <MetricCard label="Atrasados" value={formatInteger(summary.overdue || 0)} tone="bg-rose-500/15 text-rose-200" icon={<Clock className="h-4 w-4" />} theme={theme} />
          </div>
        </div>

        {isLoading && (
          <div className={`rounded-xl border p-6 text-center text-sm ${themeClasses.panel} ${themeClasses.muted}`}>
            Cargando cola de cocina...
          </div>
        )}

        <div className="grid gap-3 xl:grid-cols-3">
          {(kdsData?.queue || []).map((order: any) => (
            <article key={order.id} className={`rounded-2xl border p-4 ${themeClasses.card}`}>
              <p className={`text-sm font-bold ${themeClasses.textPrimary}`}>{order.orderNumber} - Mesa {order.table?.number || '-'}</p>
              <p className={`mb-2 text-xs ${themeClasses.muted}`}>Espera total: {formatMinutes(order.waitMinutes)}</p>
              <div className="space-y-2">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className={`rounded-lg border p-2 ${themeClasses.item}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{item.quantity}x {item.productName}</p>
                      <span className={`text-xs ${item.isOverdue ? 'text-rose-500 font-bold' : themeClasses.muted}`}>
                        {formatMinutes(item.waitMinutes)}
                      </span>
                    </div>
                    {item.notes && (
                      <p className={`mt-1 rounded border px-2 py-1 text-xs ${themeClasses.panel} ${themeClasses.muted}`}>
                        Obs: {item.notes}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[
                        { key: 'PENDING', label: 'Pendiente' },
                        { key: 'PREPARING', label: 'Preparando' },
                        { key: 'READY', label: 'Listo' },
                        { key: 'SERVED', label: 'Entregado' },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() =>
                            updateItemMutation.mutate({
                              orderId: order.id,
                              itemId: item.id,
                              payload: { status: option.key },
                            })
                          }
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                            item.status === option.key
                              ? 'bg-indigo-600 text-white'
                              : theme === 'dark'
                                ? 'border border-slate-600 bg-slate-900 text-slate-200'
                                : 'border border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setEtaPad({
                            orderId: order.id,
                            itemId: item.id,
                            value: String(item.estimatedPrepMinutes || kdsData?.settings?.defaultPrepMinutes || 15),
                          })
                        }
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                      >
                        ETA {formatInteger(item.estimatedPrepMinutes || 15)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {(kdsData?.queue || []).length === 0 && !isLoading && (
          <div className={`rounded-xl border border-dashed p-8 text-center text-sm ${themeClasses.panel} ${themeClasses.muted}`}>
            No hay items en cola con este filtro.
          </div>
        )}
      </div>

      {etaPad && (
        <NumericKeypadModal
          title="Tiempo estimado (min)"
          value={etaPad.value}
          onClose={() => setEtaPad(null)}
          onChange={(next) => setEtaPad((prev) => (prev ? { ...prev, value: next } : prev))}
          onConfirm={() => {
            const minutes = Math.max(1, Math.round(Number(etaPad.value || 0)));
            updateItemMutation.mutate({
              orderId: etaPad.orderId,
              itemId: etaPad.itemId,
              payload: { estimatedPrepMinutes: minutes },
            });
            setEtaPad(null);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon,
  theme,
}: {
  label: string;
  value: string;
  tone: string;
  icon: ReactNode;
  theme: KdsTheme;
}) {
  return (
    <div className={`rounded-xl border p-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[11px] uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
          <p className={`mt-1 text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function NumericKeypadModal({
  title,
  value,
  onChange,
  onConfirm,
  onClose,
}: {
  title: string;
  value: string;
  onChange: (next: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const append = (digit: string) => {
    const clean = String(value || '').replace(/\D/g, '');
    onChange(`${clean}${digit}`);
  };

  const backspace = () => {
    const clean = String(value || '').replace(/\D/g, '');
    onChange(clean.slice(0, -1));
  };

  const clear = () => onChange('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <div className="mt-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-center text-2xl font-black text-slate-900">
          {formatInteger(value || 0)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => append(digit)}
              className="rounded-lg border border-slate-300 bg-white py-3 text-lg font-semibold text-slate-900 hover:bg-slate-100"
            >
              {digit}
            </button>
          ))}
          <button onClick={clear} className="rounded-lg border border-amber-300 bg-amber-50 py-3 text-sm font-semibold text-amber-800">C</button>
          <button onClick={() => append('0')} className="rounded-lg border border-slate-300 bg-white py-3 text-lg font-semibold text-slate-900 hover:bg-slate-100">0</button>
          <button onClick={backspace} className="rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">DEL</button>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={onConfirm} className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Guardar</button>
        </div>
      </div>
    </div>
  );
}
