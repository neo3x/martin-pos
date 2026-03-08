'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', rut: '', address: '',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', rut: '', address: '' });
      toast.success('Cliente creado exitosamente');
    },
    onError: () => toast.error('Error al crear cliente'),
  });

  const filtered = customers?.filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Nuevo Cliente</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Nombre *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-lg border px-4 py-2"
            />
            <input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-lg border px-4 py-2"
            />
            <input
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-lg border px-4 py-2"
            />
            <input
              placeholder="RUT"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              className="rounded-lg border px-4 py-2"
            />
            <input
              placeholder="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="col-span-2 rounded-lg border px-4 py-2"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
              className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-6 py-2 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border py-2 pl-10 pr-4"
        />
      </div>

      {/* Customer List */}
      <div className="rounded-lg bg-white p-6 shadow">
        {isLoading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : filtered?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 pr-4">Nombre</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Teléfono</th>
                  <th className="pb-3 pr-4">RUT</th>
                  <th className="pb-3 pr-4">Puntos</th>
                  <th className="pb-3 pr-4">Total Compras</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer: any) => (
                  <tr key={customer.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{customer.name}</td>
                    <td className="py-3 pr-4 text-sm">{customer.email || '-'}</td>
                    <td className="py-3 pr-4 text-sm">{customer.phone || '-'}</td>
                    <td className="py-3 pr-4 text-sm">{customer.rut || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                        {customer.loyaltyPoints || 0}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      ${Number(customer.totalPurchases || 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-gray-500">
            <Users className="mb-3 h-12 w-12" />
            <p>No hay clientes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
