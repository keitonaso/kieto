import reglas from './reglas.json';
import type { Bolsillo, Etapa, IdBolsillo, Meta, Perfil, Reparto } from './tipos';

const NOMBRES: Record<IdBolsillo, string> = {
  esenciales: 'Gastos esenciales',
  cuotasDeuda: 'Cuotas mínimas de deudas',
  deudaExtra: 'Abono extra a deudas caras',
  fondoEmergencia: 'Fondo de emergencia',
  metas: 'Metas de ahorro',
  inversion: 'Inversión a largo plazo',
  gustos: 'Gustos y ocio',
};

/** Meses completos entre hoy y la fecha límite (mínimo 1). */
export function mesesHasta(fechaLimite: string, hoy: Date = new Date()): number {
  const limite = new Date(fechaLimite + 'T00:00:00');
  const meses =
    (limite.getFullYear() - hoy.getFullYear()) * 12 + (limite.getMonth() - hoy.getMonth());
  return Math.max(1, meses);
}

/** Cuánto hay que apartar cada mes para llegar a la meta a tiempo. */
export function aporteMensualMeta(meta: Meta, hoy: Date = new Date()): number {
  const falta = Math.max(0, meta.montoObjetivo - meta.ahorrado);
  return falta / mesesHasta(meta.fechaLimite, hoy);
}

/** Meses de gastos que debería cubrir el fondo de emergencia según el caso. */
export function mesesFondoObjetivo(perfil: Perfil): number {
  const base =
    perfil.estabilidad === 'fijo' ? reglas.fondoMesesIngresoFijo : reglas.fondoMesesIngresoVariable;
  const meses = base + perfil.dependientes * reglas.fondoMesesExtraPorDependiente;
  return Math.min(meses, reglas.fondoMesesMaximo);
}

function decidirEtapa(perfil: Perfil, gastosBase: number, disponible: number): Etapa {
  if (disponible <= 0) return 'deficit';
  if (perfil.fondoEmergenciaActual < reglas.miniFondoMeses * gastosBase) return 'miniFondo';
  if (perfil.deudas.some((d) => d.saldo > 0 && d.tasaAnual >= reglas.tasaDeudaCara)) {
    return 'deudaCara';
  }
  if (perfil.fondoEmergenciaActual < mesesFondoObjetivo(perfil) * gastosBase) {
    return 'fondoCompleto';
  }
  return 'metasEInversion';
}

/**
 * Recomienda cómo repartir el ingreso mensual según la situación de la persona.
 * Sigue el orden de prioridades más usado en educación financiera:
 * esenciales → mini fondo → deudas caras → fondo completo → metas → inversión.
 */
export function calcularReparto(perfil: Perfil, hoy: Date = new Date()): Reparto {
  const ingreso = perfil.ingresoMensual;
  const cuotas = perfil.deudas.reduce((s, d) => s + d.cuotaMinima, 0);
  const gastosBase = perfil.gastosEsenciales + cuotas;
  const disponible = ingreso - gastosBase;
  const etapa = decidirEtapa(perfil, gastosBase, disponible);

  const montos: Partial<Record<IdBolsillo, number>> = {
    esenciales: perfil.gastosEsenciales,
    cuotasDeuda: cuotas,
  };
  const motivos: Partial<Record<IdBolsillo, string>> = {
    esenciales: 'Arriendo, servicios, mercado y transporte van primero.',
    cuotasDeuda: 'Pagar al menos el mínimo evita intereses de mora y reportes.',
  };

  if (etapa === 'deficit') {
    const falta = -disponible;
    return armar(ingreso, etapa, montos, motivos, {
      resumen: `Tus gastos fijos superan tu ingreso por ${redondear(falta)}. El primer paso es recortar gastos o renegociar cuotas; mientras tanto no es momento de ahorrar ni invertir.`,
      meses: null,
    });
  }

  const gustosPct =
    etapa === 'miniFondo' || etapa === 'deudaCara'
      ? reglas.gustos.porcentajeAjustado
      : reglas.gustos.porcentajeNormal;
  const gustos = disponible * gustosPct;
  const resto = disponible - gustos;
  montos.gustos = gustos;
  motivos.gustos =
    gustosPct === reglas.gustos.porcentajeAjustado
      ? 'Reducido por ahora mientras sales de la etapa más urgente, pero nunca en cero.'
      : 'Darte gustos con presupuesto hace que el plan sea sostenible.';

  const fondoObjetivo = mesesFondoObjetivo(perfil) * gastosBase;
  const tieneMetas = perfil.metas.some((m) => m.ahorrado < m.montoObjetivo);
  let resumen: string;
  let meses: number | null = null;

  switch (etapa) {
    case 'miniFondo': {
      const miniFondo = reglas.miniFondoMeses * gastosBase;
      montos.fondoEmergencia = resto;
      motivos.fondoEmergencia = `Primero un colchón de ${redondear(miniFondo)} para que un imprevisto no te obligue a endeudarte.`;
      meses = Math.ceil((miniFondo - perfil.fondoEmergenciaActual) / resto);
      resumen = 'Etapa 1: armar un mini fondo de emergencia.';
      break;
    }
    case 'deudaCara': {
      const caras = perfil.deudas.filter((d) => d.tasaAnual >= reglas.tasaDeudaCara);
      const saldoCaro = caras.reduce((s, d) => s + d.saldo, 0);
      const cuotasCaras = caras.reduce((s, d) => s + d.cuotaMinima, 0);
      const reparto = reglas.etapas.deudaCara;
      montos.deudaExtra = resto * reparto.deudaExtra;
      montos.fondoEmergencia = resto * reparto.fondoEmergencia;
      const masCara = [...caras].sort((a, b) => b.tasaAnual - a.tasaAnual)[0];
      motivos.deudaExtra = `Abona primero a "${masCara.nombre}" (${masCara.tasaAnual} % anual): ninguna inversión segura rinde lo que te cuesta esa deuda.`;
      motivos.fondoEmergencia = 'Una parte pequeña sigue creciendo tu colchón.';
      meses = Math.ceil(saldoCaro / (montos.deudaExtra + cuotasCaras));
      resumen = 'Etapa 2: salir de las deudas caras.';
      break;
    }
    case 'fondoCompleto': {
      const reparto = reglas.etapas.fondoCompleto;
      montos.fondoEmergencia = tieneMetas ? resto * reparto.fondoEmergencia : resto;
      if (tieneMetas) {
        montos.metas = resto * reparto.metas;
        motivos.metas = 'Tus metas avanzan mientras completas el fondo.';
      }
      motivos.fondoEmergencia = `Completar ${mesesFondoObjetivo(perfil)} meses de gastos (${redondear(fondoObjetivo)}) según tu tipo de ingreso y quién depende de ti.`;
      meses = Math.ceil((fondoObjetivo - perfil.fondoEmergenciaActual) / montos.fondoEmergencia);
      resumen = 'Etapa 3: completar el fondo de emergencia.';
      break;
    }
    case 'metasEInversion': {
      const necesidad = perfil.metas.reduce((s, m) => s + aporteMensualMeta(m, hoy), 0);
      const metas = Math.min(necesidad, resto * reglas.etapas.metasEInversion.metasMaximo);
      if (metas > 0) {
        montos.metas = metas;
        motivos.metas =
          metas < necesidad
            ? 'No alcanza para todas tus metas a tiempo: considera mover alguna fecha.'
            : 'Lo justo para llegar a tus metas en la fecha que elegiste.';
      }
      montos.inversion = resto - metas;
      motivos.inversion =
        'Ya tienes base sólida: lo que sobra puede crecer a largo plazo según tu perfil de riesgo.';
      resumen = 'Etapa 4: cumplir metas e invertir.';
      break;
    }
  }

  return armar(ingreso, etapa, montos, motivos, { resumen, meses });
}

function armar(
  ingreso: number,
  etapa: Etapa,
  montos: Partial<Record<IdBolsillo, number>>,
  motivos: Partial<Record<IdBolsillo, string>>,
  extra: { resumen: string; meses: number | null },
): Reparto {
  const orden: IdBolsillo[] = [
    'esenciales',
    'cuotasDeuda',
    'deudaExtra',
    'fondoEmergencia',
    'metas',
    'inversion',
    'gustos',
  ];
  const bolsillos: Bolsillo[] = orden
    .filter((id) => (montos[id] ?? 0) > 0 || id === 'esenciales')
    .map((id) => {
      const monto = Math.round(montos[id] ?? 0);
      return {
        id,
        nombre: NOMBRES[id],
        monto,
        porcentaje: ingreso > 0 ? Math.round((monto / ingreso) * 100) : 0,
        motivo: motivos[id] ?? '',
      };
    });
  return { etapa, bolsillos, resumen: extra.resumen, mesesParaSiguienteEtapa: extra.meses };
}

function redondear(valor: number): string {
  return `$${Math.round(valor).toLocaleString('es')}`;
}
