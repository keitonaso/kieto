import type { SQLiteDatabase } from 'expo-sqlite';

import type { Meta, Perfil } from '../domain/tipos';

export const NOMBRE_BD = 'kieto.db';
const VERSION_BD = 1;

export type TipoMovimiento = 'gasto' | 'ingreso';

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  monto: number;
  categoria: string;
  nota: string | null;
  /** Fecha ISO (AAAA-MM-DD). */
  fecha: string;
}

/** Crea o actualiza las tablas. Se llama una vez al abrir la app. */
export async function migrar(db: SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  if (actual >= VERSION_BD) return;

  if (actual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS perfil (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        datos TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso')),
        monto REAL NOT NULL,
        categoria TEXT NOT NULL,
        nota TEXT,
        fecha TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS movimientos_fecha ON movimientos (fecha);
      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        montoObjetivo REAL NOT NULL,
        ahorrado REAL NOT NULL DEFAULT 0,
        fechaLimite TEXT NOT NULL
      );
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${VERSION_BD}`);
}

// Perfil (respuestas del diagnóstico). Las metas viven en su propia tabla.

export async function leerPerfil(db: SQLiteDatabase): Promise<Perfil | null> {
  const fila = await db.getFirstAsync<{ datos: string }>('SELECT datos FROM perfil WHERE id = 1');
  if (!fila) return null;
  const perfil = JSON.parse(fila.datos) as Omit<Perfil, 'metas'>;
  return { ...perfil, metas: await listarMetas(db) };
}

export async function guardarPerfil(db: SQLiteDatabase, perfil: Perfil): Promise<void> {
  const { metas: _metas, ...datos } = perfil;
  await db.runAsync(
    'INSERT INTO perfil (id, datos) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET datos = excluded.datos',
    JSON.stringify(datos),
  );
}

// Movimientos

export async function agregarMovimiento(
  db: SQLiteDatabase,
  m: Omit<Movimiento, 'id'>,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO movimientos (tipo, monto, categoria, nota, fecha) VALUES (?, ?, ?, ?, ?)',
    m.tipo,
    m.monto,
    m.categoria,
    m.nota,
    m.fecha,
  );
}

/** Movimientos del mes indicado (AAAA-MM), más recientes primero. */
export function listarMovimientosDelMes(db: SQLiteDatabase, mes: string): Promise<Movimiento[]> {
  return db.getAllAsync<Movimiento>(
    'SELECT * FROM movimientos WHERE substr(fecha, 1, 7) = ? ORDER BY fecha DESC, id DESC',
    mes,
  );
}

export async function borrarMovimiento(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM movimientos WHERE id = ?', id);
}

// Metas

export function listarMetas(db: SQLiteDatabase): Promise<Meta[]> {
  return db.getAllAsync<Meta>('SELECT * FROM metas ORDER BY fechaLimite');
}

export async function agregarMeta(db: SQLiteDatabase, meta: Omit<Meta, 'id'>): Promise<void> {
  await db.runAsync(
    'INSERT INTO metas (nombre, montoObjetivo, ahorrado, fechaLimite) VALUES (?, ?, ?, ?)',
    meta.nombre,
    meta.montoObjetivo,
    meta.ahorrado,
    meta.fechaLimite,
  );
}

export async function aportarAMeta(db: SQLiteDatabase, id: number, monto: number): Promise<void> {
  await db.runAsync('UPDATE metas SET ahorrado = ahorrado + ? WHERE id = ?', monto, id);
}

export async function borrarMeta(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM metas WHERE id = ?', id);
}
