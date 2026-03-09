'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, Send, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  ISSUED: { label: 'Emitida', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Pagada', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Anulada', color: 'bg-red-100 text-red-700' },
};

const TYPE_MAP: Record<string, string> = {
  INVOICE: 'Factura',
  CREDIT_NOTE: 'Nota Credito',
  DEBIT_NOTE: 'Nota Debito',
  RECEIPT: 'Boleta',
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saleId, setSaleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then((res) => res.data),
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((res) => res.data).catch(() => []),
  });

  const createFromSaleMutation = useMutation({
    mutationFn: (data: { saleId: string }) => api.post('/invoices/from-sale', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreateForm(false);
      setSaleId('');
      toast.success('Factura generada exitosamente');
    },
    onError: () => toast.error('Error al generar factura'),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => api.put(`/invoices/${id}/issue`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura emitida exitosamente');
    },
    onError: () => toast.error('Error al emitir factura'),
  });

  const filteredInvoices = invoices?.filter(
    (inv: any) =>
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturacion</h1>
          <p className="mt-1 text-sm text-gray-500">Facturas, boletas y notas de credito/debito</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4" />
          Generar Factura
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Facturas"
          value={`${invoices?.length || 0}`}
          icon={<FileText className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Emitidas"
          value={`${invoices?.filter((i: any) => i.status === 'ISSUED').length || 0}`}
          icon={<Send className="h-5 w-5" />}
          tone="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          title="Pagadas"
          value={`${invoices?.filter((i: any) => i.status === 'PAID').length || 0}`}
          icon={<CheckCircle className="h-5 w-5" />}
          tone="bg-green-50 text-green-700"
        />
        <StatCard
          title="Borradores"
          value={`${invoices?.filter((i: any) => i.status === 'DRAFT').length || 0}`}
          icon={<Clock className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Create from Sale */}
      {showCreateForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Generar Factura desde Venta</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Seleccionar Venta</label>
            <select
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar venta...</option>
              {sales
                ?.filter((s: any) => s.status === 'COMPLETED')
                .map((sale: any) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.saleNumber} - ${Number(sale.total).toLocaleString('es-CL')} -{' '}
                    {new Date(sale.createdAt).toLocaleDateString('es-CL')}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => createFromSaleMutation.mutate({ saleId })}
              disabled={!saleId || createFromSaleMutation.isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createFromSaleMutation.isPending ? 'Generando...' : 'Generar Factura'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-slate-300 px-6 py-2 text-sm hover:bg-slate-50"
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
          placeholder="Buscar facturas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Listado de Documentos</h2>
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filteredInvoices?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3 pr-4">N° Documento</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv: any) => {
                  const status = STATUS_MAP[inv.status] || STATUS_MAP.DRAFT;
                  return (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{inv.invoiceNumber || '-'}</td>
                      <td className="py-3 pr-4 text-sm">{TYPE_MAP[inv.type] || inv.type}</td>
                      <td className="py-3 pr-4 text-sm">{inv.customer?.name || '-'}</td>
                      <td className="py-3 pr-4 font-semibold">
                        ${Number(inv.total || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        {new Date(inv.createdAt).toLocaleDateString('es-CL')}
                      </td>
                      <td className="py-3 pr-4">
                        {inv.status === 'DRAFT' && (
                          <button
                            onClick={() => issueMutation.mutate(inv.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Emitir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            No hay documentos registrados
          </div>
        )}
      </div>
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
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>{icon}</div>
      </div>
    </article>
  );
}
