'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { MODULES } from '@/lib/modules';
import { useAuthStore, type BusinessModule } from '@/store/auth';
import toast from 'react-hot-toast';

export default function DemoPage() {
  const router = useRouter();
  const accessDemo = useAuthStore((state) => state.accessDemo);
  const [selected, setSelected] = useState<BusinessModule>('MINIMARKET');
  const [loading, setLoading] = useState(false);

  const startDemo = async () => {
    setLoading(true);
    try {
      await accessDemo(selected);
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
            <h1 className="text-4xl font-black text-slate-900">Elige un modulo y entra al instante</h1>
            <p className="mt-2 text-sm text-slate-600">
              Cargamos usuarios, productos, clientes y operacion demo coherente con el rubro.
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
              onClick={() => setSelected(module.id)}
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
              <ul className="mt-4 space-y-1 text-sm text-slate-700">
                {module.features.map((f) => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
            Credenciales demo generadas automaticamente
          </div>
          <p className="text-sm text-slate-600">
            Este acceso no modifica tu cuenta de produccion. Puedes cambiar de modulo y probar escenarios reales.
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

