'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingCart, Plus, X, Search, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [showNewSale, setShowNewSale] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [ageVerified, setAgeVerified] = useState(false);
  const moduleType = useAuthStore((state) => state.activeModule || state.user?.moduleType || 'ALL');

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: () => api.get(`/products?search=${searchTerm}`).then((res) => res.data),
    enabled: searchTerm.length > 1,
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setCart([]);
      setShowNewSale(false);
      setAgeVerified(false);
      toast.success('Venta registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la venta'),
  });

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        categoryName: product.category?.name,
        quantity: 1,
        unitPrice: Number(product.price),
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartUnits = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
  const hasAlcoholItems = cart.some((item) => ['Vinos', 'Cervezas', 'Destilados'].includes(item.categoryName));
  const bookstoreAutoDiscount = moduleType === 'BOOKSTORE' && cartUnits >= 5 ? Math.round(cartTotal * 0.05) : 0;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (moduleType === 'BOTILLERIA' && hasAlcoholItems && !ageVerified) {
      toast.error('Debes validar mayoría de edad para vender alcohol');
      return;
    }

    createSaleMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      paymentMethod,
      ageVerified: moduleType === 'BOTILLERIA' ? ageVerified : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <button
          onClick={() => setShowNewSale(!showNewSale)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {showNewSale && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Search */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Buscar Producto</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-4"
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {products?.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                  </div>
                  <p className="font-semibold">${Number(product.price).toLocaleString('es-CL')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Carrito</h2>
            {moduleType === 'MINIMARKET' && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                Flujo minimarket: venta rápida de alta rotación.
              </div>
            )}
            {moduleType === 'BOTILLERIA' && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Flujo botillería: ventas con control de mayoría de edad para productos alcohólicos.
              </div>
            )}
            {moduleType === 'BOOKSTORE' && (
              <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
                Flujo librería: descuento automático del 5% por 5+ unidades en la venta.
              </div>
            )}
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
                            const qty = parseInt(e.target.value) || 1;
                            setCart(cart.map((c) =>
                              c.productId === item.productId ? { ...c, quantity: qty } : c
                            ));
                          }}
                          className="w-16 rounded border px-2 py-1 text-center"
                        />
                        <span className="text-sm text-gray-500">
                          x ${item.unitPrice.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        ${(item.unitPrice * item.quantity).toLocaleString('es-CL')}
                      </span>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="mb-3 flex items-center justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span>${cartTotal.toLocaleString('es-CL')}</span>
                  </div>
                  {moduleType === 'BOOKSTORE' && bookstoreAutoDiscount > 0 && (
                    <p className="mb-2 text-sm font-semibold text-indigo-700">
                      Descuento librería estimado: -${bookstoreAutoDiscount.toLocaleString('es-CL')}
                    </p>
                  )}
                  {moduleType === 'BOTILLERIA' && hasAlcoholItems && (
                    <label className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <input
                        type="checkbox"
                        checked={ageVerified}
                        onChange={(e) => setAgeVerified(e.target.checked)}
                      />
                      Mayoría de edad verificada
                    </label>
                  )}
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Método de Pago</label>
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
                  </div>
                  <button
                    onClick={handleCompleteSale}
                    disabled={createSaleMutation.isPending}
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

      {/* Sales History */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Historial de Ventas</h2>
        {isLoading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">N° Venta</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Método</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sales?.slice(0, 20).map((sale: any) => (
                  <tr key={sale.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{sale.saleNumber}</td>
                    <td className="py-3 pr-4 text-sm">
                      {new Date(sale.createdAt).toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      ${Number(sale.total).toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        sale.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : sale.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sale.status === 'COMPLETED' ? 'Completada' : sale.status === 'CANCELLED' ? 'Cancelada' : sale.status}
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
