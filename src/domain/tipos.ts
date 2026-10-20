// Montos siempre en la moneda local del usuario, por mes.

export type EstabilidadIngreso = 'fijo' | 'variable';

export interface Deuda {
  nombre: string;
  saldo: number;
  cuotaMinima: number;
  /** Tasa de interés efectiva anual, en porcentaje (ej. 28 = 28 % anual). */
  tasaAnual: number;
}

export interface Meta {
  id?: number;
  nombre: string;
  montoObjetivo: number;
  ahorrado: number;
  /** Fecha límite en formato ISO (AAAA-MM-DD). */
  fechaLimite: string;
}

/** Respuestas del diagnóstico inicial. */
export interface Perfil {
  ingresoMensual: number;
  estabilidad: EstabilidadIngreso;
  gastosEsenciales: number;
  dependientes: number;
  fondoEmergenciaActual: number;
  deudas: Deuda[];
  metas: Meta[];
}

export type IdBolsillo =
  | 'esenciales'
  | 'cuotasDeuda'
  | 'deudaExtra'
  | 'fondoEmergencia'
  | 'metas'
  | 'inversion'
  | 'gustos';

export interface Bolsillo {
  id: IdBolsillo;
  nombre: string;
  monto: number;
  /** Porcentaje del ingreso mensual, redondeado a entero. */
  porcentaje: number;
  motivo: string;
}

export type Etapa =
  | 'deficit'
  | 'miniFondo'
  | 'deudaCara'
  | 'fondoCompleto'
  | 'metasEInversion';

export interface Reparto {
  etapa: Etapa;
  bolsillos: Bolsillo[];
  /** Explicación corta de en qué estás y qué viene después. */
  resumen: string;
  /** Meses estimados para pasar a la siguiente etapa, si se puede calcular. */
  mesesParaSiguienteEtapa: number | null;
}
