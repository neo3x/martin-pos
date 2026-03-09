'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Gift, Tag, Percent, ShoppingBag, Calendar, Clock } from 'lucide-react';

const PROMO_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  DISCOUNT: { label: 'Descuento', color: 'bg-green-100 text-green-700', icon: Percent },
  COMBO: { label: 'Combo', color: 'bg-blue-100 text-blue-700', icon: ShoppingBag },
  BUY_X_GET_Y: { label: 'Lleva X Paga Y', color: 'bg-purple-100 text-purple-700', icon: Gift },
  SEASONAL: { label: 'Estacional', color: 'bg-orange-100 text-orange-700', icon: Calendar },
  CLEARANCE: { label: 'Liquidacion', color: 'bg-red-100 text-red-700', icon: Tag },
};

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions-active'],
    queryFn: () => api.get('/promotions/active').then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promociones y Combos</h1>
        <p className="mt-1 text-sm text-gray-500">Promociones activas y ofertas especiales</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Promociones Activas</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{promotions?.length || 0}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-2.5 text-green-700">
              <Gift className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Descuentos</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {promotions?.filter((p: any) => p.type === 'DISCOUNT').length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <Percent className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Combos</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {promotions?.filter((p: any) => p.type === 'COMBO').length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Estacionales</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {promotions?.filter((p: any) => p.type === 'SEASONAL' || p.type === 'CLEARANCE').length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Cargando promociones...
        </div>
      ) : promotions?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promo: any) => {
            const meta = PROMO_TYPE_LABELS[promo.type] || PROMO_TYPE_LABELS.DISCOUNT;
            const IconComponent = meta.icon;
            return (
              <div key={promo.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                    <IconComponent className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <Clock className="h-3 w-3" />
                    Activa
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{promo.name}</h3>
                {promo.description && (
                  <p className="mt-1 text-sm text-slate-600">{promo.description}</p>
                )}

                {/* Discount Value */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  {promo.discountType === 'PERCENTAGE' ? (
                    <p className="text-2xl font-black text-indigo-600">{promo.discountValue}% OFF</p>
                  ) : promo.discountType === 'FIXED_AMOUNT' ? (
                    <p className="text-2xl font-black text-indigo-600">
                      -${Number(promo.discountValue || 0).toLocaleString('es-CL')}
                    </p>
                  ) : promo.comboPrice ? (
                    <p className="text-2xl font-black text-indigo-600">
                      Combo ${Number(promo.comboPrice).toLocaleString('es-CL')}
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-indigo-600">Promocion Especial</p>
                  )}
                </div>

                {/* Combo Products */}
                {promo.comboProducts?.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Productos del combo:</p>
                    <div className="space-y-1">
                      {promo.comboProducts.map((cp: any, i: number) => (
                        <p key={i} className="text-sm text-slate-700">
                          {cp.quantity}x {cp.product?.name || 'Producto'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="mt-4 flex justify-between text-xs text-slate-400">
                  <span>
                    Desde: {promo.startDate ? new Date(promo.startDate).toLocaleDateString('es-CL') : '-'}
                  </span>
                  <span>
                    Hasta: {promo.endDate ? new Date(promo.endDate).toLocaleDateString('es-CL') : 'Sin limite'}
                  </span>
                </div>

                {/* Conditions */}
                {promo.conditions && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-2">
                    <p className="text-xs text-amber-700">Condiciones: {JSON.stringify(promo.conditions)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Gift className="mx-auto mb-3 h-12 w-12 text-slate-400" />
          <p className="text-slate-500">No hay promociones activas</p>
          <p className="mt-1 text-sm text-slate-400">Las promociones se gestionan desde el backend</p>
        </div>
      )}
    </div>
  );
}
