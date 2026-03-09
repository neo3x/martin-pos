'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useAuthStore, type BusinessModule } from '@/store/auth';
import { MODULES } from '@/lib/modules';
import toast from 'react-hot-toast';
import { OmniPuntoLogo } from '@/components/brand/omnipunto-logo';
import { resolveRoleLandingPath } from '@/lib/role-access';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [loading, setLoading] = useState(false);
  const [moduleType, setModuleType] = useState<BusinessModule | null>(null);
  const [form, setForm] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    initializeDemoData: true,
  });

  const canSubmit = useMemo(() => {
    return (
      !!moduleType &&
      form.businessName.trim().length > 1 &&
      form.businessAddress.trim().length > 3 &&
      form.businessPhone.trim().length > 5 &&
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.email.trim().length > 3 &&
      form.password.length >= 6
    );
  }, [form, moduleType]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleType) {
      toast.error('Selecciona un modulo para continuar');
      return;
    }
    if (!canSubmit) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...form,
        moduleType,
      });
      const authState = useAuthStore.getState();
      const landingPath = resolveRoleLandingPath(authState.user?.role, authState.activeModule || authState.user?.moduleType);
      toast.success('Cuenta creada correctamente');
      router.push(landingPath);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No fue posible crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2ff]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:px-10">
        <section className="w-full rounded-3xl border border-indigo-100 bg-white p-8 shadow-lg shadow-indigo-100 lg:w-[46%]">
          <OmniPuntoLogo showSlogan />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Alta de cuenta</p>
          <h1 className="text-3xl font-black text-slate-900">Configura tu negocio en minutos</h1>
          <p className="mt-3 text-sm text-slate-600">
            Registro real de produccion. Selecciona un modulo obligatorio y cargamos datos iniciales coherentes para arrancar.
          </p>

          <div className="mt-7 space-y-3">
            {[
              'Creacion de sucursal inicial',
              'Administrador SUPER_ADMIN listo para operar',
              'Datos base del rubro seleccionado',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
            <p className="font-semibold">Tambien puedes probar primero la demo</p>
            <Link href="/demo" className="mt-2 inline-flex items-center gap-2 font-semibold underline">
              Ir a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <form onSubmit={onSubmit} className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Datos de registro</h2>
            <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-slate-700">1. Seleccion obligatoria de modulo</p>
            <div className="grid gap-3 md:grid-cols-2">
              {MODULES.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setModuleType(module.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    moduleType === module.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <module.icon className="h-4 w-4" style={{ color: module.accent }} />
                    <p className="text-sm font-semibold">{module.name}</p>
                  </div>
                  <p className="text-xs text-slate-600">{module.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-slate-700">2. Datos del negocio</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Nombre comercial *" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Telefono negocio *" value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Direccion negocio *" value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Email negocio (opcional)" value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} />
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-slate-700">3. Administrador inicial</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Nombre *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Apellido *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input type="email" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Email acceso *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input type="password" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Contrasena (min 6) *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Telefono admin (opcional)" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
          </div>

          <label className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.initializeDemoData}
              onChange={(e) => setForm({ ...form, initializeDemoData: e.target.checked })}
              className="mt-0.5"
            />
            Inicializar datos base del modulo seleccionado (recomendado para empezar a operar).
          </label>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Building2 className="h-4 w-4" />
            {loading ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
