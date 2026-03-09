'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingCart, Plus, X, Search, ScanLine, User2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const SELLER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SELLER', 'WAITER'];

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { user, activeModule } = useAuthStore();
  const moduleType = activeModule || user?.moduleType || 'ALL';
  const canSell = SELLER_ROLES.includes(user?.role || 'VIEWER');

  const [showNewSale, setShowNewSale] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState('CARD');
  const [cashPaymentAmount, setCashPaymentAmount] = useState('0');
  const [ageVerified, setAgeVerified] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [quickEntryUsed, setQuickEntryUsed] = useState(false);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: () => api.get(`/products?search=${searchTerm}`).then((res) => res.data),
    enabled: searchTerm.length > 1,
  });

  const { data: currentRegister } = useQuery({
    queryKey: ['cash-register-current'],
    queryFn: () => api.get('/cash-register/current').then((res) => res.data).catch(() => null),
  });

  const { data: minimarketContext } = useQuery({
    queryKey: ['minimarket-quick-context'],
    queryFn: () => api.get('/minimarket/quick-sale-context').then((res) => res.data),
    enabled: moduleType === 'MINIMARKET',
  });

  const { data: botSaleHours } = useQuery({
    queryKey: ['botilleria-sale-hours-current'],
    queryFn: () => api.get('/botilleria/sale-hours/current').then((res) => res.data),
    enabled: moduleType === 'BOTILLERIA',
  });

  const { data: botPackPromotions } = useQuery({
    queryKey: ['botilleria-pack-promotions'],
    queryFn: () => api.get('/botilleria/promotions/packs').then((res) => res.data),
    enabled: moduleType === 'BOTILLERIA',
  });

  const { data: bookstoreCampaigns } = useQuery({
    queryKey: ['bookstore-campaigns'],
    queryFn: () => api.get('/bookstore/campaigns').then((res) => res.data),
    enabled: moduleType === 'BOOKSTORE',
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      queryClient.invalidateQueries({ queryKey: ['minimarket-quick-context'] });
      setCart([]);
      setShowNewSale(false);
      setAgeVerified(false);
      setSelectedPromotionId('');
      setSelectedCampaign('');
      setQuickEntryUsed(false);
      toast.success('Venta registrada exitosamente');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar la venta'),
  });

  const addToCart = (product: any) => {
    setQuickEntryUsed((prev) => prev || !!quickCode.trim());
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    setCart([
      ...cart,
      {
        productId: product.id,
        name: product.name,
        categoryName: product.category?.name,
        quantity: 1,
        unitPrice: Number(product.price),
        sku: product.sku,
        barcode: product.barcode,
      },
    ]);
  };

  const addProductByCode = async () => {
    const code = quickCode.trim();
    if (!code) return;

    try {
      const byBarcode = await api.get(`/products/barcode/${code}`);
      addToCart(byBarcode.data);
      setQuickCode('');
      setQuickEntryUsed(true);
      return;
    } catch {
      // fallback sku
    }

    try {
      const bySku = await api.get(`/products/sku/${code}`);
      addToCart(bySku.data);
      setQuickCode('');
      setQuickEntryUsed(true);
    } catch {
      toast.error('No se encontro producto para ese codigo');
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartUnits = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
  const hasAlcoholItems = cart.some((item) => ['Vinos', 'Cervezas', 'Destilados'].includes(item.categoryName));
  const bookstoreAutoDiscount = moduleType === 'BOOKSTORE' && cartUnits >= 5 ? Math.round(cartSubtotal * 0.05) : 0;

  const selectedPromotion = useMemo(
    () => (botPackPromotions || []).find((promo: any) => promo.id === selectedPromotionId),
    [botPackPromotions, selectedPromotionId]
  );

  const estimatedPromotionDiscount = useMemo(() => {
    if (!selectedPromotion) return 0;
    if (selectedPromotion.discountType === 'PERCENTAGE') {
      return Math.round((cartSubtotal * Number(selectedPromotion.discountValue || 0)) / 100);
    }
    return Number(selectedPromotion.discountValue || 0);
  }, [selectedPromotion, cartSubtotal]);

  const estimatedDiscount = bookstoreAutoDiscount + estimatedPromotionDiscount;
  const estimatedTotal = Math.max(0, cartSubtotal - estimatedDiscount);

  const splitPaymentPayload = useMemo(() => {
    if (!useSplitPayment) return null;

    const cashAmount = Number(cashPaymentAmount || 0);
    const roundedTotal = Math.round(estimatedTotal);
    const roundedCash = Math.round(cashAmount);
    const remaining = roundedTotal - roundedCash;

    if (roundedCash <= 0 || remaining <= 0) {
      return null;
    }

    return {
      paymentMethod: 'MIXED',
      payments: [
        { paymentMethod: 'CASH', amount: roundedCash },
        { paymentMethod: secondaryPaymentMethod, amount: remaining },
      ],
    };
  }, [useSplitPayment, cashPaymentAmount, estimatedTotal, secondaryPaymentMethod]);

  const handleCompleteSale = () => {
    if (!canSell) {
      toast.error('Tu perfil no tiene permisos para registrar ventas');
      return;
    }

    if (!currentRegister) {
      toast.error('Debes abrir caja antes de cobrar');
      return;
    }

    if (cart.length === 0) return;

    if (moduleType === 'BOTILLERIA') {
      if (botSaleHours?.isAllowed === false) {
        toast.error(botSaleHours?.message || 'Venta fuera de horario permitido para alcohol');
        return;
      }

      if (hasAlcoholItems && !ageVerified) {
        toast.error('Debes validar mayoria de edad para vender alcohol');
        return;
      }
    }

    if (useSplitPayment && !splitPaymentPayload) {
      toast.error('Configura correctamente el pago mixto');
      return;
    }

    createSaleMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      paymentMethod: splitPaymentPayload ? splitPaymentPayload.paymentMethod : paymentMethod,
      payments: splitPaymentPayload?.payments,
      ageVerified: moduleType === 'BOTILLERIA' ? ageVerified : undefined,
      promotionId: selectedPromotionId || undefined,
      campaignTag: selectedCampaign || undefined,
      packName: selectedPromotion?.name || undefined,
      inputMethod: quickEntryUsed ? 'BARCODE' : 'MANUAL',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-slate-500">Operacion {moduleType} con trazabilidad por cajero/empleado</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <User2 className="h-4 w-4" />
          Cajero activo: {user?.firstName || 'Usuario'} ({user?.role || 'N/A'})
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Estado caja"
          value={currentRegister ? 'Caja abierta' : 'Caja cerrada'}
          description={currentRegister ? `Turno ${currentRegister.id?.slice(0, 8)}` : 'Debes abrir caja para cobrar'}
          tone={currentRegister ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
        />
        <InfoCard
          label="Modulo"
          value={moduleType}
          description={
            moduleType === 'MINIMARKET'
              ? 'Flujo de caja rapida y alta rotacion'
              : moduleType === 'BOTILLERIA'
                ? 'Flujo con validaciones etarias y promociones de pack'
                : moduleType === 'BOOKSTORE'
                  ? 'Flujo con campanas escolares y descuentos por volumen'
                  : 'Flujo general'
          }
          tone="bg-indigo-50 text-indigo-700"
        />
        <InfoCard
          label="Permiso de venta"
          value={canSell ? 'Habilitado' : 'Solo lectura'}
          description={canSell ? 'Puedes registrar ventas' : 'Tu perfil no puede cobrar'}
          tone={canSell ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowNewSale(!showNewSale)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>

        {moduleType === 'BOTILLERIA' && botSaleHours && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              botSaleHours.isAllowed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {botSaleHours.message}
          </div>
        )}
      </div>

      {showNewSale && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Buscar Producto</h2>

            {moduleType === 'MINIMARKET' && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="mb-2 text-xs font-semibold text-emerald-800">Caja rapida minimarket (SKU / codigo de barras)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addProductByCode();
                      }
                    }}
                    placeholder="Escanear o digitar codigo"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addProductByCode}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <ScanLine className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o codigo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-4"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {(products || []).map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      SKU: {product.sku || '-'} {product.barcode ? `| Cod: ${product.barcode}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                  </div>
                  <p className="font-semibold">${Number(product.price).toLocaleString('es-CL')}</p>
                </button>
              ))}
            </div>

            {moduleType === 'MINIMARKET' && minimarketContext?.fastMovingProducts?.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">Productos de alta rotacion</p>
                <div className="flex flex-wrap gap-2">
                  {minimarketContext.fastMovingProducts.slice(0, 6).map((product: any) => (
                    <button
                      key={product.productId}
                      onClick={() => addToCart({
                        id: product.productId,
                        name: product.name,
                        sku: product.sku,
                        barcode: product.barcode,
                        price: product.price,
                        stock: product.stock,
                        category: { name: 'Alta rotacion' },
                      })}
                      className="rounded-lg border bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Carrito</h2>

            {cart.length === 0 ? (
              <p className="text-center text-gray-500">Agrega productos al carrito</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10) || 1;
                            setCart(
                              cart.map((current) =>
                                current.productId === item.productId ? { ...current, quantity: qty } : current
                              )
                            );
                          }}
                          className="w-16 rounded border px-2 py-1 text-center"
                        />
                        <span className="text-sm text-gray-500">x ${item.unitPrice.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">${(item.unitPrice * item.quantity).toLocaleString('es-CL')}</span>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toLocaleString('es-CL')}</span>
                  </div>
                  {!!estimatedDiscount && (
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-indigo-700">
                      <span>Descuentos estimados</span>
                      <span>- ${estimatedDiscount.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  <div className="mb-3 flex items-center justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${estimatedTotal.toLocaleString('es-CL')}</span>
                  </div>

                  {moduleType === 'BOTILLERIA' && hasAlcoholItems && (
                    <label className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <input type="checkbox" checked={ageVerified} onChange={(e) => setAgeVerified(e.target.checked)} />
                      Mayoria de edad verificada
                    </label>
                  )}

                  {moduleType === 'BOTILLERIA' && (
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium">Pack / promocion</label>
                      <select
                        value={selectedPromotionId}
                        onChange={(e) => setSelectedPromotionId(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="">Sin promocion</option>
                        {(botPackPromotions || []).map((promo: any) => (
                          <option key={promo.id} value={promo.id}>
                            {promo.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {moduleType === 'BOOKSTORE' && (
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium">Campana activa</label>
                      <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="">Sin campana</option>
                        {(bookstoreCampaigns?.activeCampaigns || []).map((campaign: any) => (
                          <option key={campaign.id} value={campaign.name}>
                            {campaign.name}
                          </option>
                        ))}
                        {(bookstoreCampaigns?.suggestedCampaigns || []).map((suggestion: string) => (
                          <option key={suggestion} value={suggestion}>
                            {suggestion}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3 space-y-2 rounded-lg border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={useSplitPayment}
                        onChange={(e) => setUseSplitPayment(e.target.checked)}
                      />
                      Pago mixto
                    </label>

                    {!useSplitPayment ? (
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="QR">QR</option>
                      </select>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-3">
                        <input
                          type="number"
                          min="1"
                          value={cashPaymentAmount}
                          onChange={(e) => setCashPaymentAmount(e.target.value)}
                          className="rounded-lg border px-3 py-2"
                          placeholder="Monto efectivo"
                        />
                        <select
                          value={secondaryPaymentMethod}
                          onChange={(e) => setSecondaryPaymentMethod(e.target.value)}
                          className="rounded-lg border px-3 py-2"
                        >
                          <option value="CARD">Tarjeta</option>
                          <option value="TRANSFER">Transferencia</option>
                          <option value="QR">QR</option>
                        </select>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                          Restante: ${Math.max(0, Math.round(estimatedTotal) - Math.round(Number(cashPaymentAmount || 0))).toLocaleString('es-CL')}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCompleteSale}
                    disabled={createSaleMutation.isPending || !canSell || !currentRegister}
                    className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {createSaleMutation.isPending ? 'Procesando...' : 'Completar Venta'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {moduleType === 'MINIMARKET' && minimarketContext?.criticalStock?.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Stock critico para reposicion inmediata
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {minimarketContext.criticalStock.slice(0, 6).map((product: any) => (
              <div key={product.id} className="rounded border border-amber-100 bg-white px-3 py-2 text-sm">
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-600">Stock: {product.stock} / Min: {product.minStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Historial de Ventas</h2>
        {isLoading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">N Venta</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Vendedor/Cajero</th>
                  <th className="pb-3 pr-4">Metodo</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(sales || []).slice(0, 25).map((sale: any) => (
                  <tr key={sale.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{sale.saleNumber}</td>
                    <td className="py-3 pr-4 text-sm">{new Date(sale.createdAt).toLocaleString('es-CL')}</td>
                    <td className="py-3 pr-4 text-sm">
                      {sale.user?.firstName ? `${sale.user.firstName} ${sale.user.lastName}` : '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{sale.paymentMethod}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">${Number(sale.total).toLocaleString('es-CL')}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          sale.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : sale.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-lg font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}


