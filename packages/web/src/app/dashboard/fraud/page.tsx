'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Ban,
  Copy,
} from 'lucide-react';

const SEVERITY_MAP: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  LOW: { label: 'Baja', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Eye },
  MEDIUM: { label: 'Media', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertTriangle },
  HIGH: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertOctagon },
  CRITICAL: { label: 'Critica', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertOctagon },
};

const FRAUD_TYPE_MAP: Record<string, { label: string; icon: any }> = {
  UNUSUAL_AMOUNT: { label: 'Monto Inusual', icon: DollarSign },
  UNUSUAL_TIME: { label: 'Horario Sospechoso', icon: Clock },
  MULTIPLE_REFUNDS: { label: 'Multiples Reembolsos', icon: RefreshCw },
  EXCESSIVE_DISCOUNTS: { label: 'Descuentos Excesivos', icon: Ban },
  SUSPICIOUS_PATTERN: { label: 'Patron Sospechoso', icon: Eye },
  DUPLICATE_TRANSACTION: { label: 'Transaccion Duplicada', icon: Copy },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  REVIEWED: { label: 'Revisada', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Resuelta', color: 'bg-green-100 text-green-700' },
  FALSE_POSITIVE: { label: 'Falso Positivo', color: 'bg-slate-100 text-slate-600' },
};

export default function FraudPage() {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => api.get('/fraud-detection/alerts').then((res) => res.data).catch(() => []),
  });

  const filtered = alerts?.filter((a: any) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const countBySeverity = (sev: string) => alerts?.filter((a: any) => a.severity === sev).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deteccion de Fraudes</h1>
        <p className="mt-1 text-sm text-gray-500">Alertas y monitoreo de actividades sospechosas</p>
      </div>

      {/* Severity Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(SEVERITY_MAP).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Severidad {val.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{countBySeverity(key)}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${val.bgColor} ${val.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Severidad</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Todas</option>
            {Object.entries(SEVERITY_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Todos</option>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Alertas de Fraude</h2>
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filtered?.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((alert: any) => {
              const severity = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.LOW;
              const SevIcon = severity.icon;
              const fraudType = FRAUD_TYPE_MAP[alert.type] || { label: alert.type, icon: Eye };
              const FraudIcon = fraudType.icon;
              const status = STATUS_MAP[alert.status] || STATUS_MAP.PENDING;

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-red-200 bg-red-50'
                      : alert.severity === 'HIGH'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl p-2 ${severity.bgColor}`}>
                        <SevIcon className={`h-5 w-5 ${severity.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold text-slate-900">
                            <FraudIcon className="h-4 w-4" />
                            {fraudType.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bgColor} ${severity.color}`}>
                            {severity.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{alert.description || alert.message}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>
                            {new Date(alert.createdAt).toLocaleString('es-CL')}
                          </span>
                          {alert.amount && (
                            <span className="font-semibold">
                              Monto: ${Number(alert.amount).toLocaleString('es-CL')}
                            </span>
                          )}
                          {alert.user?.name && (
                            <span>Empleado: {alert.user.name}</span>
                          )}
                          {alert.sale?.saleNumber && (
                            <span>Venta: {alert.sale.saleNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-green-400" />
            <p className="font-semibold text-slate-700">Sin alertas de fraude</p>
            <p className="mt-1 text-sm text-slate-500">El sistema esta monitoreando automaticamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
