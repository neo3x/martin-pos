'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Banknote, DollarSign, Lock, Unlock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashRegisterPage() {
  const queryClient = useQueryClient();
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');

  const { data: currentRegister, isLoading } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: () => api.get('/cash-register/current').then((res) => res.data),
  });

  const openMutation = useMutation({
    mutationFn: (data: { initialCash: number }) => api.post('/cash-register/open', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      setInitialCash('');
      toast.success('Caja abierta exitosamente');
    },
    onError: () => toast.error('Error al abrir caja'),
  });

  const closeMutation = useMutation({
    mutationFn: (data: { finalCash: number }) =>
      api.put(`/cash-register/${currentRegister?.id}/close`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      setFinalCash('');
      toast.success('Caja cerrada exitosamente');
    },
    onError: () => toast.error('Error al cerrar caja'),
  });

  const isOpen = currentRegister && !currentRegister.closedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja Registradora</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona la apertura y cierre de caja</p>
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

      {/* Open / Close Cash Register */}
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
          {/* Current Session Stats */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Monto Inicial"
              value={`$${Number(currentRegister.initialCash || 0).toLocaleString('es-CL')}`}
              icon={<ArrowDownCircle className="h-5 w-5" />}
              tone="bg-blue-50 text-blue-700"
            />
            <StatCard
              title="Ventas en Efectivo"
              value={`$${Number(currentRegister.cashSales || 0).toLocaleString('es-CL')}`}
              icon={<ArrowUpCircle className="h-5 w-5" />}
              tone="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              title="Total Transacciones"
              value={`${currentRegister.transactionCount || 0}`}
              icon={<Banknote className="h-5 w-5" />}
              tone="bg-purple-50 text-purple-700"
            />
            <StatCard
              title="Efectivo Esperado"
              value={`$${Number(
                (Number(currentRegister.initialCash) || 0) +
                  (Number(currentRegister.incomeTotal) || 0) -
                  (Number(currentRegister.expenseTotal) || 0)
              ).toLocaleString('es-CL')}`}
              icon={<DollarSign className="h-5 w-5" />}
              tone="bg-amber-50 text-amber-700"
            />
          </div>

          {/* Transaction List */}
          {currentRegister.transactions?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Movimientos de Caja</h2>
              <div className="space-y-2">
                {currentRegister.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {tx.type === 'INCOME' ? (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{tx.description || tx.type}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Register */}
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Cerrar Caja</h2>
            <p className="mb-4 text-sm text-slate-500">Cuenta el efectivo en caja e ingresa el monto final</p>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Monto Final ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={finalCash}
                  onChange={(e) => setFinalCash(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
              <button
                onClick={() => closeMutation.mutate({ finalCash: Number(finalCash) || 0 })}
                disabled={closeMutation.isPending || !finalCash}
                className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
            {finalCash && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Diferencia:{' '}
                  <span
                    className={`font-bold ${
                      Number(finalCash) -
                        ((Number(currentRegister.initialCash) || 0) +
                          (Number(currentRegister.incomeTotal) || 0) -
                          (Number(currentRegister.expenseTotal) || 0)) >=
                      0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    $
                    {(
                      Number(finalCash) -
                      ((Number(currentRegister.initialCash) || 0) +
                        (Number(currentRegister.incomeTotal) || 0) -
                        (Number(currentRegister.expenseTotal) || 0))
                    ).toLocaleString('es-CL')}
                  </span>
                </p>
              </div>
            )}
          </div>
        </>
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
  icon: React.ReactNode;
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
