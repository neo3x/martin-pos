'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Star, Gift, Search, TrendingUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoyaltyPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [awardPoints, setAwardPoints] = useState('');
  const [awardReason, setAwardReason] = useState('PURCHASE');
  const [redeemPoints, setRedeemPoints] = useState('');

  const { data: program } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: () => api.get('/loyalty/program').then((res) => res.data),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((res) => res.data),
  });

  const { data: customerPoints } = useQuery({
    queryKey: ['loyalty-points', selectedCustomer?.id],
    queryFn: () =>
      api.get(`/loyalty/customer/${selectedCustomer.id}/points`).then((res) => res.data),
    enabled: !!selectedCustomer,
  });

  const { data: transactions } = useQuery({
    queryKey: ['loyalty-transactions', selectedCustomer?.id],
    queryFn: () =>
      api.get(`/loyalty/customer/${selectedCustomer.id}/transactions`).then((res) => res.data),
    enabled: !!selectedCustomer,
  });

  const { data: discounts } = useQuery({
    queryKey: ['loyalty-discounts', selectedCustomer?.id],
    queryFn: () =>
      api.get(`/loyalty/customer/${selectedCustomer.id}/personalized-discounts`).then((res) => res.data),
    enabled: !!selectedCustomer,
  });

  const awardMutation = useMutation({
    mutationFn: (data: any) => api.post('/loyalty/award', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      setAwardPoints('');
      toast.success('Puntos otorgados exitosamente');
    },
    onError: () => toast.error('Error al otorgar puntos'),
  });

  const redeemMutation = useMutation({
    mutationFn: (data: any) => api.post('/loyalty/redeem', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      setRedeemPoints('');
      toast.success('Puntos canjeados exitosamente');
    },
    onError: () => toast.error('Error al canjear puntos'),
  });

  const filteredCustomers = customers?.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Programa de Fidelizacion</h1>
        <p className="mt-1 text-sm text-gray-500">Gestiona puntos de lealtad y descuentos personalizados</p>
      </div>

      {/* Program Info */}
      {program && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600">
              <Star className="h-5 w-5" />
              <p className="text-sm font-semibold">Programa Activo</p>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{program.name || 'Programa de Lealtad'}</p>
            <p className="mt-1 text-sm text-slate-600">
              {program.pointsPerDollar || 1} punto(s) por cada $1
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Valor del Punto</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              ${Number(program.pointValue || 0.01).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Minimo para Canje</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {program.minimumPoints || 100} pts
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Seleccionar Cliente</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredCustomers?.map((customer: any) => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-left text-sm transition ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.email || customer.phone || '-'}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                  {customer.loyaltyPoints || 0} pts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6 lg:col-span-2">
          {selectedCustomer ? (
            <>
              {/* Points Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Puntos Disponibles</p>
                  <p className="mt-2 text-3xl font-black text-indigo-600">
                    {customerPoints?.points || selectedCustomer.loyaltyPoints || 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Equivale a ${((customerPoints?.points || 0) * (program?.pointValue || 0.01)).toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Total Historico</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {customerPoints?.totalEarned || 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">puntos ganados en total</p>
                </div>
              </div>

              {/* Award & Redeem */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                    <Award className="h-5 w-5 text-emerald-600" />
                    Otorgar Puntos
                  </h3>
                  <input
                    type="number"
                    min="1"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(e.target.value)}
                    placeholder="Cantidad de puntos"
                    className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <select
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="PURCHASE">Por compra</option>
                    <option value="BONUS">Bonificacion</option>
                    <option value="REFERRAL">Referido</option>
                    <option value="BIRTHDAY">Cumpleanos</option>
                  </select>
                  <button
                    onClick={() =>
                      awardMutation.mutate({
                        customerId: selectedCustomer.id,
                        points: Number(awardPoints),
                        reason: awardReason,
                      })
                    }
                    disabled={!awardPoints || awardMutation.isPending}
                    className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Otorgar
                  </button>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                    <Gift className="h-5 w-5 text-indigo-600" />
                    Canjear Puntos
                  </h3>
                  <input
                    type="number"
                    min="1"
                    max={customerPoints?.points || 0}
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    placeholder="Puntos a canjear"
                    className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <p className="mb-3 text-xs text-slate-500">
                    Descuento: ${((Number(redeemPoints) || 0) * (program?.pointValue || 0.01)).toLocaleString('es-CL')}
                  </p>
                  <button
                    onClick={() =>
                      redeemMutation.mutate({
                        customerId: selectedCustomer.id,
                        points: Number(redeemPoints),
                      })
                    }
                    disabled={
                      !redeemPoints ||
                      Number(redeemPoints) > (customerPoints?.points || 0) ||
                      redeemMutation.isPending
                    }
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Canjear
                  </button>
                </div>
              </div>

              {/* Personalized Discounts */}
              {discounts?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Descuentos Personalizados (IA)
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {discounts.map((d: any, i: number) => (
                      <div key={i} className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                        <p className="font-semibold text-purple-800">{d.product || d.category}</p>
                        <p className="mt-1 text-2xl font-black text-purple-600">{d.discount}% OFF</p>
                        <p className="mt-1 text-xs text-slate-600">{d.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Historial de Puntos</h3>
                {transactions?.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {tx.type === 'EARN' ? 'Puntos ganados' : 'Puntos canjeados'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(tx.createdAt).toLocaleString('es-CL')}
                            {tx.reason && ` - ${tx.reason}`}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${
                            tx.type === 'EARN' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'EARN' ? '+' : '-'}{tx.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500">Sin transacciones</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <Star className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500">Selecciona un cliente para ver sus puntos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
