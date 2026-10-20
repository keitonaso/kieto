import { Tabs } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { colores } from '../components/ui';
import { migrar, NOMBRE_BD } from '../db/basedatos';

export default function Layout() {
  return (
    <SQLiteProvider databaseName={NOMBRE_BD} onInit={migrar}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colores.primario,
          headerStyle: { backgroundColor: colores.fondo },
          sceneStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Mi plan', tabBarLabel: 'Plan' }} />
        <Tabs.Screen name="registrar" options={{ title: 'Registrar' }} />
        <Tabs.Screen name="metas" options={{ title: 'Metas' }} />
        <Tabs.Screen name="diagnostico" options={{ title: 'Diagnóstico', href: null }} />
      </Tabs>
    </SQLiteProvider>
  );
}
