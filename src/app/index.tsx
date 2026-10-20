import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  BarraProgreso,
  Boton,
  estilos,
  formatearDinero,
  Tarjeta,
  Titulo,
} from '../components/ui';
import { leerPerfil, listarMovimientosDelMes, type Movimiento } from '../db/basedatos';
import { buscarCategoria } from '../domain/categorias';
import { calcularReparto } from '../domain/reparto';
import type { IdBolsillo, Perfil } from '../domain/tipos';

export default function Plan() {
  const db = useSQLiteContext();
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  useFocusEffect(
    useCallback(() => {
      const mes = new Date().toISOString().slice(0, 7);
      leerPerfil(db).then(setPerfil);
      listarMovimientosDelMes(db, mes).then(setMovimientos);
    }, [db]),
  );

  if (perfil === undefined) return null;

  if (perfil === null) {
    return (
      <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
        <Titulo>Hola 👋</Titulo>
        <Tarjeta>
          <Text style={estilos.texto}>
            No hay una regla de ahorro que sirva para todos. Respóndeme unas preguntas cortas y te
            recomiendo cómo repartir tu dinero según tu caso.
          </Text>
        </Tarjeta>
        <Boton texto="Empezar diagnóstico" onPress={() => router.push('/diagnostico')} />
      </ScrollView>
    );
  }

  const reparto = calcularReparto(perfil);
  const gastadoPorBolsillo: Partial<Record<IdBolsillo, number>> = {};
  let ingresos = 0;
  let gastos = 0;
  for (const m of movimientos) {
    if (m.tipo === 'ingreso') {
      ingresos += m.monto;
      continue;
    }
    gastos += m.monto;
    const bolsillo = buscarCategoria(m.categoria)?.bolsillo ?? 'gustos';
    gastadoPorBolsillo[bolsillo] = (gastadoPorBolsillo[bolsillo] ?? 0) + m.monto;
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Tarjeta>
        <Text style={[estilos.texto, { fontWeight: '700' }]}>{reparto.resumen}</Text>
        {reparto.mesesParaSiguienteEtapa !== null && (
          <Text style={estilos.suave}>
            Siguiendo el plan, pasas a la siguiente etapa en unos {reparto.mesesParaSiguienteEtapa}{' '}
            {reparto.mesesParaSiguienteEtapa === 1 ? 'mes' : 'meses'}.
          </Text>
        )}
      </Tarjeta>

      <Text style={[estilos.titulo, { fontSize: 18 }]}>Tu reparto recomendado</Text>
      {reparto.bolsillos.map((b) => {
        const gastado = gastadoPorBolsillo[b.id];
        return (
          <Tarjeta key={b.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[estilos.texto, { fontWeight: '600' }]}>{b.nombre}</Text>
              <Text style={estilos.texto}>
                {b.porcentaje} % · {formatearDinero(b.monto)}
              </Text>
            </View>
            <Text style={[estilos.suave, { marginTop: 4 }]}>{b.motivo}</Text>
            {gastado !== undefined && b.monto > 0 && (
              <View style={{ marginTop: 8, gap: 4 }}>
                <BarraProgreso valor={gastado / b.monto} />
                <Text style={estilos.suave}>
                  Este mes llevas {formatearDinero(gastado)} de {formatearDinero(b.monto)}
                </Text>
              </View>
            )}
          </Tarjeta>
        );
      })}

      <Tarjeta>
        <Text style={[estilos.texto, { fontWeight: '600' }]}>Este mes</Text>
        <Text style={estilos.texto}>Ingresos registrados: {formatearDinero(ingresos)}</Text>
        <Text style={estilos.texto}>Gastos registrados: {formatearDinero(gastos)}</Text>
      </Tarjeta>

      <Boton secundario texto="Actualizar mi diagnóstico" onPress={() => router.push('/diagnostico')} />
    </ScrollView>
  );
}
