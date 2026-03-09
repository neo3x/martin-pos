'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Wallet, Plus, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Activo', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  DEFAULTED: { label: 'Vencido', color: 'bg-amber-100 text-amber-700' },
};

export default function LayawayPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [formData, setFormData] = useState({
    customerId: '',
    dueDate: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });

  const { data: layaways, isLoading } = useQuery({
    queryKey: ['layaways'],
    queryFn: () => api.get('/layaway').then((res) => res.data).catch(() => []),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/layaway', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layaways'] });
      setShowForm(false);
      setFormData({ customerId: '', dueDate: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] });
      toast.success('Apartado creado exitosamente');
    },
    onError: () => toast.error('Error al crear apartado'),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/layaway/${id}/payment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layaways'] });
      setPayingId(null);
      setPaymentAmount('');
      toast.success('Pago registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar pago'),
  });

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }] });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'productId') {
      const product = products?.find((p: any) => p.id === value);
      if (product) items[index].unitPrice = Number(product.price);
    }
    setFormData({ ...formData, items });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apartados (Layaway)</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion de apartados y pagos parciales</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Apartado
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Apartados Activos</p>
          <p className="mt-2 text-3xl font-black text-blue-600">
            {layaways?.filter((l: any) => l.status === 'ACTIVE').length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Monto Total Pendiente</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            ${layaways
              ?.filter((l: any) => l.status === 'ACTIVE')
              .reduce((sum: number, l: any) => sum + Number(l.remainingBalance || 0), 0)
              .toLocaleString('es-CL') || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Completados</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {layaways?.filter((l: any) => l.status === 'COMPLETED').length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Por Vencer</p>
          <p className="mt-2 text-3xl font-black text-amber-600">
            {layaways?.filter((l: any) => {
              if (l.status !== 'ACTIVE' || !l.dueDate) return false;
              const days = (new Date(l.dueDate).getTime() - Date.now()) / 86400000;
              return days <= 7 && days > 0;
            }).length || 0}
          </p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Nuevo Apartado</h2>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cliente...</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha Limite</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Productos</label>
              <button onClick={addItem} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                + Agregar
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
                      <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toLocaleString('es-CL')}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Cant."
                  />
                  <span className="text-sm font-semibold text-slate-700 w-28 text-right">
                    ${(item.unitPrice * item.quantity).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right text-lg font-bold text-slate-900">
              Total: ${formData.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toLocaleString('es-CL')}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.customerId || formData.items.some((i) => !i.productId) || createMutation.isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Apartado'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-sm hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Layaways List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Apartados</h2>
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : layaways?.length > 0 ? (
          <div className="space-y-4">
            {layaways.map((layaway: any) => {
              const status = STATUS_MAP[layaway.status] || STATUS_MAP.ACTIVE;
              const total = Number(layaway.totalAmount || 0);
              const paid = Number(layaway.paidAmount || 0);
              const remaining = Number(layaway.remainingBalance || total - paid);
              const progress = total > 0 ? (paid / total) * 100 : 0;
              const isOverdue = layaway.dueDate && new Date(layaway.dueDate) < new Date() && layaway.status === 'ACTIVE';

              return (
                <div key={layaway.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-indigo-600" />
                        <span className="font-bold text-slate-900">{layaway.customer?.name || 'Cliente'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3 w-3" /> Vencido
                          </span>
                        )}
                      </div>
                      {layaway.dueDate && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          Vence: {new Date(layaway.dueDate).toLocaleDateString('es-CL')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-xl font-black text-slate-900">${total.toLocaleString('es-CL')}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Pagado: ${paid.toLocaleString('es-CL')}</span>
                      <span>Pendiente: ${remaining.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{progress.toFixed(0)}% completado</p>
                  </div>

                  {/* Items */}
                  {layaway.items?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {layaway.items.map((item: any, i: number) => (
                        <span key={i} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {item.quantity}x {item.product?.name || 'Producto'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Payments */}
                  {layaway.payments?.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold text-slate-500">Pagos realizados:</p>
                      <div className="space-y-1">
                        {layaway.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString('es-CL')} - {p.paymentMethod}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              +${Number(p.amount).toLocaleString('es-CL')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Payment */}
                  {layaway.status === 'ACTIVE' && (
                    <div className="mt-4">
                      {payingId === layaway.id ? (
                        <div className="flex items-end gap-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-600">Monto</label>
                            <input
                              type="number"
                              min="1"
                              max={remaining}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              placeholder="Monto del abono"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Metodo</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                              <option value="CASH">Efectivo</option>
                              <option value="CARD">Tarjeta</option>
                              <option value="TRANSFER">Transferencia</option>
                            </select>
                          </div>
                          <button
                            onClick={() =>
                              paymentMutation.mutate({
                                id: layaway.id,
                                data: { amount: Number(paymentAmount), paymentMethod },
                              })
                            }
                            disabled={!paymentAmount || paymentMutation.isPending}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Abonar
                          </button>
                          <button
                            onClick={() => { setPayingId(null); setPaymentAmount(''); }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayingId(layaway.id)}
                          className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <DollarSign className="h-4 w-4" />
                          Registrar Abono
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            No hay apartados registrados
          </div>
        )}
      </div>
    </div>
  );
}
