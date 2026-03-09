'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Clock, LogIn, LogOut, Plus, UserCog, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';

type WorkerForm = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string;
  password: string;
};

const EMPTY_FORM: WorkerForm = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'CASHIER',
  phoneNumber: '',
  password: '',
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'workers' | 'shifts' | 'performance'>('workers');
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [form, setForm] = useState<WorkerForm>(EMPTY_FORM);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: roles } = useQuery({
    queryKey: ['employee-roles'],
    queryFn: () => api.get('/employees/roles').then((res) => res.data),
  });

  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/employees/workers?includeInactive=true').then((res) => res.data),
  });

  const { data: shifts } = useQuery({
    queryKey: ['employee-shifts', dateRange],
    queryFn: () => api.get('/employees/shifts', { params: dateRange }).then((res) => res.data),
  });

  const { data: performance } = useQuery({
    queryKey: ['employee-performance', selectedWorker, dateRange],
    queryFn: () => api.get(`/employees/${selectedWorker}/performance`, { params: dateRange }).then((res) => res.data),
    enabled: !!selectedWorker,
  });

  const saveWorkerMutation = useMutation({
    mutationFn: () => {
      const payload = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        phoneNumber: form.phoneNumber.trim() || undefined,
        password: form.password.trim() || undefined,
      };

      if (editingWorker) {
        return api.put(`/employees/workers/${editingWorker.id}`, payload);
      }

      return api.post('/employees/workers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success(editingWorker ? 'Trabajador actualizado' : 'Trabajador creado');
      setShowForm(false);
      setEditingWorker(null);
      setForm(EMPTY_FORM);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No fue posible guardar el trabajador');
    },
  });

  const deactivateWorkerMutation = useMutation({
    mutationFn: (workerId: string) => api.delete(`/employees/workers/${workerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Trabajador desactivado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No fue posible desactivar');
    },
  });

  const clockInMutation = useMutation({
    mutationFn: (userId?: string) => api.post('/employees/clock-in', userId ? { userId } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      toast.success('Entrada registrada');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar entrada'),
  });

  const clockOutMutation = useMutation({
    mutationFn: (userId?: string) => api.post('/employees/clock-out', userId ? { userId } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      toast.success('Salida registrada');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar salida'),
  });

  const workersById = useMemo(() => {
    const map = new Map<string, any>();
    (workers || []).forEach((worker: any) => map.set(worker.id, worker));
    return map;
  }, [workers]);

  const openCreate = () => {
    setEditingWorker(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (worker: any) => {
    setEditingWorker(worker);
    setForm({
      email: worker.email || '',
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      role: worker.role || 'CASHIER',
      phoneNumber: worker.phoneNumber || '',
      password: '',
    });
    setShowForm(true);
  };

  const tabs = [
    { id: 'workers' as const, label: 'Trabajadores', icon: UserCog },
    { id: 'shifts' as const, label: 'Turnos', icon: Clock },
    { id: 'performance' as const, label: 'Rendimiento', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Trabajadores y Roles</h1>
          <p className="mt-1 text-sm text-slate-500">Gestión operativa de personal, turnos y desempeño.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nuevo trabajador
        </button>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
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

      {activeTab === 'workers' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loadingWorkers ? (
            <p className="text-slate-500">Cargando trabajadores...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 pr-4">Nombre</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Rol</th>
                    <th className="pb-3 pr-4">Estado</th>
                    <th className="pb-3 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(workers || []).map((worker: any) => (
                    <tr key={worker.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{worker.firstName} {worker.lastName}</td>
                      <td className="py-3 pr-4 text-sm">{worker.email}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {worker.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${worker.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {worker.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEdit(worker)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          {worker.isActive && worker.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => deactivateWorkerMutation.mutate(worker.id)}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Desactivar
                            </button>
                          )}
                          <button
                            onClick={() => clockInMutation.mutate(worker.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Entrada
                          </button>
                          <button
                            onClick={() => clockOutMutation.mutate(worker.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Salida
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {shifts?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-slate-500">
                      <th className="pb-3 pr-4">Trabajador</th>
                      <th className="pb-3 pr-4">Inicio</th>
                      <th className="pb-3 pr-4">Fin</th>
                      <th className="pb-3 pr-4">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift: any) => (
                      <tr key={shift.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          {shift.user?.firstName} {shift.user?.lastName} <span className="text-xs text-slate-500">({shift.user?.role})</span>
                        </td>
                        <td className="py-3 pr-4 text-sm">{new Date(shift.startTime).toLocaleString('es-CL')}</td>
                        <td className="py-3 pr-4 text-sm">{shift.endTime ? new Date(shift.endTime).toLocaleString('es-CL') : '-'}</td>
                        <td className="py-3 pr-4 font-semibold">{Number(shift.totalHours || 0).toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No hay turnos para el periodo seleccionado
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-1 block text-sm font-medium text-slate-700">Selecciona trabajador</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar...</option>
              {(workers || []).filter((w: any) => w.isActive).map((worker: any) => (
                <option key={worker.id} value={worker.id}>
                  {worker.firstName} {worker.lastName} ({worker.role})
                </option>
              ))}
            </select>
          </div>

          {performance && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Ventas Totales" value={`$${Number(performance.totalSales || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="N° Ventas" value={`${performance.salesCount || 0}`} />
              <MetricCard label="Promedio Venta" value={`$${Number(performance.averageSale || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="Horas Trabajadas" value={`${Number(performance.totalHours || 0).toFixed(1)}h`} />
              <MetricCard label="Comisiones" value={`$${Number(performance.totalCommissions || 0).toLocaleString('es-CL')}`} />
              <MetricCard label="Venta/Hora" value={`$${Number(performance.salesPerHour || 0).toLocaleString('es-CL')}`} />
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingWorker ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={form.email}
                disabled={!!editingWorker}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {(roles || []).map((role: string) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Nombre *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Apellido *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="Teléfono"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingWorker ? 'Nueva contraseña (opcional)' : 'Contraseña (opcional)'}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveWorkerMutation.mutate()}
                disabled={!form.firstName || !form.lastName || !form.email || saveWorkerMutation.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saveWorkerMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
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
