'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Send, Bot, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const { data: inventoryAnalysis } = useQuery({
    queryKey: ['ai-inventory-analysis'],
    queryFn: () => api.get('/ai/inventory/analyze').then((res) => res.data),
  });

  const aiQueryMutation = useMutation({
    mutationFn: (query: string) => api.post('/ai/query', { query }).then((res) => res.data),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { type: 'ai', content: data.response }]);
      setQuery('');
    },
    onError: () => {
      toast.error('Error al consultar la IA');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { type: 'user', content: query }]);
    aiQueryMutation.mutate(query);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Asistente IA</h1>

      {/* Inventory Analysis */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <TrendingUp className="h-5 w-5" />
          Análisis de Inventario
        </h2>

        <div className="space-y-3">
          {inventoryAnalysis?.slice(0, 5).map((item: any) => (
            <div key={item.productId} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{item.productName}</h3>
                <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  {Math.floor(item.daysUntilStockout)} días
                </span>
              </div>
              <p className="mb-2 text-sm text-gray-600">{item.reasoning}</p>
              <div className="flex gap-4 text-sm">
                <span>Stock actual: {item.currentStock}</span>
                <span>Reorden sugerido: {item.recommendedReorderQuantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Bot className="h-5 w-5" />
            Consulta al Asistente
          </h2>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-gray-500">
              <div>
                <Bot className="mx-auto mb-4 h-12 w-12" />
                <p>Haz una pregunta sobre inventario, ventas o productos</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiQueryMutation.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 p-3">
                    <span className="animate-pulse">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!query.trim() || aiQueryMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
