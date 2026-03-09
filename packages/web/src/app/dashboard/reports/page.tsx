'use client';

import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, DollarSign, ShoppingCart, Users, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function ReportsPage() {
  const moduleType = useAuthStore((state) => state.activeModule || state.user?.moduleType || 'ALL');

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: salesReport, isLoading } = useQuery({
    queryKey: ['reports-sales', dateRange],
    queryFn: () =>
      api.get(`/reports/sales?from=${dateRange.from}&to=${dateRange.to}`).then((res) => res.data),
  });

  const { data: moduleReport } = useQuery({
    queryKey: ['reports-module', dateRange],
    queryFn: () =>
      api.get(`/reports/module?from=${dateRange.from}&to=${dateRange.to}`).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-slate-500">Analitica comercial y operativa por modulo y perfil</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow">
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
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          Modulo: {moduleType}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Ingresos Totales"
          value={`$${Number(salesReport?.totalRevenue || 0).toLocaleString('es-CL')}`}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          tone="bg-green-100"
        />
        <SummaryCard
          label="Total Ventas"
          value={`${salesReport?.totalSales || 0}`}
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
          tone="bg-blue-100"
        />
        <SummaryCard
          label="Ticket Promedio"
          value={`$${Math.round(Number(salesReport?.averageTicket || 0)).toLocaleString('es-CL')}`}
          icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
          tone="bg-purple-100"
        />
        <SummaryCard
          label="Vendedores/Cajeros"
          value={`${moduleReport?.sales?.byEmployee?.length || 0}`}
          icon={<Users className="h-5 w-5 text-orange-600" />}
          tone="bg-orange-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Ventas por Metodo de Pago</h2>
          {salesReport?.byPaymentMethod ? (
            <div className="space-y-3">
              {Object.entries(salesReport.byPaymentMethod).map(([method, data]: [string, any]) => (
                <div key={method} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">{method}</span>
                    <span className="text-sm text-gray-500">{data.count} ventas</span>
                  </div>
                  <span className="font-semibold">${Number(data.total).toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{isLoading ? 'Cargando reportes...' : 'No hay datos en este rango'}</p>
          )}
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Rendimiento por Empleado</h2>
          {moduleReport?.sales?.byEmployee?.length ? (
            <div className="space-y-3">
              {moduleReport.sales.byEmployee.slice(0, 10).map((employee: any) => (
                <div key={employee.userId} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-xs text-slate-500">{employee.role} - {employee.count} ventas</p>
                  </div>
                  <span className="font-semibold">${Number(employee.revenue).toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Sin datos de empleados para el periodo</p>
          )}
        </section>
      </div>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">KPIs Especializados del Modulo</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
          {JSON.stringify(moduleReport?.moduleKpis || {}, null, 2)}
        </pre>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Productos Mas Vendidos</h2>
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
                    <td className="py-3 pr-4 font-semibold">${Number(product.revenue).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay datos disponibles</p>
        )}
      </section>
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
  icon: ReactNode;
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



