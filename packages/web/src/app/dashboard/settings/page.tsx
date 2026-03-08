'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Database, Printer, Settings, Shield, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { MODULE_NAME_MAP } from '@/lib/modules';
import { useAuthStore } from '@/store/auth';

type ConfigState = {
  businessName: string;
  currency: string;
  timezone: string;
  taxRate: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  printerType: string;
  printerTarget: string;
  printerWidth: string;
};

const STORAGE_KEY = 'martinpos.local.settings';

const DEFAULT_CONFIG: ConfigState = {
  businessName: 'Martin POS',
  currency: 'CLP',
  timezone: 'America/Santiago',
  taxRate: '19',
  branchName: 'Sucursal principal',
  branchAddress: '',
  branchPhone: '',
  printerType: 'usb',
  printerTarget: '/dev/usb/lp0',
  printerWidth: '48',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const moduleType = useAuthStore((state) => state.activeModule || state.user?.moduleType || 'ALL');
  const moduleLabel = useMemo(() => MODULE_NAME_MAP[moduleType] || moduleType, [moduleType]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ConfigState;
      setConfig({ ...DEFAULT_CONFIG, ...parsed });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveLocalConfig = (message: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast.success(message);
  };

  const bootstrapMutation = useMutation({
    mutationFn: () => api.post('/auth/bootstrap-data').then((res) => res.data),
    onSuccess: () => toast.success('Datos base cargados para tu sucursal'),
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No fue posible cargar datos base'),
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branch', label: 'Sucursal', icon: Store },
    { id: 'printer', label: 'Impresion', icon: Printer },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'system', label: 'Sistema', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Configuracion</h1>
        <p className="mt-1 text-sm text-slate-600">Ajustes operativos y utilidades de la plataforma.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Parametros generales</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={config.businessName}
                  onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                  placeholder="Nombre del negocio"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="CLP">CLP - Peso chileno</option>
                  <option value="USD">USD - Dolar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                <select
                  value={config.timezone}
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="America/Santiago">America/Santiago</option>
                  <option value="America/Lima">America/Lima</option>
                  <option value="America/Bogota">America/Bogota</option>
                </select>
                <input
                  value={config.taxRate}
                  onChange={(e) => setConfig({ ...config, taxRate: e.target.value })}
                  placeholder="IVA (%)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => saveLocalConfig('Configuracion general guardada')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Guardar cambios
              </button>
            </div>
          )}

          {activeTab === 'branch' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Sucursal y modulo</h2>
              <p className="text-sm text-slate-600">Modulo activo de esta cuenta: <strong>{moduleLabel}</strong></p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={config.branchName}
                  onChange={(e) => setConfig({ ...config, branchName: e.target.value })}
                  placeholder="Nombre de sucursal"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={config.branchPhone}
                  onChange={(e) => setConfig({ ...config, branchPhone: e.target.value })}
                  placeholder="Telefono"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={config.branchAddress}
                  onChange={(e) => setConfig({ ...config, branchAddress: e.target.value })}
                  placeholder="Direccion"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                />
              </div>
              <button
                onClick={() => saveLocalConfig('Datos de sucursal guardados')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Guardar sucursal
              </button>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Impresion termica</h2>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Esta configuracion se guarda localmente para pruebas operativas del POS.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={config.printerType}
                  onChange={(e) => setConfig({ ...config, printerType: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="usb">USB</option>
                  <option value="serial">Serial</option>
                  <option value="tcp">TCP/IP</option>
                </select>
                <input
                  value={config.printerTarget}
                  onChange={(e) => setConfig({ ...config, printerTarget: e.target.value })}
                  placeholder="Puerto o IP"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={config.printerWidth}
                  onChange={(e) => setConfig({ ...config, printerWidth: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="48">48 caracteres</option>
                  <option value="42">42 caracteres</option>
                </select>
              </div>
              <button
                onClick={() => saveLocalConfig('Configuracion de impresion guardada')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Guardar impresion
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Seguridad de cuenta</h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                El cambio de contrasena por API estara disponible en una iteracion siguiente.
              </div>
              <button
                onClick={() => toast('Flujo de cambio de contrasena: proximo paso')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver flujo de cambio
              </button>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Sistema</h2>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p><strong>Version:</strong> Martin POS v1.0.0</p>
                <p><strong>API:</strong> {process.env.NEXT_PUBLIC_API_URL || '/api/v1'}</p>
                <p><strong>Base de datos:</strong> PostgreSQL + Prisma</p>
              </div>
              <button
                onClick={() => bootstrapMutation.mutate()}
                disabled={bootstrapMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {bootstrapMutation.isPending ? 'Cargando datos...' : 'Cargar datos base del modulo'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
