'use client';

import { useState, useEffect } from 'react';
import { Settings, Store, Printer, Shield, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branch', label: 'Sucursal', icon: Store },
    { id: 'printer', label: 'Impresora', icon: Printer },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'system', label: 'Sistema', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-lg bg-white p-6 shadow">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'branch' && <BranchSettings />}
          {activeTab === 'printer' && <PrinterSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configuración General</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre del Negocio</label>
          <input
            type="text"
            defaultValue="Martin POS"
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Moneda</label>
          <select className="w-full rounded-lg border px-4 py-2">
            <option value="CLP">CLP - Peso Chileno</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Zona Horaria</label>
          <select className="w-full rounded-lg border px-4 py-2">
            <option value="America/Santiago">America/Santiago (Chile)</option>
            <option value="America/Mexico_City">America/Mexico_City (México)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">IVA (%)</label>
          <input
            type="number"
            defaultValue={19}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>
        <button
          onClick={() => toast.success('Configuración guardada')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

function BranchSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configuración de Sucursal</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre de la Sucursal</label>
          <input type="text" defaultValue="Sucursal Principal" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Dirección</label>
          <input type="text" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono</label>
          <input type="text" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo de Módulo</label>
          <select className="w-full rounded-lg border px-4 py-2">
            <option value="ALL">Todos</option>
            <option value="RESTAURANT">Restaurante</option>
            <option value="BOOKSTORE">Librería/Bazar</option>
            <option value="MINIMARKET">Minimarket</option>
            <option value="BOTILLERIA">Botillería</option>
          </select>
        </div>
        <button
          onClick={() => toast.success('Sucursal actualizada')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

function PrinterSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configuración de Impresora</h2>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          La impresión térmica requiere conexión local al dispositivo (USB/Serial/Red).
          Configure la dirección de su impresora a continuación.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo de Conexión</label>
          <select className="w-full rounded-lg border px-4 py-2">
            <option value="usb">USB</option>
            <option value="serial">Serial</option>
            <option value="tcp">TCP/IP (Red)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Puerto / IP</label>
          <input type="text" defaultValue="/dev/usb/lp0" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Ancho de Papel</label>
          <select className="w-full rounded-lg border px-4 py-2">
            <option value="48">48 caracteres (58mm)</option>
            <option value="42">42 caracteres (80mm)</option>
          </select>
        </div>
        <button
          onClick={() => toast.success('Impresora configurada')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Guardar y Probar
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Seguridad</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña Actual</label>
          <input type="password" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nueva Contraseña</label>
          <input type="password" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirmar Contraseña</label>
          <input type="password" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <button
          onClick={() => toast.success('Contraseña actualizada')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Cambiar Contraseña
        </button>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Sistema</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Versión</p>
            <p className="text-sm text-gray-500">Martin POS v1.0.0</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">API Backend</p>
            <p className="text-sm text-gray-500">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Base de Datos</p>
            <p className="text-sm text-gray-500">PostgreSQL + Prisma</p>
          </div>
        </div>
      </div>
    </div>
  );
}
