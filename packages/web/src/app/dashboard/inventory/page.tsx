'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, AlertTriangle, Clock, TrendingDown } from 'lucide-react';

export default function InventoryPage() {
  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => api.get('/inventory/movements').then((res) => res.data),
  });

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Movimientos</p>
              <p className="text-2xl font-bold">{movements?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertas</p>
              <p className="text-2xl font-bold">{alerts?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold">{lowStock?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold">{expiring?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-red-600">Productos con Stock Bajo</h2>
        {lowStock?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4">Stock Actual</th>
                  <th className="pb-3 pr-4">Stock Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStock?.map((product: any) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-semibold text-red-700">
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{product.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay productos con stock bajo</p>
        )}
      </div>

      {/* Expiring Products */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-orange-600">Productos por Vencer</h2>
        {expiring?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {expiring?.map((product: any) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4">{product.stock}</td>
                    <td className="py-3 pr-4 text-sm">
                      {product.expirationDate
                        ? new Date(product.expirationDate).toLocaleDateString('es-CL')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay productos próximos a vencer</p>
        )}
      </div>

      {/* Recent Movements */}
      <div className="rounded-lg bg-white p-6 shadow">
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
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements?.slice(0, 20).map((movement: any) => (
                  <tr key={movement.id} className="border-b">
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        movement.type === 'PURCHASE' ? 'bg-green-100 text-green-700' :
                        movement.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                        movement.type === 'WASTE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{movement.product?.name || movement.productId}</td>
                    <td className="py-3 pr-4 font-medium">{movement.quantity}</td>
                    <td className="py-3 pr-4 text-sm">
                      {new Date(movement.createdAt).toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{movement.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay movimientos registrados</p>
        )}
      </div>
    </div>
  );
}
