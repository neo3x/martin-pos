'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@martinpos.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesion iniciada');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#eff6ff_45%,_#f8fafc_100%)] px-6 py-12 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-indigo-100 bg-white/90 p-8 shadow-lg shadow-indigo-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Acceso seguro</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Bienvenido a Martin POS</h1>
          <p className="mt-3 text-sm text-slate-600">
            Ingresa para operar tu modulo de negocio con ventas, inventario, clientes y reportes.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-700">
            <p>• Flujo productivo para operacion real.</p>
            <p>• Dashboard modular segun tu rubro.</p>
            <p>• Demo separada de entorno real.</p>
          </div>

          <div className="mt-8 grid gap-2 text-sm">
            <Link href="/demo" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-white">
              Probar demo
            </Link>
            <Link href="/register" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-white">
              Crear cuenta de produccion
            </Link>
            <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-white">
              Volver al sitio comercial
            </Link>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Iniciar sesion</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? 'Ingresando...' : 'Entrar al dashboard'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Cuenta admin de referencia:
            <div className="mt-1 font-mono text-slate-700">admin@martinpos.com / admin123</div>
          </div>
        </form>
      </div>
    </div>
  );
}
