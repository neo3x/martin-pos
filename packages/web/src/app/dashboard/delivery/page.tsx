'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Truck, Plus, MapPin, Phone, Clock, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; step: number }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', step: 0 },
  ASSIGNED: { label: 'Asignado', color: 'bg-blue-100 text-blue-700', step: 1 },
  PICKED_UP: { label: 'Recogido', color: 'bg-indigo-100 text-indigo-700', step: 2 },
  IN_TRANSIT: { label: 'En Camino', color: 'bg-purple-100 text-purple-700', step: 3 },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-700', step: 4 },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', step: -1 },
};

const PROVIDER_LABELS: Record<string, string> = {
  UBER_EATS: 'Uber Eats',
  RAPPI: 'Rappi',
  PEDIDOS_YA: 'PedidosYa',
  IN_HOUSE: 'Delivery Propio',
  OTHER: 'Otro',
};

const STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    saleId: '',
    provider: 'IN_HOUSE',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryFee: '',
    notes: '',
  });

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api.get('/delivery').then((res) => res.data).catch(() => []),
  });

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/delivery', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setShowForm(false);
      setFormData({ saleId: '', provider: 'IN_HOUSE', customerName: '', customerPhone: '', deliveryAddress: '', deliveryFee: '', notes: '' });
      toast.success('Orden de delivery creada');
    },
    onError: () => toast.error('Error al crear delivery'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const getNextStatus = (current: string) => {
    const idx = STATUSES.indexOf(current);
    return idx >= 0 && idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null;
  };

  const filtered = filter === 'ALL'
    ? deliveries
    : deliveries?.filter((d: any) => d.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion de ordenes de delivery</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Delivery
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(STATUS_MAP).filter(([k]) => k !== 'CANCELLED').map(([key, val]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{val.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {deliveries?.filter((d: any) => d.status === key).length || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Nueva Orden de Delivery</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Venta Asociada</label>
              <select
                value={formData.saleId}
                onChange={(e) => setFormData({ ...formData, saleId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar venta...</option>
                {sales?.filter((s: any) => s.status === 'COMPLETED').map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.saleNumber} - ${Number(s.total).toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <input
              placeholder="Nombre del cliente"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Telefono"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Direccion de entrega"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            />
            <input
              type="number"
              placeholder="Costo de delivery"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Notas"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => createMutation.mutate({ ...formData, deliveryFee: Number(formData.deliveryFee) || 0 })}
              disabled={!formData.deliveryAddress || createMutation.isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Delivery'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-sm hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {['ALL', ...STATUSES, 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
              filter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {status === 'ALL' ? 'Todos' : STATUS_MAP[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filtered?.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((delivery: any) => {
              const status = STATUS_MAP[delivery.status] || STATUS_MAP.PENDING;
              const nextStatus = getNextStatus(delivery.status);
              return (
                <div key={delivery.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-indigo-50 p-2.5">
                        <Truck className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {delivery.sale?.saleNumber || 'Sin venta'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {PROVIDER_LABELS[delivery.provider] || delivery.provider}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                          {delivery.customerName && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" /> {delivery.customerName}
                            </span>
                          )}
                          {delivery.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {delivery.customerPhone}
                            </span>
                          )}
                          {delivery.deliveryAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {delivery.deliveryAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {delivery.deliveryFee > 0 && (
                        <span className="text-sm font-semibold text-slate-700">
                          Envio: ${Number(delivery.deliveryFee).toLocaleString('es-CL')}
                        </span>
                      )}
                      {nextStatus && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: nextStatus })}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          {STATUS_MAP[nextStatus]?.label || nextStatus}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {delivery.status !== 'CANCELLED' && (
                    <div className="mt-3 flex gap-1">
                      {STATUSES.map((s, i) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= status.step ? 'bg-indigo-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <Truck className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            No hay ordenes de delivery
          </div>
        )}
      </div>
    </div>
  );
}
