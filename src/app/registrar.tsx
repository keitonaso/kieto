import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Boton, Campo, colores, estilos, formatearDinero, leerMonto } from '../components/ui';
import {
  agregarMovimiento,
  borrarMovimiento,
  listarMovimientosDelMes,
  type Movimiento,
  type TipoMovimiento,
} from '../db/basedatos';
import { buscarCategoria, CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../domain/categorias';

export default function Registrar() {
  const db = useSQLiteContext();
  const [tipo, setTipo] = useState<TipoMovimiento>('gasto');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const mes = new Date().toISOString().slice(0, 7);
  const recargar = useCallback(() => {
    listarMovimientosDelMes(db, mes).then(setMovimientos);
  }, [db, mes]);
  useFocusEffect(recargar);

  const categorias = tipo === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;
  const listo = leerMonto(monto) > 0 && categoria !== null;

  async function guardar() {
    if (!listo || !categoria) return;
    await agregarMovimiento(db, {
      tipo,
      monto: leerMonto(monto),
      categoria,
      nota: nota.trim() || null,
      fecha: new Date().toISOString().slice(0, 10),
    });
    setMonto('');
    setNota('');
    setCategoria(null);
    recargar();
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['gasto', 'ingreso'] as const).map((t) => (
          <View key={t} style={{ flex: 1 }}>
            <Boton
              texto={t === 'gasto' ? 'Gasto' : 'Ingreso'}
              secundario={tipo !== t}
              onPress={() => {
                setTipo(t);
                setCategoria(null);
              }}
            />
          </View>
        ))}
      </View>

      <Campo
        etiqueta="Monto"
        keyboardType="number-pad"
        value={monto}
        onChangeText={setMonto}
        placeholder="0"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categorias.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityState={{ selected: categoria === c.id }}
            onPress={() => setCategoria(c.id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: categoria === c.id ? colores.primario : colores.borde,
              backgroundColor: categoria === c.id ? '#E3F1EA' : colores.tarjeta,
            }}
          >
            <Text style={estilos.texto}>
              {c.icono} {c.nombre}
            </Text>
          </Pressable>
        ))}
      </View>

      <Campo etiqueta="Nota (opcional)" value={nota} onChangeText={setNota} placeholder="Ej. café" />
      <Boton texto="Guardar" deshabilitado={!listo} onPress={guardar} />

      <Text style={[estilos.titulo, { fontSize: 18, marginTop: 8 }]}>Movimientos del mes</Text>
      {movimientos.length === 0 && <Text style={estilos.suave}>Aún no hay movimientos.</Text>}
      {movimientos.map((m) => {
        const cat = buscarCategoria(m.categoria);
        return (
          <View
            key={m.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colores.borde,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.texto}>
                {cat?.icono} {cat?.nombre ?? m.categoria}
                {m.nota ? ` · ${m.nota}` : ''}
              </Text>
              <Text style={estilos.suave}>{m.fecha}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  estilos.texto,
                  { color: m.tipo === 'gasto' ? colores.alerta : colores.primario },
                ]}
              >
                {m.tipo === 'gasto' ? '-' : '+'}
                {formatearDinero(m.monto)}
              </Text>
              <Text
                style={estilos.suave}
                onPress={() => borrarMovimiento(db, m.id).then(recargar)}
              >
                Borrar
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
