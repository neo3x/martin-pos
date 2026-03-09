import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Gauge,
  Layers,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import { MODULES } from '@/lib/modules';
import { OmniPuntoLogo } from '@/components/brand/omnipunto-logo';

const platformFeatures = [
  'Ventas, caja e historial en tiempo real',
  'Inventario, alertas de stock y vencimientos',
  'Clientes, fidelizacion y reportes comerciales',
  'Usuarios, roles y multi-sucursal',
  'Promociones y automatizaciones por rubro',
  'Integraciones y IA asistiva operativa',
];

const plans = [
  {
    name: 'Demo / Trial',
    price: '$0',
    period: '/14 dias',
    description: 'Ideal para evaluar el producto con datos demo por modulo.',
    cta: 'Iniciar demo',
    href: '/demo',
    highlighted: false,
    items: ['1 sucursal demo', 'Datos pre-cargados por rubro', 'Panel completo de prueba'],
  },
  {
    name: 'Basico',
    price: '$29.990',
    period: '/mes',
    description: 'Operacion inicial para negocio unico con funciones esenciales.',
    cta: 'Comenzar',
    href: '/register',
    highlighted: false,
    items: ['1 sucursal', 'Usuarios y roles base', 'Ventas + inventario + reportes'],
  },
  {
    name: 'Profesional',
    price: '$59.990',
    period: '/mes',
    description: 'Escala comercial con analitica avanzada y flujos por modulo.',
    cta: 'Elegir Profesional',
    href: '/register',
    highlighted: true,
    items: ['Multi-sucursal', 'Alertas inteligentes', 'Automatizaciones + IA asistiva'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Operaciones complejas, SLA y arquitectura empresarial.',
    cta: 'Hablar con ventas',
    href: '/register',
    highlighted: false,
    items: ['Implementacion asistida', 'Integraciones dedicadas', 'Soporte prioritario'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f5f7fb_55%,_#f5f7fb_100%)]">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-3">
            <OmniPuntoLogo showSlogan />
            <span className="text-sm font-medium text-slate-600">SaaS Multi-Modulo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Registrarse
            </Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-28 lg:pt-12">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Plataforma POS lista para venderse
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-900 lg:text-6xl">
              Opera tu negocio con un POS modular, elegante y realmente comercial.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              OmniPunto conecta ventas, inventario, clientes y analitica con experiencias operativas especializadas para cada rubro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                Iniciar demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:border-slate-400">
                Crear cuenta
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:border-slate-400">
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-indigo-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vista de plataforma</h3>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Live demo</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Gauge, title: 'Dashboard modular', subtitle: 'KPIs por rubro' },
                { icon: Store, title: 'Inventario activo', subtitle: 'Stock y rotacion' },
                { icon: Users, title: 'Clientes y fidelizacion', subtitle: 'Segmentacion y puntos' },
                { icon: Bot, title: 'IA asistiva', subtitle: 'Insights operativos' },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <card.icon className="mb-3 h-5 w-5 text-indigo-600" />
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Capacidades</p>
            <h2 className="text-3xl font-black lg:text-4xl">Todo lo necesario para operar y crecer</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 lg:flex">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Funciones reales + roadmap claro
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-indigo-600" />
              <p className="font-medium text-slate-800">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Modulos de negocio</p>
          <h2 className="text-3xl font-black lg:text-4xl">Experiencias separadas por rubro</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {MODULES.map((module) => (
            <div key={module.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{module.badge}</p>
                  <h3 className="text-2xl font-bold">{module.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                </div>
                <module.icon className="h-7 w-7" style={{ color: module.accent }} />
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {module.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: module.accent }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Precios SaaS</p>
          <h2 className="text-3xl font-black lg:text-4xl">Planes listos para comercializar</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-6 ${
                plan.highlighted
                  ? 'border-indigo-300 bg-indigo-50 shadow-lg shadow-indigo-100'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="mb-4 flex items-center gap-2">
                {plan.highlighted && <Crown className="h-4 w-4 text-indigo-600" />}
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <p className="mb-1 text-3xl font-black">{plan.price}</p>
              <p className="mb-4 text-sm text-slate-500">{plan.period}</p>
              <p className="mb-4 text-sm text-slate-600">{plan.description}</p>
              <ul className="mb-5 space-y-2 text-sm text-slate-700">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  plan.highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:p-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Como funciona</p>
          <h2 className="mb-8 text-3xl font-black">Activacion en 5 pasos</h2>
          <div className="grid gap-5 md:grid-cols-5">
            {[
              { icon: Building2, title: 'Registrate', desc: 'Crea tu cuenta admin.' },
              { icon: Layers, title: 'Elige modulo', desc: 'Define tu rubro inicial.' },
              { icon: Store, title: 'Configura negocio', desc: 'Sucursal y datos base.' },
              { icon: Gauge, title: 'Carga o usa demo', desc: 'Arranca con datos coherentes.' },
              { icon: CreditCard, title: 'Comienza a vender', desc: 'Opera y mide resultados.' },
            ].map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <step.icon className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-4 lg:px-10">
        <div className="rounded-3xl bg-slate-900 p-8 text-white lg:p-10">
          <h2 className="text-3xl font-black lg:text-4xl">Listo para probar OmniPunto?</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            La plataforma que se adapta a tu negocio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400">
              Iniciar demo
            </Link>
            <Link href="/register" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold hover:bg-slate-800">
              Registrarme
            </Link>
            <Link href="/login" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold hover:bg-slate-800">
              Iniciar sesion
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 text-sm lg:grid-cols-5 lg:px-10">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold">OmniPunto</p>
            <p className="mt-2 text-slate-600">Plataforma POS modular para negocios que quieren operar y vender mejor.</p>
          </div>
          <div>
            <p className="mb-2 font-semibold">Producto</p>
            <ul className="space-y-1 text-slate-600">
              <li>Caracteristicas</li>
              <li>Modulos</li>
              <li>Precios</li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold">Acceso</p>
            <ul className="space-y-1 text-slate-600">
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/register">Registro</Link></li>
              <li><Link href="/demo">Demo</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold">Contacto</p>
            <ul className="space-y-1 text-slate-600">
              <li>ventas@omnipunto.cl</li>
              <li>+56 9 5555 5555</li>
              <li>Santiago, Chile</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
