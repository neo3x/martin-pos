'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BellRing, ClipboardList, Receipt, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrencyInt } from '@/lib/number-format';

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PREPARING: 'En preparacion',
  READY: 'Listo',
  SERVED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const ORDER_LIFECYCLE_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviada',
  PREPARING: 'En preparacion',
  READY: 'Lista',
  SERVED: 'Entregada',
  FINALIZED: 'Cerrada/finalizada',
  CANCELLED: 'Cancelada',
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Enviada',
  ACKNOWLEDGED: 'Reconocida',
  RESOLVED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export default function CustomerQrPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token || '');
  const [message, setMessage] = useState('');

  const { data: menuData, isLoading: loadingMenu, refetch: refetchMenu } = useQuery({
    queryKey: ['public-table-menu', token],
    queryFn: () => api.get(`/restaurant/public/table/${token}/menu`).then((res) => res.data),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const { data: statusData, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['public-table-status', token],
    queryFn: () => api.get(`/restaurant/public/table/${token}/order-status`).then((res) => res.data),
    enabled: !!token,
    refetchInterval: 7000,
  });

  const requestMutation = useMutation({
    mutationFn: (payload: { type: 'CONSULTATION' | 'BILL'; message?: string }) =>
      api.post(`/restaurant/public/table/${token}/request`, payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Solicitud enviada');
      setMessage('');
      refetchStatus();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo enviar la solicitud'),
  });

  const groupedMenu = useMemo(() => menuData?.menu || [], [menuData?.menu]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portal cliente</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {menuData?.branch?.name || 'Restaurante'} - Mesa {menuData?.table?.number || '-'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Carta en tiempo real, estado del pedido y contacto directo con garzon.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                refetchMenu();
                refetchStatus();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Carta actualizada</h2>
            {loadingMenu ? (
              <p className="mt-3 text-sm text-slate-500">Cargando carta...</p>
            ) : (
              <div className="mt-4 space-y-4">
                {groupedMenu.map((category: any) => (
                  <div key={category.id} className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      {category.name}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(category.items || []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.description || 'Sin descripcion'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{formatCurrencyInt(item.price)}</p>
                            <p className={`text-xs ${item.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {item.available ? 'Disponible' : 'No disponible'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedMenu.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No hay productos publicados para esta mesa.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Estado del pedido</h2>
              {loadingStatus ? (
                <p className="mt-3 text-sm text-slate-500">Cargando estado...</p>
              ) : statusData?.order ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-600">
                    {statusData.order.orderNumber} -{' '}
                    {ORDER_LIFECYCLE_LABELS[statusData.order.lifecycleStatus || statusData.order.status] || statusData.order.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {statusData.order.sentToKitchen ? 'Comanda enviada a cocina' : 'Comanda aun no enviada'}
                  </p>
                  {statusData.order.closedAt && (
                    <p className="text-xs font-semibold text-emerald-700">
                      Pedido finalizado el {new Date(statusData.order.closedAt).toLocaleString('es-CL')}
                    </p>
                  )}
                  <div className="space-y-1">
                    {(statusData.order.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                        <span>{item.quantity}x {item.productName}</span>
                        <span className="font-semibold">{ITEM_STATUS_LABELS[item.status] || item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No hay pedido registrado para esta mesa.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Llamar al garzon</h2>
              <p className="mt-1 text-xs text-slate-500">Puedes dejar un mensaje breve opcional.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Ejemplo: necesitamos agua o ayuda con la carta"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-3 grid gap-2">
                <button
                  onClick={() => requestMutation.mutate({ type: 'CONSULTATION', message })}
                  disabled={requestMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <BellRing className="h-4 w-4" />
                  Solicitar consulta
                </button>
                <button
                  onClick={() => requestMutation.mutate({ type: 'BILL', message })}
                  disabled={requestMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Receipt className="h-4 w-4" />
                  Solicitar cuenta
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardList className="h-4 w-4" />
                Solicitudes recientes
              </div>
              <div className="space-y-2 text-xs">
                {(statusData?.requests || []).map((request: any) => (
                  <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                    <p className="font-semibold">
                      {request.type === 'BILL' ? 'Cuenta' : 'Consulta'} - {REQUEST_STATUS_LABELS[request.status] || request.status}
                    </p>
                    <p className="text-slate-500">{new Date(request.requestedAt).toLocaleString('es-CL')}</p>
                    {request.resolvedAt && (
                      <p className="text-slate-500">Cierre: {new Date(request.resolvedAt).toLocaleString('es-CL')}</p>
                    )}
                  </div>
                ))}
                {(statusData?.requests || []).length === 0 && (
                  <p className="text-slate-500">Sin solicitudes recientes.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
