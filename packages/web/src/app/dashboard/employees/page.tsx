'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Clock, DollarSign, TrendingUp, LogIn, LogOut, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'shifts' | 'commissions' | 'performance'>('shifts');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ['employee-shifts', dateRange],
    queryFn: () =>
      api.get('/employees/shifts', { params: dateRange }).then((res) => res.data),
  });

  const { data: commissions } = useQuery({
    queryKey: ['employee-commissions', dateRange],
    queryFn: () =>
      api.get('/employees/commissions', { params: dateRange }).then((res) => res.data),
  });

  const { data: performance } = useQuery({
    queryKey: ['employee-performance', selectedEmployee, dateRange],
    queryFn: () =>
      api.get(`/employees/${selectedEmployee}/performance`, { params: dateRange }).then((res) => res.data),
    enabled: !!selectedEmployee,
  });

  const clockInMutation = useMutation({
    mutationFn: () => api.post('/employees/clock-in'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      toast.success('Entrada registrada');
    },
    onError: () => toast.error('Error al registrar entrada'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => api.post('/employees/clock-out'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      toast.success('Salida registrada');
    },
    onError: () => toast.error('Error al registrar salida'),
  });

  const tabs = [
    { id: 'shifts' as const, label: 'Turnos', icon: Clock },
    { id: 'commissions' as const, label: 'Comisiones', icon: DollarSign },
    { id: 'performance' as const, label: 'Rendimiento', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
          <p className="mt-1 text-sm text-gray-500">Turnos, comisiones y rendimiento</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            Marcar Entrada
          </button>
          <button
            onClick={() => clockOutMutation.mutate()}
            disabled={clockOutMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Marcar Salida
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Registro de Turnos</h2>
          {loadingShifts ? (
            <p className="text-slate-500">Cargando...</p>
          ) : shifts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 pr-4">Empleado</th>
                    <th className="pb-3 pr-4">Entrada</th>
                    <th className="pb-3 pr-4">Salida</th>
                    <th className="pb-3 pr-4">Horas</th>
                    <th className="pb-3 pr-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift: any) => {
                    const hours = shift.hoursWorked
                      ? Number(shift.hoursWorked).toFixed(1)
                      : shift.clockOut
                      ? (
                          (new Date(shift.clockOut).getTime() - new Date(shift.clockIn).getTime()) /
                          3600000
                        ).toFixed(1)
                      : '-';
                    return (
                      <tr key={shift.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{shift.user?.name || 'N/A'}</td>
                        <td className="py-3 pr-4 text-sm">
                          {new Date(shift.clockIn).toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          {shift.clockOut
                            ? new Date(shift.clockOut).toLocaleString('es-CL')
                            : '-'}
                        </td>
                        <td className="py-3 pr-4 font-semibold">{hours}h</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              shift.clockOut
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {shift.clockOut ? 'Finalizado' : 'En turno'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay turnos registrados en este periodo
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Comisiones de Ventas</h2>
          {commissions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 pr-4">Empleado</th>
                    <th className="pb-3 pr-4">Venta</th>
                    <th className="pb-3 pr-4">Monto Venta</th>
                    <th className="pb-3 pr-4">Tasa</th>
                    <th className="pb-3 pr-4">Comision</th>
                    <th className="pb-3 pr-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{c.user?.name || 'N/A'}</td>
                      <td className="py-3 pr-4 text-sm">{c.sale?.saleNumber || '-'}</td>
                      <td className="py-3 pr-4">${Number(c.saleAmount || 0).toLocaleString('es-CL')}</td>
                      <td className="py-3 pr-4 text-sm">{(Number(c.rate || 0) * 100).toFixed(1)}%</td>
                      <td className="py-3 pr-4 font-bold text-emerald-600">
                        ${Number(c.amount || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        {new Date(c.createdAt).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              <Award className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              No hay comisiones registradas en este periodo
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Rendimiento del Empleado</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Seleccionar Empleado</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona un empleado...</option>
                {shifts?.map((s: any) => s.user).filter((u: any, i: number, a: any[]) => u && a.findIndex((x: any) => x?.id === u?.id) === i).map((user: any) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {performance && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Total Ventas" value={`$${Number(performance.totalSales || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="Promedio por Venta" value={`$${Number(performance.averageSale || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="Num. Ventas" value={`${performance.salesCount || 0}`} />
              <MetricCard label="Horas Trabajadas" value={`${Number(performance.hoursWorked || 0).toFixed(1)}h`} />
              <MetricCard label="Comisiones Ganadas" value={`$${Number(performance.totalCommissions || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="Ventas por Hora" value={`$${Number(performance.salesPerHour || 0).toLocaleString('es-CL')}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
