# Kieto

App móvil **gratuita y de código abierto** para organizar tus finanzas sin dolores de cabeza.

No hay una regla de ahorro que sirva para todos. Kieto te hace unas preguntas cortas sobre tu situación (ingreso, gastos fijos, deudas, fondo de emergencia, quién depende de ti) y te recomienda **cómo repartir tu dinero según tu caso**. Después te ayuda a cumplirlo: registras gastos en segundos, sigues tus metas y (pronto) descubres los *gastos hormiga* que te frenan.

> Kieto es una herramienta educativa. No es asesoría financiera profesional.

## Qué hace hoy (Hito 1)

- **Diagnóstico:** 6 preguntas, una por pantalla, editables cuando cambie tu situación.
- **Reparto personalizado:** sigue el orden de prioridades más usado en educación financiera:
  1. Gastos esenciales y cuotas mínimas.
  2. Mini fondo de emergencia (1 mes de gastos).
  3. Deudas caras (tasa anual de 15 % o más), la más cara primero.
  4. Fondo de emergencia completo: 3 meses con ingreso fijo, 6 con ingreso variable, +1 por cada persona a cargo (máximo 9).
  5. Metas de ahorro con fecha.
  6. Inversión a largo plazo.

  Cada bolsillo explica *por qué* recibe ese monto, y la app estima cuántos meses te faltan para pasar a la siguiente etapa.
- **Registro rápido** de gastos e ingresos por categoría, y lo que llevas gastado en cada bolsillo del mes.
- **Metas:** cuánto apartar al mes para llegar a tiempo, con aportes y barra de progreso.
- Todo se guarda **solo en tu teléfono** (SQLite). Sin cuentas ni servidores.

Las reglas del motor están en [`src/domain/reglas.json`](src/domain/reglas.json) y explicadas en [`docs/reglas.md`](docs/reglas.md). Si crees que alguna debería cambiar, abre un issue.

## Próximos hitos

- **Hito 2:** detector de gastos hormiga y recálculo automático del reparto.
- **Hito 3:** test de tolerancia al riesgo y evaluación educativa de inversión (fondos indexados, acciones, cripto con tope), exportar CSV y primera versión publicada.

## Probarlo

Necesitas Node 22 y la app **Expo Go** en tu teléfono.

```bash
npm install
npm start
```

Escanea el código QR con Expo Go.

## Contribuir

```bash
npm test          # pruebas del motor de reparto
npm run typecheck # revisión de tipos
```

- La lógica de negocio vive en `src/domain/` y debe tener pruebas.
- Las pantallas viven en `src/app/` (Expo Router: cada archivo es una pantalla).
- El acceso a datos vive en `src/db/`.
- Usa `npx expo install <paquete>` para agregar dependencias compatibles con el SDK de Expo.

## Licencia

[MIT](LICENSE)
