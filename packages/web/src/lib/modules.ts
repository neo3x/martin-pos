import {
  BookOpen,
  Store,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { type BusinessModule } from '@/store/auth';

export interface ModuleMeta {
  id: Exclude<BusinessModule, 'ALL'>;
  name: string;
  shortName: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  accent: string;
  features: string[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'RESTAURANT',
    name: 'Restaurante',
    shortName: 'Restaurant',
    description: 'Mesas, comandas, cocina y flujo completo de atencion en salon.',
    badge: 'Food Service',
    icon: UtensilsCrossed,
    accent: '#ea580c',
    features: ['Mesas y estados', 'Comandas activas', 'Consumo por mesa', 'Control de turnos'],
  },
  {
    id: 'MINIMARKET',
    name: 'Minimarket',
    shortName: 'Retail',
    description: 'Venta rapida para conveniencia con inventario practico y rotacion diaria.',
    badge: 'Retail',
    icon: Store,
    accent: '#16a34a',
    features: ['Abarrotes y snacks', 'Reposicion sugerida', 'Control de vencimientos', 'Caja y ventas diarias'],
  },
  {
    id: 'BOTILLERIA',
    name: 'Botilleria',
    shortName: 'Liquor',
    description: 'Catalogo especializado de vinos, cervezas y destilados con foco comercial.',
    badge: 'Specialty',
    icon: Wine,
    accent: '#7f1d1d',
    features: ['Vinos y destilados', 'Mixers y packs', 'Promociones por categoria', 'Alertas de stock critico'],
  },
  {
    id: 'BOOKSTORE',
    name: 'Libreria / Bazar',
    shortName: 'Bookstore',
    description: 'Operacion para papeleria, libros y articulos de bazar con venta por temporada.',
    badge: 'Education',
    icon: BookOpen,
    accent: '#1d4ed8',
    features: ['Libros y cuadernos', 'Utiles escolares', 'Papeleria de oficina', 'Colecciones por temporada'],
  },
];

export const MODULE_NAME_MAP = MODULES.reduce<Record<string, string>>((acc, mod) => {
  acc[mod.id] = mod.name;
  return acc;
}, {
  ALL: 'Multimodulo',
});
