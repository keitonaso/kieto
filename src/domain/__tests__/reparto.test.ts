import { describe, expect, it } from '@jest/globals';

import { aporteMensualMeta, calcularReparto, mesesFondoObjetivo, mesesHasta } from '../reparto';
import type { Perfil } from '../tipos';

const HOY = new Date('2026-10-20T00:00:00');

const base: Perfil = {
  ingresoMensual: 3_000_000,
  estabilidad: 'fijo',
  gastosEsenciales: 1_500_000,
  dependientes: 0,
  fondoEmergenciaActual: 0,
  deudas: [],
  metas: [],
};

const monto = (r: ReturnType<typeof calcularReparto>, id: string) =>
  r.bolsillos.find((b) => b.id === id)?.monto ?? 0;

describe('calcularReparto', () => {
  it('detecta déficit cuando los gastos fijos superan el ingreso', () => {
    const r = calcularReparto({ ...base, gastosEsenciales: 3_200_000 }, HOY);
    expect(r.etapa).toBe('deficit');
    expect(r.bolsillos.map((b) => b.id)).toEqual(['esenciales']);
  });

  it('sin colchón, todo lo disponible (menos gustos reducidos) va al mini fondo', () => {
    const r = calcularReparto(base, HOY);
    expect(r.etapa).toBe('miniFondo');
    // disponible 1.5M, gustos 10 % = 150k, fondo 1.35M
    expect(monto(r, 'gustos')).toBe(150_000);
    expect(monto(r, 'fondoEmergencia')).toBe(1_350_000);
    expect(r.mesesParaSiguienteEtapa).toBe(2);
  });

  it('con mini fondo y tarjeta de crédito, prioriza la deuda cara', () => {
    const r = calcularReparto(
      {
        ...base,
        fondoEmergenciaActual: 2_000_000,
        deudas: [
          { nombre: 'Tarjeta', saldo: 2_000_000, cuotaMinima: 200_000, tasaAnual: 28 },
          { nombre: 'Crédito carro', saldo: 10_000_000, cuotaMinima: 300_000, tasaAnual: 12 },
        ],
      },
      HOY,
    );
    expect(r.etapa).toBe('deudaCara');
    // disponible = 3M - 1.5M - 0.5M = 1M; gustos 100k; resto 900k → 720k deuda, 180k fondo
    expect(monto(r, 'cuotasDeuda')).toBe(500_000);
    expect(monto(r, 'deudaExtra')).toBe(720_000);
    expect(monto(r, 'fondoEmergencia')).toBe(180_000);
    expect(r.bolsillos.find((b) => b.id === 'deudaExtra')?.motivo).toContain('Tarjeta');
  });

  it('una deuda barata no bloquea el avance hacia el fondo completo', () => {
    const r = calcularReparto(
      {
        ...base,
        fondoEmergenciaActual: 2_000_000,
        deudas: [{ nombre: 'Hipoteca', saldo: 90_000_000, cuotaMinima: 500_000, tasaAnual: 11 }],
      },
      HOY,
    );
    expect(r.etapa).toBe('fondoCompleto');
    expect(monto(r, 'fondoEmergencia')).toBe(800_000); // 1M - 20 % gustos
  });

  it('reparte entre fondo y metas cuando hay metas en la etapa de fondo', () => {
    const r = calcularReparto(
      {
        ...base,
        fondoEmergenciaActual: 2_000_000,
        metas: [{ nombre: 'Viaje', montoObjetivo: 4_000_000, ahorrado: 0, fechaLimite: '2027-10-20' }],
      },
      HOY,
    );
    expect(r.etapa).toBe('fondoCompleto');
    // disponible 1.5M, gustos 300k, resto 1.2M → 720k fondo, 480k metas
    expect(monto(r, 'fondoEmergencia')).toBe(720_000);
    expect(monto(r, 'metas')).toBe(480_000);
  });

  it('con base sólida, financia las metas a tiempo e invierte el resto', () => {
    const r = calcularReparto(
      {
        ...base,
        fondoEmergenciaActual: 5_000_000,
        metas: [{ nombre: 'Viaje', montoObjetivo: 2_400_000, ahorrado: 0, fechaLimite: '2027-10-20' }],
      },
      HOY,
    );
    expect(r.etapa).toBe('metasEInversion');
    expect(monto(r, 'metas')).toBe(200_000);
    expect(monto(r, 'inversion')).toBe(1_000_000);
    expect(r.mesesParaSiguienteEtapa).toBeNull();
  });

  it('limita el aporte a metas y avisa cuando no alcanza', () => {
    const r = calcularReparto(
      {
        ...base,
        fondoEmergenciaActual: 5_000_000,
        metas: [{ nombre: 'Moto', montoObjetivo: 10_000_000, ahorrado: 0, fechaLimite: '2027-04-20' }],
      },
      HOY,
    );
    expect(monto(r, 'metas')).toBe(840_000); // 70 % de 1.2M
    expect(r.bolsillos.find((b) => b.id === 'metas')?.motivo).toContain('fecha');
  });
});

describe('mesesFondoObjetivo', () => {
  it('pide más meses con ingreso variable y dependientes, con un tope', () => {
    expect(mesesFondoObjetivo(base)).toBe(3);
    expect(mesesFondoObjetivo({ ...base, estabilidad: 'variable' })).toBe(6);
    expect(mesesFondoObjetivo({ ...base, estabilidad: 'variable', dependientes: 2 })).toBe(8);
    expect(mesesFondoObjetivo({ ...base, estabilidad: 'variable', dependientes: 5 })).toBe(9);
  });
});

describe('metas', () => {
  it('calcula meses restantes y aporte mensual', () => {
    expect(mesesHasta('2027-10-20', HOY)).toBe(12);
    expect(mesesHasta('2026-09-01', HOY)).toBe(1);
    expect(
      aporteMensualMeta(
        { nombre: 'Viaje', montoObjetivo: 1_200_000, ahorrado: 600_000, fechaLimite: '2027-04-20' },
        HOY,
      ),
    ).toBe(100_000);
  });
});
