'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, AlertTriangle, Clock, TrendingDown, ArrowDownToLine, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [receiveCost, setReceiveCost] = useState('');
  const [adjustStockValue, setAdjustStockValue] = useState('');
  const [reason, setReason] = useState('');

  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => api.get('/inventory/movements').then((res) => res.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => api.get('/inventory/alerts').then((res) => res.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products/low-stock').then((res) => res.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['expiring'],
    queryFn: () => api.get('/products/expiring').then((res) => res.data),
  });

  const { data: criticalStock } = useQuery({
    queryKey: ['inventory-critical-stock'],
    queryFn: () => api.get('/inventory/critical-stock').then((res) => res.data),
  });

  const { data: replenishment } = useQuery({
    queryKey: ['inventory-replenishment'],
    queryFn: () => api.get('/inventory/replenishment').then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => api.get('/products?limit=120').then((res) => res.data),
  });

  const selectedProduct = useMemo(
    () => (products || []).find((product: any) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const receiveMutation = useMutation({
    mutationFn: () =>
      api.post('/inventory/receive', {
        productId: selectedProductId,
        quantity: Number(receiveQuantity || 0),
        unitCost: receiveCost ? Number(receiveCost) : undefined,
        reason: reason || 'Ingreso de mercaderia',
      }),
    onSuccess: () => {
      toast.success('Ingreso de mercaderia registrado');
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-critical-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-replenishment'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setReceiveQuantity('');
      setReceiveCost('');
      setReason('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo registrar ingreso'),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      api.post('/inventory/adjust', {
        productId: selectedProductId,
        newStock: Number(adjustStockValue || 0),
        reason: reason || 'Ajuste de inventario',
      }),
    onSuccess: () => {
      toast.success('Ajuste de inventario registrado');
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-critical-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-replenishment'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setAdjustStockValue('');
      setReason('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo ajustar stock'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Inventario Operativo</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Package className="h-5 w-5 text-blue-600" />} label="Movimientos" value={`${movements?.length || 0}`} tone="bg-blue-100" />
        <MetricCard icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />} label="Alertas" value={`${alerts?.length || 0}`} tone="bg-yellow-100" />
        <MetricCard icon={<TrendingDown className="h-5 w-5 text-red-600" />} label="Stock Critico" value={`${criticalStock?.totalCritical || lowStock?.length || 0}`} tone="bg-red-100" />
        <MetricCard icon={<Clock className="h-5 w-5 text-orange-600" />} label="Por Vencer" value={`${expiring?.length || 0}`} tone="bg-orange-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Recepcion de Mercaderia</h2>
          <div className="space-y-3">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Selecciona producto</option>
              {(products || []).map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="number"
                min="1"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(e.target.value)}
                placeholder="Cantidad ingreso"
                className="rounded-lg border px-3 py-2"
              />
              <input
                type="number"
                min="0"
                value={receiveCost}
                onChange={(e) => setReceiveCost(e.target.value)}
                placeholder="Costo unitario"
                className="rounded-lg border px-3 py-2"
              />
            </div>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="w-full rounded-lg border px-3 py-2"
            />
            <button
              onClick={() => receiveMutation.mutate()}
              disabled={receiveMutation.isPending || !selectedProductId || !receiveQuantity}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Registrar ingreso
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Ajuste de Stock</h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Producto: <span className="font-semibold text-slate-900">{selectedProduct?.name || 'No seleccionado'}</span>
              <br />
              Stock actual: <span className="font-semibold text-slate-900">{selectedProduct?.stock ?? '-'}</span>
            </div>
            <input
              type="number"
              min="0"
              value={adjustStockValue}
              onChange={(e) => setAdjustStockValue(e.target.value)}
              placeholder="Nuevo stock"
              className="w-full rounded-lg border px-3 py-2"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo ajuste"
              className="w-full rounded-lg border px-3 py-2"
            />
            <button
              onClick={() => adjustMutation.mutate()}
              disabled={adjustMutation.isPending || !selectedProductId || adjustStockValue === ''}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900 disabled:opacity-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Registrar ajuste
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-red-600">Stock Critico y Reposicion Sugerida</h2>
        {criticalStock?.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Minimo</th>
                  <th className="pb-3 pr-4">Cobertura</th>
                  <th className="pb-3 pr-4">Sugerido</th>
                </tr>
              </thead>
              <tbody>
                {criticalStock.items.map((product: any) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4">{product.stock}</td>
                    <td className="py-3 pr-4">{product.minStock}</td>
                    <td className="py-3 pr-4">{product.daysCoverage ? `${product.daysCoverage} dias` : '-'}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">{product.suggestedReorder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay productos en estado critico</p>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Movimientos Recientes</h2>
        {loadingMovements ? (
          <p className="text-gray-500">Cargando...</p>
        ) : movements?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">Cantidad</th>
                  <th className="pb-3 pr-4">Usuario</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 25).map((movement: any) => (
                  <tr key={movement.id} className="border-b">
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          movement.type === 'PURCHASE'
                            ? 'bg-green-100 text-green-700'
                            : movement.type === 'SALE'
                              ? 'bg-blue-100 text-blue-700'
                              : movement.type === 'ADJUSTMENT'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{movement.product?.name || movement.productId}</td>
                    <td className="py-3 pr-4 font-medium">{movement.quantity}</td>
                    <td className="py-3 pr-4 text-sm">
                      {movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : '-'}
                    </td>
                    <td className="py-3 pr-4 text-sm">{new Date(movement.createdAt).toLocaleString('es-CL')}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{movement.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay movimientos registrados</p>
        )}
      </section>

      {replenishment?.suggestions?.length > 0 && (
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Sugerencias de Reposicion</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {replenishment.suggestions.slice(0, 9).map((item: any) => (
              <div key={item.productId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold">{item.productName}</p>
                <p className="text-xs text-slate-600">Stock actual: {item.currentStock} | Min: {item.minStock}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">Sugerido: +{item.suggestedQuantity}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-3 ${tone}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}



