'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
};

const EMPTY_FORM: CustomerForm = {
  name: '',
  email: '',
  phone: '',
  taxId: '',
  address: '',
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [formData, setFormData] = useState<CustomerForm>(EMPTY_FORM);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        taxId: formData.taxId.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      if (editingCustomer) {
        return api.put(`/customers/${editingCustomer.id}`, payload);
      }
      return api.post('/customers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      setEditingCustomer(null);
      setFormData(EMPTY_FORM);
      toast.success(editingCustomer ? 'Cliente actualizado' : 'Cliente creado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No fue posible guardar el cliente');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (customerId: string) => api.delete(`/customers/${customerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente eliminado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No fue posible eliminar el cliente');
    },
  });

  const filtered = useMemo(() => {
    const source = customers || [];
    const term = searchTerm.toLowerCase();
    return source.filter((c: any) =>
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(searchTerm) ||
      c.taxId?.toLowerCase().includes(term),
    );
  }, [customers, searchTerm]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      taxId: customer.taxId || '',
      address: customer.address || '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nuevo Cliente
        </button>
      </div>

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
                  <th className="pb-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer: any) => (
                  <tr key={customer.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{customer.name}</td>
                    <td className="py-3 pr-4 text-sm">{customer.email || '-'}</td>
                    <td className="py-3 pr-4 text-sm">{customer.phone || '-'}</td>
                    <td className="py-3 pr-4 text-sm">{customer.taxId || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                        {customer.loyaltyPoints || 0}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      ${Number(customer.totalPurchases || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(customer)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => removeMutation.mutate(customer.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
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

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingCustomer ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
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
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
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
                onClick={() => saveMutation.mutate()}
                disabled={!formData.name || saveMutation.isPending}
                className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-6 py-2 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
