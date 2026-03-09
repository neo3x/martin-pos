'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, KeyRound, Settings, Store, Soup } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { MODULE_NAME_MAP } from '@/lib/modules';
import { useAuthStore } from '@/store/auth';

type TaxForm = {
  taxName: string;
  taxRatePercent: string;
  taxEnabled: boolean;
  pricesIncludeTax: boolean;
};

type KdsForm = {
  theme: 'light' | 'dark';
  defaultPrepMinutes: string;
  warningMinutes: string;
  criticalMinutes: string;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tax');
  const moduleType = useAuthStore((state) => state.activeModule || state.user?.moduleType || 'ALL');
  const moduleLabel = useMemo(() => MODULE_NAME_MAP[moduleType] || moduleType, [moduleType]);

  const [taxForm, setTaxForm] = useState<TaxForm>({
    taxName: 'IVA',
    taxRatePercent: '19',
    taxEnabled: true,
    pricesIncludeTax: false,
  });
  const [kdsForm, setKdsForm] = useState<KdsForm>({
    theme: 'dark',
    defaultPrepMinutes: '15',
    warningMinutes: '20',
    criticalMinutes: '30',
  });
  const [provider, setProvider] = useState<'OPENAI' | 'ANTHROPIC'>('OPENAI');
  const [apiKey, setApiKey] = useState('');
  const [replaceDrafts, setReplaceDrafts] = useState<Record<string, string>>({});

  const { data: settingsData } = useQuery({
    queryKey: ['settings-current'],
    queryFn: () => api.get('/settings/current').then((res) => res.data),
  });

  const { data: aiKeys } = useQuery({
    queryKey: ['settings-ai-keys'],
    queryFn: () => api.get('/settings/ai-keys').then((res) => res.data),
  });

  useEffect(() => {
    if (!settingsData?.tax) return;
    setTaxForm({
      taxName: String(settingsData.tax.taxName || 'IVA'),
      taxRatePercent: String(settingsData.tax.taxRatePercent ?? 19),
      taxEnabled: Boolean(settingsData.tax.taxEnabled),
      pricesIncludeTax: Boolean(settingsData.tax.pricesIncludeTax),
    });
  }, [settingsData?.tax]);

  useEffect(() => {
    if (!settingsData?.kds) return;
    setKdsForm({
      theme: settingsData.kds.theme === 'light' ? 'light' : 'dark',
      defaultPrepMinutes: String(settingsData.kds.defaultPrepMinutes ?? 15),
      warningMinutes: String(settingsData.kds.warningMinutes ?? 20),
      criticalMinutes: String(settingsData.kds.criticalMinutes ?? 30),
    });
  }, [settingsData?.kds]);

  const refreshSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['settings-current'] });
    queryClient.invalidateQueries({ queryKey: ['settings-ai-keys'] });
  };

  const updateTaxMutation = useMutation({
    mutationFn: () =>
      api.put('/settings/tax', {
        taxName: taxForm.taxName,
        taxRatePercent: Number(taxForm.taxRatePercent || 0),
        taxEnabled: taxForm.taxEnabled,
        pricesIncludeTax: taxForm.pricesIncludeTax,
      }),
    onSuccess: () => {
      toast.success('Configuracion fiscal actualizada');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar impuesto'),
  });

  const updateKdsMutation = useMutation({
    mutationFn: () =>
      api.put('/settings/kds', {
        theme: kdsForm.theme,
        defaultPrepMinutes: Number(kdsForm.defaultPrepMinutes || 15),
        warningMinutes: Number(kdsForm.warningMinutes || 20),
        criticalMinutes: Number(kdsForm.criticalMinutes || 30),
      }),
    onSuccess: () => {
      toast.success('Configuracion KDS actualizada');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar KDS'),
  });

  const addAiKeyMutation = useMutation({
    mutationFn: () =>
      api.post('/settings/ai-keys', {
        provider,
        apiKey: apiKey.trim(),
        isActive: true,
      }),
    onSuccess: () => {
      toast.success('API key guardada');
      setApiKey('');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo guardar API key'),
  });

  const replaceAiKeyMutation = useMutation({
    mutationFn: ({ id, provider: rowProvider, value }: { id: string; provider: string; value: string }) =>
      api.put(`/settings/ai-keys/${id}/replace`, {
        provider: rowProvider,
        apiKey: value,
        isActive: true,
      }),
    onSuccess: () => {
      toast.success('API key reemplazada');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo reemplazar API key'),
  });

  const toggleAiKeyMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/settings/ai-keys/${id}/toggle`, { isActive }),
    onSuccess: () => {
      toast.success('Estado de API key actualizado');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo cambiar estado'),
  });

  const removeAiKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/ai-keys/${id}`),
    onSuccess: () => {
      toast.success('API key eliminada');
      refreshSettings();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo eliminar API key'),
  });

  const tabs = [
    { id: 'tax', label: 'Impuestos', icon: Settings },
    { id: 'kds', label: 'KDS', icon: Soup },
    { id: 'ai', label: 'IA Keys', icon: KeyRound },
    { id: 'branch', label: 'Sucursal', icon: Store },
    { id: 'system', label: 'Sistema', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Configuracion</h1>
        <p className="mt-1 text-sm text-slate-600">Impuestos, KDS y seguridad de integraciones IA.</p>
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
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Configuracion de impuesto</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={taxForm.taxName}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, taxName: e.target.value }))}
                  placeholder="Nombre impuesto (IVA, VAT, IGV...)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={taxForm.taxRatePercent}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, taxRatePercent: e.target.value }))}
                  placeholder="Porcentaje"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={taxForm.taxEnabled}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, taxEnabled: e.target.checked }))}
                />
                Impuesto habilitado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={taxForm.pricesIncludeTax}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, pricesIncludeTax: e.target.checked }))}
                />
                Precios incluyen impuesto
              </label>
              <button
                onClick={() => updateTaxMutation.mutate()}
                disabled={updateTaxMutation.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Guardar impuesto
              </button>
            </div>
          )}

          {activeTab === 'kds' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Configuracion KDS</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={kdsForm.theme}
                  onChange={(e) => setKdsForm((prev) => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="dark">Tema oscuro</option>
                  <option value="light">Tema claro</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={180}
                  step={1}
                  value={kdsForm.defaultPrepMinutes}
                  onChange={(e) => setKdsForm((prev) => ({ ...prev, defaultPrepMinutes: e.target.value }))}
                  placeholder="Tiempo prep. por defecto"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={180}
                  step={1}
                  value={kdsForm.warningMinutes}
                  onChange={(e) => setKdsForm((prev) => ({ ...prev, warningMinutes: e.target.value }))}
                  placeholder="Minutos alerta warning"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  value={kdsForm.criticalMinutes}
                  onChange={(e) => setKdsForm((prev) => ({ ...prev, criticalMinutes: e.target.value }))}
                  placeholder="Minutos alerta critica"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => updateKdsMutation.mutate()}
                disabled={updateKdsMutation.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Guardar KDS
              </button>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">API Keys de IA</h2>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Las claves se guardan cifradas en backend. Luego de guardar solo se muestran en formato enmascarado.
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'OPENAI' | 'ANTHROPIC')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Claude (Anthropic)</option>
                </select>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Pega aqui tu API key"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => addAiKeyMutation.mutate()}
                  disabled={addAiKeyMutation.isPending || !apiKey.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {(aiKeys || []).map((row: any) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{row.maskedKey}</p>
                        <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString('es-CL')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAiKeyMutation.mutate({ id: row.id, isActive: !row.isActive })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            row.isActive
                              ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {row.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                        <button
                          onClick={() => removeAiKeyMutation.mutate(row.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={replaceDrafts[row.id] || ''}
                        onChange={(e) => setReplaceDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder="Nueva API key"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => {
                          const value = (replaceDrafts[row.id] || '').trim();
                          if (!value) return;
                          replaceAiKeyMutation.mutate({ id: row.id, provider: row.provider, value });
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        Reemplazar
                      </button>
                    </div>
                  </div>
                ))}
                {(aiKeys || []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No hay API keys configuradas.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'branch' && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Sucursal</h2>
              <p className="text-sm text-slate-600">
                Modulo activo de esta cuenta: <strong>{moduleLabel}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Sucursal: <strong>{settingsData?.branch?.name || '-'}</strong>
              </p>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Sistema</h2>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p><strong>Version:</strong> OmniPunto v1.0.0</p>
                <p><strong>API:</strong> {process.env.NEXT_PUBLIC_API_URL || '/api/v1'}</p>
                <p><strong>Base de datos:</strong> PostgreSQL + Prisma</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
