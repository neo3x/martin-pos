'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search } }).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <p>Cargando productos...</p>
        ) : (
          products?.map((product: any) => (
            <div key={product.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.sku}</p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    product.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.status}
                </span>
              </div>

              <div className="mb-3 space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  ${Number(product.price).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Stock: {Number(product.stock)} {product.unit}
                </p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200">
                  Editar
                </button>
                <button className="flex-1 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
