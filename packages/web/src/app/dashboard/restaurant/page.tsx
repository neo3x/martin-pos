'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Utensils, Users, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-300 text-green-800',
  OCCUPIED: 'bg-red-100 border-red-300 text-red-800',
  RESERVED: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  CLEANING: 'bg-gray-100 border-gray-300 text-gray-800',
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLEANING: 'Limpieza',
};

export default function RestaurantPage() {
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/restaurant/tables').then((res) => res.data),
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => api.get('/restaurant/orders?status=active').then((res) => res.data),
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: string }) =>
      api.put(`/restaurant/tables/${tableId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Mesa actualizada');
    },
  });

  const availableCount = tables?.filter((t: any) => t.status === 'AVAILABLE').length || 0;
  const occupiedCount = tables?.filter((t: any) => t.status === 'OCCUPIED').length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Restaurante</h1>

      {/* Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold">{availableCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <Users className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold">{occupiedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Utensils className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold">{tables?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Órdenes Activas</p>
              <p className="text-2xl font-bold">{activeOrders?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Map */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Mapa de Mesas</h2>
        {isLoading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : tables?.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tables.map((table: any) => (
              <div
                key={table.id}
                className={`rounded-lg border-2 p-4 text-center ${TABLE_STATUS_COLORS[table.status] || 'bg-gray-50'}`}
              >
                <p className="text-lg font-bold">Mesa {table.number}</p>
                <p className="text-sm">{table.capacity} personas</p>
                <p className="mt-1 text-xs font-medium">
                  {TABLE_STATUS_LABELS[table.status] || table.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Utensils className="mx-auto mb-3 h-12 w-12" />
            <p>No hay mesas configuradas</p>
            <p className="text-sm">Configure mesas desde el backend para comenzar</p>
          </div>
        )}
      </div>

      {/* Active Orders */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Órdenes Activas</h2>
        {activeOrders?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order: any) => (
              <div key={order.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">Mesa {order.table?.number || '?'}</span>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'READY' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {order.items?.map((item: any, i: number) => (
                    <p key={i}>{item.quantity}x {item.product?.name || item.name}</p>
                  ))}
                </div>
                <p className="mt-2 text-right font-semibold">
                  ${Number(order.total || 0).toLocaleString('es-CL')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay órdenes activas</p>
        )}
      </div>
    </div>
  );
}
