'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User2 } from 'lucide-react';
import { useAuthStore, type BusinessModule } from '@/store/auth';
import { MODULE_NAME_MAP } from '@/lib/modules';

export function Header() {
  const router = useRouter();
  const { user, logout, activeModule, setActiveModule } = useAuthStore();

  const availableModules = (user?.availableModules?.length ? user.availableModules : [user?.moduleType || 'ALL']) as BusinessModule[];
  const currentModule = (activeModule || user?.moduleType || 'ALL') as BusinessModule;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {user?.isDemo ? 'Demo' : 'Produccion'}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Bienvenido, {user?.firstName || 'Usuario'}</p>
            <p className="text-xs text-slate-500">{user?.branchName || 'Sucursal principal'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 md:flex">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modulo</label>
            <select
              value={currentModule}
              onChange={(e) => setActiveModule(e.target.value as BusinessModule)}
              disabled={availableModules.length <= 1}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
            >
              {availableModules.map((mod) => (
                <option key={mod} value={mod}>
                  {MODULE_NAME_MAP[mod] || mod}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
            <User2 className="h-4 w-4" />
            <span className="max-w-44 truncate">{user?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
