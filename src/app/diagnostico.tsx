import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Boton, Campo, estilos, formatearDinero, leerMonto, Tarjeta } from '../components/ui';
import { guardarPerfil, leerPerfil } from '../db/basedatos';
import type { Deuda, EstabilidadIngreso } from '../domain/tipos';

const PASOS = ['ingreso', 'estabilidad', 'esenciales', 'dependientes', 'fondo', 'deudas'] as const;

export default function Diagnostico() {
  const db = useSQLiteContext();
  const [paso, setPaso] = useState(0);
  const [ingreso, setIngreso] = useState('');
  const [estabilidad, setEstabilidad] = useState<EstabilidadIngreso>('fijo');
  const [esenciales, setEsenciales] = useState('');
  const [dependientes, setDependientes] = useState('0');
  const [fondo, setFondo] = useState('');
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [nuevaDeuda, setNuevaDeuda] = useState({ nombre: '', saldo: '', cuota: '', tasa: '' });

  // Si ya hay un diagnóstico, se precarga para editarlo.
  useEffect(() => {
    leerPerfil(db).then((p) => {
      if (!p) return;
      setIngreso(String(p.ingresoMensual));
      setEstabilidad(p.estabilidad);
      setEsenciales(String(p.gastosEsenciales));
      setDependientes(String(p.dependientes));
      setFondo(String(p.fondoEmergenciaActual));
      setDeudas(p.deudas);
    });
  }, [db]);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const puedeSeguir = actual !== 'ingreso' || leerMonto(ingreso) > 0;

  async function terminar() {
    await guardarPerfil(db, {
      ingresoMensual: leerMonto(ingreso),
      estabilidad,
      gastosEsenciales: leerMonto(esenciales),
      dependientes: leerMonto(dependientes),
      fondoEmergenciaActual: leerMonto(fondo),
      deudas,
      metas: [],
    });
    setPaso(0);
    router.replace('/');
  }

  function agregarDeuda() {
    if (!nuevaDeuda.nombre || leerMonto(nuevaDeuda.saldo) === 0) return;
    setDeudas([
      ...deudas,
      {
        nombre: nuevaDeuda.nombre,
        saldo: leerMonto(nuevaDeuda.saldo),
        cuotaMinima: leerMonto(nuevaDeuda.cuota),
        tasaAnual: Number(nuevaDeuda.tasa.replace(',', '.')) || 0,
      },
    ]);
    setNuevaDeuda({ nombre: '', saldo: '', cuota: '', tasa: '' });
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.suave}>
        Pregunta {paso + 1} de {PASOS.length}
      </Text>

      {actual === 'ingreso' && (
        <Campo
          etiqueta="¿Cuánto dinero te entra al mes, en promedio?"
          keyboardType="number-pad"
          value={ingreso}
          onChangeText={setIngreso}
          placeholder="Ej. 2500000"
          autoFocus
        />
      )}

      {actual === 'estabilidad' && (
        <View style={{ gap: 8 }}>
          <Text style={estilos.texto}>¿Tu ingreso es fijo o cambia de un mes a otro?</Text>
          <Boton
            texto="Fijo (salario)"
            secundario={estabilidad !== 'fijo'}
            onPress={() => setEstabilidad('fijo')}
          />
          <Boton
            texto="Variable (independiente, comisiones)"
            secundario={estabilidad !== 'variable'}
            onPress={() => setEstabilidad('variable')}
          />
        </View>
      )}

      {actual === 'esenciales' && (
        <Campo
          etiqueta="¿Cuánto gastas al mes en lo obligatorio? (arriendo, servicios, mercado, transporte; sin contar deudas)"
          keyboardType="number-pad"
          value={esenciales}
          onChangeText={setEsenciales}
          autoFocus
        />
      )}

      {actual === 'dependientes' && (
        <Campo
          etiqueta="¿Cuántas personas dependen de tu dinero? (hijos, padres, pareja)"
          keyboardType="number-pad"
          value={dependientes}
          onChangeText={setDependientes}
          autoFocus
        />
      )}

      {actual === 'fondo' && (
        <Campo
          etiqueta="¿Cuánto tienes ahorrado para emergencias hoy? (0 si nada)"
          keyboardType="number-pad"
          value={fondo}
          onChangeText={setFondo}
          autoFocus
        />
      )}

      {actual === 'deudas' && (
        <View style={{ gap: 8 }}>
          <Text style={estilos.texto}>
            ¿Tienes deudas? Agrega cada una (tarjetas, préstamos, créditos). Si no tienes, sigue.
          </Text>
          {deudas.map((d, i) => (
            <Tarjeta key={`${d.nombre}-${i}`}>
              <Text style={estilos.texto}>
                {d.nombre}: {formatearDinero(d.saldo)} · cuota {formatearDinero(d.cuotaMinima)} ·{' '}
                {d.tasaAnual} % anual
              </Text>
              <Text
                style={[estilos.suave, { marginTop: 4 }]}
                onPress={() => setDeudas(deudas.filter((_, j) => j !== i))}
              >
                Quitar
              </Text>
            </Tarjeta>
          ))}
          <Campo
            etiqueta="Nombre"
            value={nuevaDeuda.nombre}
            onChangeText={(nombre) => setNuevaDeuda({ ...nuevaDeuda, nombre })}
            placeholder="Ej. Tarjeta de crédito"
          />
          <Campo
            etiqueta="Saldo pendiente"
            keyboardType="number-pad"
            value={nuevaDeuda.saldo}
            onChangeText={(saldo) => setNuevaDeuda({ ...nuevaDeuda, saldo })}
          />
          <Campo
            etiqueta="Cuota mínima mensual"
            keyboardType="number-pad"
            value={nuevaDeuda.cuota}
            onChangeText={(cuota) => setNuevaDeuda({ ...nuevaDeuda, cuota })}
          />
          <Campo
            etiqueta="Tasa de interés anual (%)"
            keyboardType="decimal-pad"
            value={nuevaDeuda.tasa}
            onChangeText={(tasa) => setNuevaDeuda({ ...nuevaDeuda, tasa })}
            placeholder="Ej. 28"
          />
          <Boton secundario texto="Agregar deuda" onPress={agregarDeuda} />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {paso > 0 && (
          <View style={{ flex: 1 }}>
            <Boton secundario texto="Atrás" onPress={() => setPaso(paso - 1)} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Boton
            texto={esUltimo ? 'Ver mi plan' : 'Siguiente'}
            deshabilitado={!puedeSeguir}
            onPress={esUltimo ? terminar : () => setPaso(paso + 1)}
          />
        </View>
      </View>
    </ScrollView>
  );
}
