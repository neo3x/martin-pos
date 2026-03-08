'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: salesReport, isLoading } = useQuery({
    queryKey: ['reports-sales', dateRange],
    queryFn: () =>
      api.get(`/reports/sales?from=${dateRange.from}&to=${dateRange.to}`).then((res) => res.data),
  });

  const { data: dailySales } = useQuery({
    queryKey: ['daily-sales'],
    queryFn: () => api.get('/sales/daily').then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>

      {/* Date Filters */}
      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold">
                ${Number(salesReport?.totalRevenue || dailySales?.totalSales || 0).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold">
                {salesReport?.totalSales || dailySales?.salesCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold">
                ${Number(salesReport?.averageTicket || 0).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold">
                {dailySales?.salesCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Payment Method */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Ventas por Método de Pago</h2>
        {salesReport?.byPaymentMethod ? (
          <div className="space-y-3">
            {Object.entries(salesReport.byPaymentMethod).map(([method, data]: [string, any]) => (
              <div key={method} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                    {method}
                  </span>
                  <span className="text-sm text-gray-500">{data.count} ventas</span>
                </div>
                <span className="font-semibold">${Number(data.total).toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            {isLoading ? 'Cargando reportes...' : 'No hay datos disponibles para el rango seleccionado'}
          </p>
        )}
      </div>

      {/* Top Products */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Productos Más Vendidos</h2>
        {salesReport?.topProducts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">Unidades</th>
                  <th className="pb-3 pr-4">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.topProducts.map((product: any, index: number) => (
                  <tr key={product.id || index} className="border-b">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-500">{index + 1}</td>
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4">{product.quantity}</td>
                    <td className="py-3 pr-4 font-semibold">
                      ${Number(product.revenue).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay datos disponibles</p>
        )}
      </div>
    </div>
  );
}
