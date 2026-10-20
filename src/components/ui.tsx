import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export const colores = {
  fondo: '#F6F8F5',
  tarjeta: '#FFFFFF',
  texto: '#1B2420',
  suave: '#5C6B64',
  primario: '#2E7D5B',
  borde: '#DDE3DF',
  alerta: '#B3261E',
};

export function formatearDinero(valor: number): string {
  return `$${Math.round(valor).toLocaleString('es')}`;
}

/** Convierte lo que escribe la persona ("1.500.000", "1500000") en número. */
export function leerMonto(texto: string): number {
  const limpio = texto.replace(/[^\d]/g, '');
  return limpio ? Number(limpio) : 0;
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return <View style={estilos.tarjeta}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Boton({
  texto,
  onPress,
  secundario,
  deshabilitado,
}: {
  texto: string;
  onPress: () => void;
  secundario?: boolean;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={[
        estilos.boton,
        secundario && estilos.botonSecundario,
        deshabilitado && { opacity: 0.4 },
      ]}
    >
      <Text style={[estilos.botonTexto, secundario && { color: colores.primario }]}>{texto}</Text>
    </Pressable>
  );
}

export function Campo({ etiqueta, ...props }: { etiqueta: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput placeholderTextColor={colores.suave} style={estilos.campo} {...props} />
    </View>
  );
}

export function BarraProgreso({ valor }: { valor: number }) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <View style={estilos.barra}>
      <View style={[estilos.barraRelleno, { width: `${pct}%` }]} />
    </View>
  );
}

export const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, gap: 12 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.texto },
  texto: { fontSize: 15, color: colores.texto },
  suave: { fontSize: 13, color: colores.suave },
  etiqueta: { fontSize: 14, color: colores.suave, marginBottom: 4 },
  campo: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colores.tarjeta,
    color: colores.texto,
  },
  boton: {
    backgroundColor: colores.primario,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colores.primario,
  },
  botonTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  barra: { height: 8, backgroundColor: colores.borde, borderRadius: 4, overflow: 'hidden' },
  barraRelleno: { height: 8, backgroundColor: colores.primario },
});
