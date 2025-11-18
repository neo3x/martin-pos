'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: dailySales } = useQuery({
    queryKey: ['daily-sales'],
    queryFn: () => api.get('/sales/daily').then((res) => res.data),
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
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas Hoy"
          value={dailySales?.salesCount || 0}
          icon={<ShoppingCart />}
          color="blue"
        />
        <StatCard
          title="Ingresos Hoy"
          value={`$${dailySales?.totalSales?.toFixed(2) || '0.00'}`}
          icon={<DollarSign />}
          color="green"
        />
        <StatCard
          title="Stock Bajo"
          value={lowStock?.length || 0}
          icon={<Package />}
          color="yellow"
        />
        <StatCard
          title="Por Vencer"
          value={expiring?.length || 0}
          icon={<AlertTriangle />}
          color="red"
        />
      </div>

      {/* Recent Sales */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Ventas Recientes</h2>
        <div className="space-y-2">
          {dailySales?.sales?.slice(0, 5).map((sale: any) => (
            <div key={sale.id} className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">{sale.saleNumber}</p>
                <p className="text-sm text-gray-600">
                  {new Date(sale.createdAt).toLocaleTimeString('es-CL')}
                </p>
              </div>
              <p className="font-semibold">${Number(sale.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color as keyof typeof colors]}`}>{icon}</div>
      </div>
    </div>
  );
}
