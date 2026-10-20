import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  BarraProgreso,
  Boton,
  Campo,
  estilos,
  formatearDinero,
  leerMonto,
  Tarjeta,
} from '../components/ui';
import { agregarMeta, aportarAMeta, borrarMeta, listarMetas } from '../db/basedatos';
import { aporteMensualMeta, mesesHasta } from '../domain/reparto';
import type { Meta } from '../domain/tipos';

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

export default function Metas() {
  const db = useSQLiteContext();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [nombre, setNombre] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [aportes, setAportes] = useState<Record<number, string>>({});

  const recargar = useCallback(() => {
    listarMetas(db).then(setMetas);
  }, [db]);
  useFocusEffect(recargar);

  const listo = nombre.trim() !== '' && leerMonto(objetivo) > 0 && FECHA_VALIDA.test(fecha);

  async function crear() {
    if (!listo) return;
    await agregarMeta(db, {
      nombre: nombre.trim(),
      montoObjetivo: leerMonto(objetivo),
      ahorrado: 0,
      fechaLimite: fecha,
    });
    setNombre('');
    setObjetivo('');
    setFecha('');
    recargar();
  }

  async function aportar(id: number) {
    const monto = leerMonto(aportes[id] ?? '');
    if (monto <= 0) return;
    await aportarAMeta(db, id, monto);
    setAportes({ ...aportes, [id]: '' });
    recargar();
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      {metas.length === 0 && (
        <Text style={estilos.suave}>
          Aún no tienes metas. Crea una abajo y la tendremos en cuenta en tu reparto.
        </Text>
      )}

      {metas.map((m) => {
        const id = m.id as number;
        const cumplida = m.ahorrado >= m.montoObjetivo;
        return (
          <Tarjeta key={id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[estilos.texto, { fontWeight: '600' }]}>{m.nombre}</Text>
              <Text style={estilos.suave}>para {m.fechaLimite}</Text>
            </View>
            <View style={{ marginVertical: 8 }}>
              <BarraProgreso valor={m.ahorrado / m.montoObjetivo} />
            </View>
            <Text style={estilos.texto}>
              {formatearDinero(m.ahorrado)} de {formatearDinero(m.montoObjetivo)}
            </Text>
            <Text style={estilos.suave}>
              {cumplida
                ? '¡Meta cumplida! 🎉'
                : `Aparta ${formatearDinero(aporteMensualMeta(m))} al mes durante ${mesesHasta(m.fechaLimite)} meses.`}
            </Text>
            {!cumplida && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Campo
                    etiqueta="Aportar"
                    keyboardType="number-pad"
                    value={aportes[id] ?? ''}
                    onChangeText={(t) => setAportes({ ...aportes, [id]: t })}
                  />
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Boton texto="Sumar" onPress={() => aportar(id)} />
                </View>
              </View>
            )}
            <Text style={estilos.suave} onPress={() => borrarMeta(db, id).then(recargar)}>
              Borrar meta
            </Text>
          </Tarjeta>
        );
      })}

      <Text style={[estilos.titulo, { fontSize: 18, marginTop: 8 }]}>Nueva meta</Text>
      <Campo etiqueta="¿Para qué ahorras?" value={nombre} onChangeText={setNombre} placeholder="Ej. Viaje" />
      <Campo
        etiqueta="¿Cuánto necesitas?"
        keyboardType="number-pad"
        value={objetivo}
        onChangeText={setObjetivo}
      />
      <Campo
        etiqueta="¿Para cuándo? (AAAA-MM-DD)"
        value={fecha}
        onChangeText={setFecha}
        placeholder="2027-06-30"
      />
      <Boton texto="Crear meta" deshabilitado={!listo} onPress={crear} />
    </ScrollView>
  );
}
