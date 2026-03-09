'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FlaskConical, ShieldCheck } from 'lucide-react';
import { MODULES } from '@/lib/modules';
import { useAuthStore, type BusinessModule } from '@/store/auth';
import toast from 'react-hot-toast';

const ROLE_OPTIONS: Record<Exclude<BusinessModule, 'ALL'>, Array<{ id: string; label: string; description: string }>> = {
  RESTAURANT: [
    { id: 'WAITER', label: 'Garzón', description: 'Atiende mesas, toma pedidos y actualiza comandas.' },
    { id: 'KITCHEN', label: 'Cocina', description: 'Gestiona preparación y estados de platos.' },
    { id: 'CASHIER', label: 'Cajero', description: 'Cobra cuentas, maneja caja y cierra mesa.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Supervisa operación del local.' },
    { id: 'ADMIN', label: 'Admin', description: 'Control total del módulo.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura y seguimiento operativo.' },
  ],
  MINIMARKET: [
    { id: 'CASHIER', label: 'Cajero', description: 'Venta rápida y cobro en caja.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Control de inventario y operación.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administración completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
  BOTILLERIA: [
    { id: 'CASHIER', label: 'Cajero', description: 'Cobro y validación en punto de venta.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Control de catálogo y stock.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administración completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
  BOOKSTORE: [
    { id: 'CASHIER', label: 'Cajero', description: 'Ventas y comprobantes.' },
    { id: 'MANAGER', label: 'Encargado', description: 'Gestión comercial y operación.' },
    { id: 'ADMIN', label: 'Admin', description: 'Administración completa.' },
    { id: 'VIEWER', label: 'Consulta', description: 'Solo lectura.' },
  ],
};

export default function DemoPage() {
  const router = useRouter();
  const accessDemo = useAuthStore((state) => state.accessDemo);
  const [selected, setSelected] = useState<BusinessModule>('MINIMARKET');
  const [selectedRole, setSelectedRole] = useState('CASHIER');
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(
    () => ROLE_OPTIONS[(selected as Exclude<BusinessModule, 'ALL'>) || 'MINIMARKET'] || ROLE_OPTIONS.MINIMARKET,
    [selected],
  );

  const startDemo = async () => {
    setLoading(true);
    try {
      await accessDemo(selected, selectedRole);
      toast.success('Demo iniciada');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No fue posible iniciar demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-12 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Demo guiada</p>
            <h1 className="text-4xl font-black text-slate-900">Elige módulo y perfil operativo</h1>
            <p className="mt-2 text-sm text-slate-600">
              Inicias con datos de operación realista por rubro y rol.
            </p>
          </div>
          <Link href="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-white">
            Volver al sitio
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => {
                setSelected(module.id);
                const firstRole = ROLE_OPTIONS[module.id][0]?.id || 'ADMIN';
                setSelectedRole(firstRole);
              }}
              className={`rounded-3xl border bg-white p-6 text-left transition ${
                selected === module.id
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {module.badge}
                </span>
                <module.icon className="h-5 w-5" style={{ color: module.accent }} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{module.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{module.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Selecciona perfil para explorar operación por rol
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`rounded-xl border px-4 py-3 text-left ${
                  selectedRole === role.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{role.label}</p>
                <p className="mt-1 text-xs text-slate-600">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
            Credenciales demo generadas automáticamente
          </div>
          <p className="text-sm text-slate-600">
            El acceso demo no altera datos productivos. Puedes cambiar módulo y perfil cuando quieras.
          </p>
          <button
            onClick={startDemo}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? 'Preparando demo...' : 'Entrar a demo'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
