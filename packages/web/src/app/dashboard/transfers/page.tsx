'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Repeat, ArrowRight, Package, Plus, Truck, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  IN_TRANSIT: { label: 'En Transito', color: 'bg-blue-100 text-blue-700', icon: Truck },
  RECEIVED: { label: 'Recibida', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: Clock },
};

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    toBranchId: '',
    notes: '',
    items: [{ productId: '', quantity: 1 }],
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((res) => res.data),
  });

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.get('/transfers').then((res) => res.data).catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/transfers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setShowForm(false);
      setFormData({ toBranchId: '', notes: '', items: [{ productId: '', quantity: 1 }] });
      toast.success('Transferencia creada');
    },
    onError: () => toast.error('Error al crear transferencia'),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.put(`/transfers/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transferencia enviada');
    },
    onError: () => toast.error('Error al enviar'),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/transfers/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transferencia recibida');
    },
    onError: () => toast.error('Error al recibir'),
  });

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1 }] });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData({ ...formData, items });
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transferencias</h1>
          <p className="mt-1 text-sm text-gray-500">Transferencias de inventario entre sucursales</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Transferencia
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Nueva Transferencia</h2>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sucursal Destino</label>
              <select
                value={formData.toBranchId}
                onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar sucursal...</option>
                {branches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas opcionales"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Productos</label>
              <button onClick={addItem} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                + Agregar producto
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(i, 'productId', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {formData.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.toBranchId || formData.items.some((i) => !i.productId) || createMutation.isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Transferencia'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-6 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Transfers List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Historial de Transferencias</h2>
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : transfers?.length > 0 ? (
          <div className="space-y-3">
            {transfers.map((transfer: any) => {
              const status = STATUS_MAP[transfer.status] || STATUS_MAP.PENDING;
              const StatusIcon = status.icon;
              return (
                <div key={transfer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-50 p-2">
                        <Repeat className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <span>{transfer.fromBranch?.name || 'Origen'}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                          <span>{transfer.toBranch?.name || 'Destino'}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(transfer.createdAt).toLocaleString('es-CL')}
                          {transfer.notes && ` - ${transfer.notes}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      {transfer.status === 'PENDING' && (
                        <button
                          onClick={() => sendMutation.mutate(transfer.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Enviar
                        </button>
                      )}
                      {transfer.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => receiveMutation.mutate(transfer.id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Recibir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Transfer Items */}
                  {transfer.items?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {transfer.items.map((item: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 border border-slate-200">
                          <Package className="h-3 w-3" />
                          {item.quantity}x {item.product?.name || 'Producto'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <Repeat className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            No hay transferencias registradas
          </div>
        )}
      </div>
    </div>
  );
}
