'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Send, Bot, TrendingUp, Camera, FileText, Mic, Sparkles, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'ocr' | 'vision' | 'voice' | 'pricing'>('chat');
  const [ocrUrl, setOcrUrl] = useState('');
  const [visionUrl, setVisionUrl] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [pricingProductId, setPricingProductId] = useState('');

  const { data: inventoryAnalysis } = useQuery({
    queryKey: ['ai-inventory-analysis'],
    queryFn: () => api.get('/ai/inventory/analyze').then((res) => res.data),
  });

  const { data: dailyReport } = useQuery({
    queryKey: ['ai-daily-report'],
    queryFn: () => api.get('/ai/reports/daily').then((res) => res.data).catch(() => null),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((res) => res.data),
  });

  const aiQueryMutation = useMutation({
    mutationFn: (q: string) => api.post('/ai/query', { query: q }).then((res) => res.data),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { type: 'ai', content: data.response }]);
      setQuery('');
    },
    onError: () => toast.error('Error al consultar la IA'),
  });

  const ocrMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      api.post('/ai/advanced/ocr/invoice', { imageUrl }).then((res) => res.data),
    onSuccess: (data) => toast.success(`Factura procesada: ${data.items?.length || 0} items detectados`),
    onError: () => toast.error('Error en OCR'),
  });

  const visionMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      api.post('/ai/advanced/recognize/product', { imageUrl }).then((res) => res.data),
    onSuccess: (data) => toast.success(`Producto: ${data.name || 'Reconocido'} (${(data.confidence * 100).toFixed(0)}% confianza)`),
    onError: () => toast.error('Error en reconocimiento'),
  });

  const voiceMutation = useMutation({
    mutationFn: (transcript: string) =>
      api.post('/ai/advanced/voice/command', { transcript }).then((res) => res.data),
    onSuccess: (data) => {
      toast.success(`Comando: ${data.action || 'Procesado'}`);
      setVoiceText('');
    },
    onError: () => toast.error('Error al procesar comando'),
  });

  const pricingMutation = useMutation({
    mutationFn: (productId: string) =>
      api.get(`/ai/pricing/${productId}`).then((res) => res.data),
    onSuccess: () => toast.success('Sugerencia de precio generada'),
    onError: () => toast.error('Error al obtener sugerencia'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setMessages((prev) => [...prev, { type: 'user', content: query }]);
    aiQueryMutation.mutate(query);
  };

  const tabs = [
    { id: 'chat' as const, label: 'Chat IA', icon: Bot },
    { id: 'ocr' as const, label: 'OCR Facturas', icon: FileText },
    { id: 'vision' as const, label: 'Vision', icon: Camera },
    { id: 'voice' as const, label: 'Voz', icon: Mic },
    { id: 'pricing' as const, label: 'Precios IA', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Asistente IA</h1>
        <p className="mt-1 text-sm text-gray-500">Chat, OCR, reconocimiento visual, comandos de voz y pricing inteligente</p>
      </div>

      {/* Daily Report Summary */}
      {dailyReport && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-bold">Reporte Diario IA</h2>
          </div>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{dailyReport.summary || dailyReport.report || JSON.stringify(dailyReport)}</p>
        </div>
      )}

      {/* Inventory Analysis */}
      {inventoryAnalysis?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Analisis de Inventario IA
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inventoryAnalysis.slice(0, 6).map((item: any) => (
              <div key={item.productId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{item.productName}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    item.daysUntilStockout <= 3 ? 'bg-red-100 text-red-700' :
                    item.daysUntilStockout <= 7 ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {Math.floor(item.daysUntilStockout)} dias
                  </span>
                </div>
                <p className="text-xs text-slate-600">{item.reasoning}</p>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>Stock: <strong>{item.currentStock}</strong></span>
                  <span>Reorden: <strong className="text-indigo-600">{item.recommendedReorderQuantity}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Bot className="h-5 w-5 text-indigo-600" />
              Consulta al Asistente
            </h2>
          </div>

          <div className="h-96 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Bot className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <p className="font-medium text-slate-500">Haz una pregunta sobre tu negocio</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Productos mas vendidos hoy', 'Sugerencias de inventario', 'Analisis de ventas de la semana'].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); }}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiQueryMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3">
                      <span className="animate-pulse text-sm text-slate-500">Pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!query.trim() || aiQueryMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" />
            OCR de Facturas de Proveedores
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Sube una imagen de factura para extraer automaticamente los datos
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">URL de la Imagen</label>
              <input
                type="url"
                value={ocrUrl}
                onChange={(e) => setOcrUrl(e.target.value)}
                placeholder="https://ejemplo.com/factura.jpg"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={() => ocrMutation.mutate(ocrUrl)}
              disabled={!ocrUrl || ocrMutation.isPending}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {ocrMutation.isPending ? 'Procesando...' : 'Procesar Factura'}
            </button>

            {ocrMutation.data && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-bold text-blue-800">Resultado OCR</h3>
                <div className="space-y-2 text-sm">
                  {ocrMutation.data.supplier && <p><strong>Proveedor:</strong> {ocrMutation.data.supplier}</p>}
                  {ocrMutation.data.invoiceNumber && <p><strong>N° Factura:</strong> {ocrMutation.data.invoiceNumber}</p>}
                  {ocrMutation.data.total && <p><strong>Total:</strong> ${Number(ocrMutation.data.total).toLocaleString('es-CL')}</p>}
                  {ocrMutation.data.items?.length > 0 && (
                    <div>
                      <strong>Items detectados:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {ocrMutation.data.items.map((item: any, i: number) => (
                          <li key={i}>{item.description} - {item.quantity}x ${Number(item.unitPrice || 0).toLocaleString('es-CL')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vision Tab */}
      {activeTab === 'vision' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Camera className="h-5 w-5 text-purple-600" />
            Reconocimiento de Productos
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Sube una foto de un producto para identificarlo automaticamente
          </p>
          <div className="space-y-4">
            <input
              type="url"
              value={visionUrl}
              onChange={(e) => setVisionUrl(e.target.value)}
              placeholder="https://ejemplo.com/producto.jpg"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
            <button
              onClick={() => visionMutation.mutate(visionUrl)}
              disabled={!visionUrl || visionMutation.isPending}
              className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {visionMutation.isPending ? 'Reconociendo...' : 'Reconocer Producto'}
            </button>

            {visionMutation.data && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-2 font-bold text-purple-800">Producto Reconocido</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Nombre:</strong> {visionMutation.data.name}</p>
                  <p><strong>Confianza:</strong> {(visionMutation.data.confidence * 100).toFixed(0)}%</p>
                  {visionMutation.data.category && <p><strong>Categoria:</strong> {visionMutation.data.category}</p>}
                  {visionMutation.data.suggestedPrice && <p><strong>Precio sugerido:</strong> ${Number(visionMutation.data.suggestedPrice).toLocaleString('es-CL')}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Tab */}
      {activeTab === 'voice' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Mic className="h-5 w-5 text-rose-600" />
            Comandos de Voz
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Ingresa el texto del comando de voz para procesarlo
          </p>
          <div className="space-y-4">
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="Ej: Agrega 5 unidades de leche al inventario"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            <button
              onClick={() => voiceMutation.mutate(voiceText)}
              disabled={!voiceText.trim() || voiceMutation.isPending}
              className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {voiceMutation.isPending ? 'Procesando...' : 'Procesar Comando'}
            </button>

            {voiceMutation.data && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h3 className="mb-2 font-bold text-rose-800">Resultado</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Accion:</strong> {voiceMutation.data.action}</p>
                  {voiceMutation.data.entity && <p><strong>Entidad:</strong> {voiceMutation.data.entity}</p>}
                  {voiceMutation.data.details && <p><strong>Detalles:</strong> {JSON.stringify(voiceMutation.data.details)}</p>}
                  <p><strong>Confianza:</strong> {((voiceMutation.data.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">Ejemplos de comandos:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>&bull; &quot;Vende 3 coca colas a efectivo&quot;</p>
                <p>&bull; &quot;Agrega 10 unidades de pan al inventario&quot;</p>
                <p>&bull; &quot;Cual es el producto mas vendido hoy?&quot;</p>
                <p>&bull; &quot;Abre la caja con 50000 pesos&quot;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Precio Optimo IA
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            La IA analiza ventas, competencia y demanda para sugerir el precio optimo
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Seleccionar Producto</label>
              <select
                value={pricingProductId}
                onChange={(e) => setPricingProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Seleccionar producto...</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Actual: ${Number(p.price).toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => pricingMutation.mutate(pricingProductId)}
              disabled={!pricingProductId || pricingMutation.isPending}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pricingMutation.isPending ? 'Analizando...' : 'Obtener Sugerencia de Precio'}
            </button>

            {pricingMutation.data && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="mb-2 font-bold text-emerald-800">Sugerencia de Precio</h3>
                <div className="space-y-2 text-sm">
                  {pricingMutation.data.currentPrice && (
                    <p>Precio Actual: <strong>${Number(pricingMutation.data.currentPrice).toLocaleString('es-CL')}</strong></p>
                  )}
                  {pricingMutation.data.suggestedPrice && (
                    <p className="text-lg">
                      Precio Sugerido: <strong className="text-emerald-700">${Number(pricingMutation.data.suggestedPrice).toLocaleString('es-CL')}</strong>
                    </p>
                  )}
                  {pricingMutation.data.reasoning && (
                    <p className="text-slate-600">{pricingMutation.data.reasoning}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
