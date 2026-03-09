'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrencyInt } from '@/lib/number-format';

type ProductForm = {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  unit: string;
  categoryId: string;
};

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  sku: '',
  barcode: '',
  price: '',
  cost: '',
  stock: '0',
  minStock: '0',
  unit: 'UN',
  categoryId: '',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [viewProduct, setViewProduct] = useState<any | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search } }).then((res) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        categoryId: form.categoryId,
        price: Number(form.price || 0),
        cost: Number(form.cost || 0),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
        unit: form.unit.trim() || 'UN',
      };

      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, payload);
      }
      return api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
      closeForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No fue posible guardar el producto');
    },
  });

  const canSave = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.categoryId.trim().length > 0 &&
      Number(form.price || 0) >= 0 &&
      Number(form.cost || 0) >= 0
    );
  }, [form]);

  const openCreate = () => {
    if (!categories?.length) {
      toast.error('No hay categorias disponibles. Crea una categoria primero.');
      return;
    }
    setEditingProduct(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0].id,
    });
    setIsFormOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      price: String(Number(product.price || 0)),
      cost: String(Number(product.costPrice || 0)),
      stock: String(Number(product.stock || 0)),
      minStock: String(Number(product.minStock || 0)),
      unit: product.unit || 'UN',
      categoryId: product.categoryId || categories?.[0]?.id || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">Catalogo comercial del modulo activo.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Cargando productos...</p>
        ) : (
          products?.map((product: any) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{product.name}</h3>
                  <p className="text-xs text-slate-500">{product.sku || 'SKU no definido'}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {product.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <p className="text-2xl font-black text-slate-900">{formatCurrencyInt(product.price)}</p>
                <p>Stock: {Number(product.stock)} {product.unit}</p>
                <p>Minimo: {Number(product.minStock)}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(product)}
                  className="flex-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => setViewProduct(product)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              {editingProduct ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Codigo de barras"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona categoria</option>
                {(categories || []).map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Precio venta *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="Costo *"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="Stock inicial"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                placeholder="Stock minimo"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Unidad (UN, KG...)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripcion"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!canSave || saveMutation.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewProduct && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewProduct.name}</h3>
                <p className="text-sm text-slate-500">{viewProduct.sku || 'SKU no definido'}</p>
              </div>
              <Package className="h-5 w-5 text-slate-500" />
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Precio:</strong> {formatCurrencyInt(viewProduct.price)}</p>
              <p><strong>Costo:</strong> {formatCurrencyInt(viewProduct.costPrice)}</p>
              <p><strong>Stock:</strong> {Number(viewProduct.stock)} {viewProduct.unit}</p>
              <p><strong>Minimo:</strong> {Number(viewProduct.minStock)}</p>
              <p><strong>Categoria:</strong> {viewProduct.category?.name || '-'}</p>
              <p><strong>Estado:</strong> {viewProduct.status}</p>
              <p><strong>Descripcion:</strong> {viewProduct.description || '-'}</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewProduct(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
