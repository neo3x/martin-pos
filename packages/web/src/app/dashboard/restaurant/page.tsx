'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle, Clock, Plus, Receipt, Users, Utensils, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, type BusinessModule } from '@/store/auth';

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  OCCUPIED: 'bg-rose-50 border-rose-200 text-rose-800',
  RESERVED: 'bg-amber-50 border-amber-200 text-amber-800',
  CLEANING: 'bg-slate-50 border-slate-200 text-slate-800',
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLEANING: 'Limpieza',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PREPARING: 'Preparando',
  READY: 'Listo',
  SERVED: 'Servido',
  CANCELLED: 'Cancelado',
};

export default function RestaurantPage() {
  const queryClient = useQueryClient();
  const { activeModule, user, setActiveModule } = useAuthStore();
  const moduleType = (activeModule || user?.moduleType || 'ALL') as BusinessModule;
  const hasAccess = moduleType === 'RESTAURANT' || moduleType === 'ALL';
  const role = user?.role || 'ADMIN';

  const canOperateOrder = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAITER'].includes(role);
  const canKitchen = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'KITCHEN', 'WAITER'].includes(role);
  const canCashier = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const canManageTables = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ number: '', capacity: '4' });
  const [openForm, setOpenForm] = useState({ diners: '2', waiterId: '' });
  const [addItemForm, setAddItemForm] = useState({ productId: '', quantity: '1', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [splitParts, setSplitParts] = useState('2');
  const [customSplit, setCustomSplit] = useState<Record<string, number>>({});
  const [searchProduct, setSearchProduct] = useState('');

  const { data: tables, isLoading } = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: () => api.get('/restaurant/tables').then((res) => res.data),
    enabled: hasAccess,
  });

  const { data: workers } = useQuery({
    queryKey: ['restaurant-workers'],
    queryFn: () => api.get('/employees/workers').then((res) => res.data),
    enabled: hasAccess,
  });

  const { data: products } = useQuery({
    queryKey: ['restaurant-products', searchProduct],
    queryFn: () => api.get('/products', { params: { search: searchProduct, limit: 150 } }).then((res) => res.data),
    enabled: hasAccess,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['restaurant-active-orders'],
    queryFn: () => api.get('/restaurant/orders?status=active').then((res) => res.data),
    enabled: hasAccess,
  });

  useEffect(() => {
    if (!selectedTableId && tables?.length) {
      const preferred = tables.find((t: any) => t.currentOrder?.id) || tables[0];
      setSelectedTableId(preferred.id);
      if (preferred.currentOrder?.id) {
        setSelectedOrderId(preferred.currentOrder.id);
      }
    }
  }, [tables, selectedTableId]);

  const { data: account, refetch: refetchAccount } = useQuery({
    queryKey: ['restaurant-account', selectedOrderId],
    queryFn: () => api.get(`/restaurant/orders/${selectedOrderId}/account`).then((res) => res.data),
    enabled: !!selectedOrderId && hasAccess,
  });

  const invalidateRestaurant = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-account'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
  };

  const createTableMutation = useMutation({
    mutationFn: () =>
      api.post('/restaurant/tables', {
        number: newTableForm.number,
        capacity: Number(newTableForm.capacity || 0),
      }),
    onSuccess: () => {
      toast.success('Mesa creada');
      setNewTableForm({ number: '', capacity: '4' });
      invalidateRestaurant();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo crear la mesa'),
  });

  const openTableMutation = useMutation({
    mutationFn: (tableId: string) =>
      api.post(`/restaurant/tables/${tableId}/open`, {
        diners: Number(openForm.diners || 0),
        waiterId: openForm.waiterId || undefined,
      }),
    onSuccess: (res) => {
      toast.success('Mesa abierta');
      setShowOpenModal(false);
      setSelectedOrderId(res.data.order.id);
      invalidateRestaurant();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo abrir la mesa'),
  });

  const addItemsMutation = useMutation({
    mutationFn: () =>
      api.post(`/restaurant/orders/${selectedOrderId}/items`, {
        items: [
          {
            productId: addItemForm.productId,
            quantity: Number(addItemForm.quantity || 0),
            notes: addItemForm.notes || undefined,
          },
        ],
      }),
    onSuccess: () => {
      toast.success('Item agregado al pedido');
      setAddItemForm({ productId: '', quantity: '1', notes: '' });
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo agregar item'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: any }) =>
      api.put(`/restaurant/orders/${selectedOrderId}/items/${itemId}`, payload),
    onSuccess: () => {
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar item'),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/restaurant/orders/${selectedOrderId}/items/${itemId}`),
    onSuccess: () => {
      toast.success('Item eliminado');
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo eliminar item'),
  });

  const assignWaiterMutation = useMutation({
    mutationFn: (waiterId: string) => api.put(`/restaurant/orders/${selectedOrderId}/waiter`, { waiterId }),
    onSuccess: () => {
      toast.success('Garzón asignado');
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo asignar garzón'),
  });

  const updateDinersMutation = useMutation({
    mutationFn: (diners: number) => api.put(`/restaurant/orders/${selectedOrderId}/diners`, { diners }),
    onSuccess: () => {
      toast.success('Comensales actualizados');
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar comensales'),
  });

  const splitPreviewMutation = useMutation({
    mutationFn: () => api.post(`/restaurant/orders/${selectedOrderId}/split-preview`, { parts: Number(splitParts || 0) }),
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo calcular división'),
  });

  const payFullMutation = useMutation({
    mutationFn: () =>
      api.post(`/restaurant/orders/${selectedOrderId}/pay`, {
        paymentMethod,
        mode: 'FULL',
      }),
    onSuccess: () => {
      toast.success('Cobro registrado');
      setCustomSplit({});
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo registrar cobro'),
  });

  const payCustomMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(customSplit)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

      return api.post(`/restaurant/orders/${selectedOrderId}/pay`, {
        paymentMethod,
        mode: 'CUSTOM',
        items,
      });
    },
    onSuccess: () => {
      toast.success('Cobro parcial registrado');
      setCustomSplit({});
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo registrar cobro parcial'),
  });

  const closeAccountMutation = useMutation({
    mutationFn: () => api.post(`/restaurant/orders/${selectedOrderId}/close`),
    onSuccess: () => {
      toast.success('Cuenta cerrada');
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo cerrar cuenta'),
  });

  const releaseTableMutation = useMutation({
    mutationFn: (tableId: string) => api.post(`/restaurant/tables/${tableId}/release`),
    onSuccess: () => {
      toast.success('Mesa liberada');
      setSelectedOrderId('');
      invalidateRestaurant();
      refetchAccount();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo liberar mesa'),
  });

  const selectedTable = useMemo(
    () => (tables || []).find((table: any) => table.id === selectedTableId),
    [tables, selectedTableId],
  );

  const waiterOptions = useMemo(
    () =>
      (workers || []).filter((worker: any) => ['WAITER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(worker.role)),
    [workers],
  );

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Módulo restaurante no activo</h1>
        <p className="mt-2 text-sm text-slate-600">Cambia al módulo Restaurante para operar mesas y comandas.</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setActiveModule('RESTAURANT')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Cambiar a Restaurante
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const availableCount = tables?.filter((t: any) => t.status === 'AVAILABLE').length || 0;
  const occupiedCount = tables?.filter((t: any) => t.status === 'OCCUPIED').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operación Restaurante</h1>
          <p className="mt-1 text-sm text-slate-500">Mesas, comensales, pedido por mesa, cuenta dividida y cobro por cajero.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Mesas Disponibles" value={`${availableCount}`} icon={<CheckCircle className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Mesas Ocupadas" value={`${occupiedCount}`} icon={<Users className="h-5 w-5" />} tone="bg-rose-50 text-rose-700" />
        <SummaryCard label="Órdenes Activas" value={`${activeOrders?.length || 0}`} icon={<Utensils className="h-5 w-5" />} tone="bg-blue-50 text-blue-700" />
        <SummaryCard label="Rol Actual" value={role} icon={<Clock className="h-5 w-5" />} tone="bg-slate-100 text-slate-700" />
      </div>

      {canManageTables && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Gestión de mesas</h2>
          <div className="flex flex-wrap items-end gap-2">
            <input
              value={newTableForm.number}
              onChange={(e) => setNewTableForm({ ...newTableForm, number: e.target.value })}
              placeholder="N° mesa"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={newTableForm.capacity}
              onChange={(e) => setNewTableForm({ ...newTableForm, capacity: e.target.value })}
              placeholder="Capacidad"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => createTableMutation.mutate()}
              disabled={!newTableForm.number || Number(newTableForm.capacity || 0) < 1 || createTableMutation.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Crear mesa
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Mapa de mesas</h2>
          {isLoading ? (
            <p className="text-sm text-slate-500">Cargando mesas...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(tables || []).map((table: any) => {
                const isSelected = selectedTableId === table.id;
                const order = table.currentOrder;
                const remaining = Number(table.currentAccountSubtotal || 0);

                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setSelectedOrderId(order?.id || '');
                      setOpenForm((prev) => ({ ...prev, waiterId: order?.waiter?.id || '' }));
                    }}
                    className={`rounded-xl border-2 p-3 text-left transition ${TABLE_STATUS_COLORS[table.status] || 'bg-slate-50'} ${isSelected ? 'ring-2 ring-indigo-300' : ''}`}
                  >
                    <p className="text-base font-bold">Mesa {table.number}</p>
                    <p className="text-xs">Capacidad: {table.capacity}</p>
                    <p className="mt-1 text-xs font-semibold">{TABLE_STATUS_LABELS[table.status] || table.status}</p>
                    <p className="mt-1 text-xs">Comensales: {table.currentDiners || 0}</p>
                    <p className="text-xs">Garzón: {order?.waiter ? `${order.waiter.firstName} ${order.waiter.lastName}` : '-'}</p>
                    <p className="mt-2 text-xs font-semibold">Saldo: ${remaining.toLocaleString('es-CL')}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {!order && canOperateOrder && (
                        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold">Abrir mesa</span>
                      )}
                      {table.status === 'CLEANING' && canCashier && (
                        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold">Lista para liberar</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedTable ? `Mesa ${selectedTable.number}` : 'Selecciona una mesa'}
              </h2>

              {selectedTable && !selectedOrderId && canOperateOrder && (
                <button
                  onClick={() => {
                    setOpenForm({ diners: '2', waiterId: '' });
                    setShowOpenModal(true);
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Abrir mesa
                </button>
              )}

              {selectedTable && selectedTable.status === 'CLEANING' && canCashier && (
                <button
                  onClick={() => releaseTableMutation.mutate(selectedTable.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Liberar mesa
                </button>
              )}
            </div>

            {selectedOrderId && account ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <StatPill label="Pedido" value={account.order.orderNumber} />
                  <StatPill label="Estado" value={ORDER_STATUS_LABELS[account.order.status] || account.order.status} />
                  <StatPill label="Comensales" value={`${account.order.diners}`} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Garzón asignado</label>
                    <select
                      value={account.waiter?.id || ''}
                      onChange={(e) => assignWaiterMutation.mutate(e.target.value)}
                      disabled={!canOperateOrder}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">Seleccionar</option>
                      {waiterOptions.map((worker: any) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.firstName} {worker.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Actualizar comensales</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        defaultValue={account.order.diners}
                        onBlur={(e) => {
                          const diners = Number(e.target.value || 0);
                          if (diners > 0) updateDinersMutation.mutate(diners);
                        }}
                        disabled={!canOperateOrder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {canOperateOrder && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Agregar items al pedido</p>
                    <div className="grid gap-2 md:grid-cols-4">
                      <input
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Buscar producto"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={addItemForm.productId}
                        onChange={(e) => setAddItemForm({ ...addItemForm, productId: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">Seleccionar producto</option>
                        {(products || []).map((product: any) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (${Number(product.price).toLocaleString('es-CL')})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={addItemForm.quantity}
                        onChange={(e) => setAddItemForm({ ...addItemForm, quantity: e.target.value })}
                        placeholder="Cantidad"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => addItemsMutation.mutate()}
                        disabled={!addItemForm.productId || Number(addItemForm.quantity || 0) < 1 || addItemsMutation.isPending}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                    Cuenta visible
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(account.lines || []).map((line: any) => (
                      <div key={line.id} className="p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{line.productName}</p>
                            <p className="text-xs text-slate-500">
                              Qty: {line.quantity} | Pagado: {line.paidQuantity} | Pendiente: {line.remainingQuantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">${Number(line.subtotal).toLocaleString('es-CL')}</p>
                            <p className="text-xs text-slate-500">Pendiente ${Number(line.remainingSubtotal).toLocaleString('es-CL')}</p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {canKitchen && (
                            <select
                              value={line.status}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  itemId: line.id,
                                  payload: { status: e.target.value },
                                })
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            >
                              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                                <option key={status} value={status}>{label}</option>
                              ))}
                            </select>
                          )}

                          {canOperateOrder && Number(line.paidQuantity) === 0 && (
                            <button
                              onClick={() => removeItemMutation.mutate(line.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              <X className="h-3 w-3" />
                              Quitar
                            </button>
                          )}

                          {canCashier && line.remainingQuantity > 0 && (
                            <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1">
                              <span className="text-[11px] text-slate-500">Cobrar parcial</span>
                              <input
                                type="number"
                                min={0}
                                max={line.remainingQuantity}
                                value={customSplit[line.id] || 0}
                                onChange={(e) =>
                                  setCustomSplit((prev) => ({
                                    ...prev,
                                    [line.id]: Math.max(0, Math.min(line.remainingQuantity, Number(e.target.value || 0))),
                                  }))
                                }
                                className="w-16 rounded border border-slate-300 px-1 py-0.5 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p>Subtotal: <strong>${Number(account.totals.subtotal).toLocaleString('es-CL')}</strong></p>
                    <p>Total cuenta: <strong>${Number(account.totals.total).toLocaleString('es-CL')}</strong></p>
                    <p>Total pagado: <strong>${Number(account.totals.paidTotal).toLocaleString('es-CL')}</strong></p>
                    <p className="text-base">Saldo pendiente: <strong>${Number(account.totals.remainingTotal).toLocaleString('es-CL')}</strong></p>
                  </div>
                </div>

                {canCashier && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-indigo-700">
                      <Receipt className="h-3.5 w-3.5" />
                      Cobro por cajero
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="CARD_POS">Tarjeta POS</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="QR">QR</option>
                      </select>

                      <button
                        onClick={() => payFullMutation.mutate()}
                        disabled={Number(account.totals.remainingTotal || 0) <= 0 || payFullMutation.isPending}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Cobrar total
                      </button>

                      <button
                        onClick={() => payCustomMutation.mutate()}
                        disabled={
                          Object.values(customSplit).reduce((sum, qty) => sum + Number(qty || 0), 0) <= 0 ||
                          payCustomMutation.isPending
                        }
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Cobro parcial
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={2}
                        value={splitParts}
                        onChange={(e) => setSplitParts(e.target.value)}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => splitPreviewMutation.mutate()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                      >
                        Vista división
                      </button>
                      <button
                        onClick={() => closeAccountMutation.mutate()}
                        disabled={Number(account.totals.remainingTotal || 0) > 0 || closeAccountMutation.isPending}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Cerrar cuenta
                      </button>
                    </div>

                    {splitPreviewMutation.data?.data?.split && (
                      <div className="mt-2 rounded-lg border border-indigo-200 bg-white p-2 text-xs text-indigo-800">
                        {splitPreviewMutation.data.data.split.map((item: any) => (
                          <p key={item.part}>Parte {item.part}: ${Number(item.amount).toLocaleString('es-CL')}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                {selectedTable ? 'La mesa no tiene cuenta activa.' : 'Selecciona una mesa para operar.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {showOpenModal && selectedTable && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Abrir mesa {selectedTable.number}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Comensales</label>
                <input
                  type="number"
                  min={1}
                  max={selectedTable.capacity}
                  value={openForm.diners}
                  onChange={(e) => setOpenForm({ ...openForm, diners: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Garzón</label>
                <select
                  value={openForm.waiterId}
                  onChange={(e) => setOpenForm({ ...openForm, waiterId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Asignar automáticamente</option>
                  {waiterOptions.map((worker: any) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowOpenModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => openTableMutation.mutate(selectedTable.id)}
                disabled={Number(openForm.diners || 0) < 1 || openTableMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Abrir mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${tone}`}>{icon}</div>
      </div>
    </article>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
