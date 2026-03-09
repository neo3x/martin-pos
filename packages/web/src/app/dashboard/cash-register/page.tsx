'use client';

import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Banknote, DollarSign, Lock, Unlock, ArrowUpCircle, ArrowDownCircle, WalletCards } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { formatCurrencyInt } from '@/lib/number-format';

export default function CashRegisterPage() {
  const queryClient = useQueryClient();
  const moduleType = useAuthStore((state) => state.activeModule || state.user?.moduleType || 'ALL');
  const showTips = moduleType === 'RESTAURANT' || moduleType === 'ALL';
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [movementMethod, setMovementMethod] = useState('CASH');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');

  const { data: currentRegister, isLoading } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: () => api.get('/cash-register/current').then((res) => res.data),
  });

  const { data: registerHistory } = useQuery({
    queryKey: ['cash-register-history'],
    queryFn: () => api.get('/cash-register/history').then((res) => res.data).catch(() => []),
  });

  const { data: registerSummary } = useQuery({
    queryKey: ['cash-register-summary'],
    queryFn: () => api.get('/cash-register/summary').then((res) => res.data).catch(() => null),
  });

  const openMutation = useMutation({
    mutationFn: (data: { initialCash: number }) => api.post('/cash-register/open', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      setInitialCash('');
      toast.success('Caja abierta exitosamente');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al abrir caja'),
  });

  const closeMutation = useMutation({
    mutationFn: (data: { finalCash: number }) =>
      api.put(`/cash-register/${currentRegister?.id}/close`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      setFinalCash('');
      toast.success('Caja cerrada exitosamente');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al cerrar caja'),
  });

  const movementMutation = useMutation({
    mutationFn: () =>
      api.post(`/cash-register/${currentRegister?.id}/movements`, {
        type: movementType,
        paymentMethod: movementMethod,
        amount: Number(movementAmount || 0),
        description: movementDescription,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      setMovementAmount('');
      setMovementDescription('');
      toast.success('Movimiento de caja registrado');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar movimiento'),
  });

  const isOpen = !!(currentRegister && !currentRegister.closedAt);
  const expectedCash = Number(currentRegister?.expectedCash || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja Registradora</h1>
          <p className="mt-1 text-sm text-gray-500">Apertura, movimientos, arqueo y cierre por turno</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isOpen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
        </span>
      </div>

      {!isOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Banknote className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Abrir Caja</h2>
            <p className="mt-2 text-sm text-slate-500">Ingresa el monto inicial para comenzar el turno</p>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">Monto Inicial ($)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <button
              onClick={() => openMutation.mutate({ initialCash: Number(initialCash) || 0 })}
              disabled={openMutation.isPending}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {openMutation.isPending ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard title="Monto Inicial" value={formatCurrencyInt(currentRegister.initialCash || 0)} icon={<ArrowDownCircle className="h-5 w-5" />} tone="bg-blue-50 text-blue-700" />
            <StatCard title="Ventas" value={formatCurrencyInt(currentRegister.salesIncome || 0)} icon={<ArrowUpCircle className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-700" />
            {showTips && (
              <StatCard title="Propinas" value={formatCurrencyInt(currentRegister.tipsIncome || 0)} icon={<DollarSign className="h-5 w-5" />} tone="bg-amber-50 text-amber-700" />
            )}
            <StatCard title="Otros ingresos" value={formatCurrencyInt(currentRegister.otherIncome || 0)} icon={<WalletCards className="h-5 w-5" />} tone="bg-indigo-50 text-indigo-700" />
            <StatCard title="Egresos" value={formatCurrencyInt(currentRegister.expenseTotal || 0)} icon={<WalletCards className="h-5 w-5" />} tone="bg-rose-50 text-rose-700" />
            <StatCard title="Efectivo Esperado" value={formatCurrencyInt(expectedCash)} icon={<DollarSign className="h-5 w-5" />} tone="bg-amber-50 text-amber-700" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Registrar Movimiento de Caja</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'INCOME' | 'EXPENSE')}
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="EXPENSE">Egreso</option>
                  <option value="INCOME">Ingreso</option>
                </select>
                <select
                  value={movementMethod}
                  onChange={(e) => setMovementMethod(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="QR">QR</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Monto"
                  className="rounded-lg border px-3 py-2"
                />
                <input
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  placeholder="Descripcion"
                  className="rounded-lg border px-3 py-2"
                />
              </div>
              <button
                onClick={() => movementMutation.mutate()}
                disabled={movementMutation.isPending || !movementAmount || !movementDescription}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {movementMutation.isPending ? 'Registrando...' : 'Guardar movimiento'}
              </button>
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-bold text-slate-900">Cerrar Caja</h2>
              <p className="mb-4 text-sm text-slate-500">Cuenta el efectivo en caja e ingresa el monto final</p>
              <div className="space-y-3">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={finalCash}
                  onChange={(e) => setFinalCash(e.target.value)}
                  placeholder="Monto final"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold"
                />
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  Diferencia estimada:{' '}
                  <span
                    className={`font-bold ${
                      Number(finalCash || 0) - expectedCash >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrencyInt(Number(finalCash || 0) - expectedCash)}
                  </span>
                </div>
                <button
                  onClick={() => closeMutation.mutate({ finalCash: Number(finalCash) || 0 })}
                  disabled={closeMutation.isPending || !finalCash}
                  className="w-full rounded-xl bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Caja'}
                </button>
              </div>
            </section>
          </div>

          {currentRegister.transactions?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Movimientos del Turno Actual</h2>
              <div className="space-y-2">
                {currentRegister.transactions.slice(0, 20).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      {tx.type === 'INCOME' ? (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{tx.description || tx.type}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleString('es-CL')} · {tx.category === 'TIP' ? 'Propina' : tx.category === 'SALE' ? 'Venta' : 'Otro'}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrencyInt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {registerSummary?.salesByCashier?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Resumen de Turnos por Cajero</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3 pr-4">Cajero</th>
                  <th className="pb-3 pr-4">Turnos</th>
                  <th className="pb-3 pr-4">Ventas</th>
                  {showTips && <th className="pb-3 pr-4">Propinas</th>}
                  <th className="pb-3 pr-4">Otros ingresos</th>
                  <th className="pb-3 pr-4">Egresos</th>
                  <th className="pb-3 pr-4">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {registerSummary.salesByCashier.map((item: any) => (
                  <tr key={item.userId} className="border-b">
                    <td className="py-3 pr-4 font-medium">{item.name}</td>
                    <td className="py-3 pr-4">{item.shifts}</td>
                    <td className="py-3 pr-4">{formatCurrencyInt(item.sales)}</td>
                    {showTips && <td className="py-3 pr-4">{formatCurrencyInt(item.tips || 0)}</td>}
                    <td className="py-3 pr-4">{formatCurrencyInt(item.otherIncome || 0)}</td>
                    <td className="py-3 pr-4">{formatCurrencyInt(item.expenses)}</td>
                    <td className="py-3 pr-4">{formatCurrencyInt(item.difference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {registerHistory?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Historial de Aperturas/Cierres</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3 pr-4">Turno</th>
                  <th className="pb-3 pr-4">Cajero</th>
                  <th className="pb-3 pr-4">Apertura</th>
                  <th className="pb-3 pr-4">Cierre</th>
                  <th className="pb-3 pr-4">Ventas</th>
                  {showTips && <th className="pb-3 pr-4">Propinas</th>}
                  <th className="pb-3 pr-4">Otros ingresos</th>
                  <th className="pb-3 pr-4">Egresos</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {registerHistory.slice(0, 20).map((register: any) => (
                  <tr key={register.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{register.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4">{register.user ? `${register.user.firstName} ${register.user.lastName}` : '-'}</td>
                    <td className="py-3 pr-4">{new Date(register.openedAt).toLocaleString('es-CL')}</td>
                    <td className="py-3 pr-4">{register.closedAt ? new Date(register.closedAt).toLocaleString('es-CL') : '-'}</td>
                    <td className="py-3 pr-4">{formatCurrencyInt(register.salesIncome || 0)}</td>
                    {showTips && <td className="py-3 pr-4">{formatCurrencyInt(register.tipsIncome || 0)}</td>}
                    <td className="py-3 pr-4">{formatCurrencyInt(register.otherIncome || 0)}</td>
                    <td className="py-3 pr-4">{formatCurrencyInt(register.expenseTotal || 0)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-xs ${register.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {register.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{formatCurrencyInt(register.difference || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando estado de caja...
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>{icon}</div>
      </div>
    </article>
  );
}



