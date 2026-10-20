import type { IdBolsillo } from './tipos';

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  bolsillo: IdBolsillo;
}

/** Categorías por defecto. Cada una cae en un bolsillo del reparto. */
export const CATEGORIAS_GASTO: Categoria[] = [
  { id: 'mercado', nombre: 'Mercado', icono: '🛒', bolsillo: 'esenciales' },
  { id: 'vivienda', nombre: 'Vivienda', icono: '🏠', bolsillo: 'esenciales' },
  { id: 'servicios', nombre: 'Servicios', icono: '💡', bolsillo: 'esenciales' },
  { id: 'transporte', nombre: 'Transporte', icono: '🚌', bolsillo: 'esenciales' },
  { id: 'salud', nombre: 'Salud', icono: '💊', bolsillo: 'esenciales' },
  { id: 'deudas', nombre: 'Deudas', icono: '💳', bolsillo: 'cuotasDeuda' },
  { id: 'comida-fuera', nombre: 'Comida fuera', icono: '🍔', bolsillo: 'gustos' },
  { id: 'cafe-snacks', nombre: 'Café y snacks', icono: '☕', bolsillo: 'gustos' },
  { id: 'domicilios', nombre: 'Domicilios', icono: '🛵', bolsillo: 'gustos' },
  { id: 'ocio', nombre: 'Ocio', icono: '🎬', bolsillo: 'gustos' },
  { id: 'suscripciones', nombre: 'Suscripciones', icono: '📺', bolsillo: 'gustos' },
  { id: 'otros', nombre: 'Otros', icono: '📦', bolsillo: 'gustos' },
];

export const CATEGORIAS_INGRESO: Categoria[] = [
  { id: 'salario', nombre: 'Salario', icono: '💼', bolsillo: 'esenciales' },
  { id: 'extra', nombre: 'Ingreso extra', icono: '✨', bolsillo: 'esenciales' },
];

export function buscarCategoria(id: string): Categoria | undefined {
  return [...CATEGORIAS_GASTO, ...CATEGORIAS_INGRESO].find((c) => c.id === id);
}
