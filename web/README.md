# Del papel al objeto · Aplicación web

Sala 3D construida con PlayCanvas Engine, TypeScript y Vite. Incluye un blockout de 144 m² en L (brazo de exposición de 18 × 6 m y brazo de entrada de 6 × 6 m) con estaciones y piezas provisionales junto al perímetro, una cámara peatonal a 1,70 m y controles de recorrido para escritorio y móvil. El espacio central queda abierto para circular.

La escena usa formas geométricas temporales; los GLB, los textos curatoriales finales y las interacciones de cada estación se integrarán después.

## Requisitos

- Node.js 22.23.2 o posterior.
- npm 10 o posterior.

## Inicio local

Desde esta carpeta (`web/`):

```powershell
npm install
npm run dev
```

Vite abre la aplicación en `http://localhost:5173`. La escena inicia cerca de la entrada y mira hacia la estación B. El Inspector de PlayCanvas se retiró del proyecto para mantener limpia la vista de la exposición.

## Controles

- **Escritorio:** WASD o flechas para moverse; clic sostenido y arrastre del ratón para mirar.
- **Móvil:** joystick virtual del lado izquierdo para moverse; arrastre táctil en el lado derecho para mirar. Al primer toque la experiencia pasa a pantalla completa (se oculta la barra del navegador) y se bloquea la vista horizontal; en vertical un aviso tapa la sala y pide girar el teléfono (tocarlo también fuerza la horizontal en Android); deslizar hacia abajo desde el borde superior la vuelve a mostrar, y el siguiente toque sobre la sala la oculta de nuevo.
- La cámara conserva una altura ocular de 1,70 m, se mueve en plano horizontal con velocidad peatonal y un balanceo muy sutil al caminar; restringe el recorrido a la sala y sus umbrales.
- **Piezas:** al acercarse (menos de 2,8 m) y centrar una pieza en la vista aparece su nombre y el botón «Interactuar». Al interactuar (clic/toque en el botón, o E / Enter) se entra en **modo de inspección**: la pieza pasa al centro de la pantalla, el fondo se desenfoca y se abre su cédula. La pieza se gira arrastrando y se acerca o aleja con la rueda, el pellizco o + / −; siempre permanece centrada. En escritorio se puede seguir caminando con WASD / flechas (la pieza acompaña la vista) y la inspección se cierra sola al alejarse más de 3,2 m del pedestal; también con Esc o el botón ×. En móvil el recorrido queda en pausa, se oculta el logo, la pieza se centra en el espacio libre a la izquierda de la cédula (más compacta) y se sale con ×.
- **Depuración:** tecla º (Backquote) o `?debug` en la URL. Muestra una cuadrícula de 1 m en el piso (eje X rojo en x = 0, eje Z azul en z = 0), una mira central y la posición, el rumbo (0° = hacia el muro del fondo) y el punto del piso al que apunta la mira. Clic en la lectura para copiarla.
- El orden A → B → C → D → E es una guía; el movimiento dentro de la sala es libre.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Inicia el servidor local. |
| `npm run build` | Genera el sitio estático en `dist/`. |
| `npm run start` | Sirve una vista previa de producción. |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run fmt` | Comprueba el formato. |

## Estructura

```text
web/
├── public/
│   ├── models/       # Modelos GLB optimizados
│   └── textures/     # Texturas externas, si se necesitan
├── src/
│   ├── experience/
│   │   ├── controls.ts # Inicialización de la cámara peatonal
│   │   ├── debug.ts    # Cuadrícula y lectura de coordenadas (º)
│   │   ├── hud.ts      # Indicaciones y joystick móvil
│   │   ├── inspect.ts  # Modo de inspección (desenfoque, giro y zoom)
│   │   ├── mobile-fullscreen.ts # Pantalla completa en móvil y gesto para salir
│   │   ├── pieces.ts   # Datos de las piezas (ficha de colección)
│   │   ├── piece-focus.ts # Etiqueta al centrar una pieza y cédula
│   │   ├── walk-controller.ts # Marcha horizontal, mirada y head bob
│   │   └── room.ts     # Blockout, estaciones y piezas provisionales
│   ├── main.ts         # Inicio de PlayCanvas y composición
│   └── starter.css     # Interfaz adaptable
├── index.html
├── package.json
└── vite.config.ts
```

Los recursos de `public/` se sirven desde rutas relativas (`./models/archivo.glb`) para que la compilación pueda alojarse en un subdirectorio. Mantén los modelos y texturas optimizados para web y dispositivos móviles.

## Documentación general

El README principal del repositorio contiene el guion de experiencia, el plano cenital, los criterios museográficos y el plan de trabajo: [`../README.md`](../README.md).

## Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-10 | Sala base navegable (blockout de 84 m², cinco estaciones con piezas provisionales), cámara peatonal a 1,70 m, controles de escritorio y móvil, y logo. |
| 2026-11-10 | Corrección del recorrido en escritorio: el teclado y el ratón ahora mueven y giran la cámara de forma continua mientras se mantienen pulsados (antes solo reaccionaban en el primer fotograma). Ajustes menores de tipos y lint. |
| 2026-11-10 | Enfoque de piezas: al acercarse a una pieza y centrarla en la vista aparece a su lado su nombre y el botón «Interactuar» (o tecla E), que abre su cédula con los datos de la ficha de colección. El tomo de manga se rotula como adquisición propuesta. |
| 2026-11-10 | La cédula de una pieza se cierra automáticamente al alejarse físicamente de ella (más de 3,2 m), pensado para facilitar el uso en móvil. |
| 2026-11-10 | Sala ampliada a 144 m²: el muro del fondo se retira 2 m (brazo de exposición de 6 m de profundidad), la sala se alarga 6 m hacia el oeste y las piezas se separan (2,4–3,4 m entre sí). Las posiciones de las piezas viven solo en `pieces.ts`. |
| 2026-11-10 | Modo de depuración (tecla º o `?debug`): cuadrícula de 1 m en el piso, mira central y lectura copiable de posición, rumbo y punto apuntado, para comunicar ubicaciones en la sala. |
| 2026-11-10 | Modo de inspección de piezas: al interactuar, la pieza se toma del pedestal y queda centrada frente a la cámara, con el fondo desenfocado (profundidad de campo) y viñeta; se gira y acerca con ratón, teclado o gestos táctiles, y Esc / × devuelve al recorrido. |
| 2026-11-10 | Inspección en escritorio sin bloquear el movimiento: WASD / flechas siguen caminando durante la inspección y alejarse más de 3,2 m la cierra automáticamente. Se retira el giro de la pieza con teclado (ahora solo arrastre); en móvil se mantiene la pausa. |
| 2026-11-10 | Móvil: la barra del navegador se oculta (pantalla completa) al primer toque sobre la sala y reaparece al deslizar hacia abajo desde el borde superior. |
| 2026-11-10 | Inspección en móvil: se oculta el logo, la pieza se desplaza para quedar centrada en el espacio a la izquierda de la cédula y la cédula se compacta (≈40 % del ancho, máx. 290 px). |
| 2026-11-10 | Móvil: se fuerza la vista horizontal. Al entrar en pantalla completa se bloquea la orientación (Android) y, si el teléfono está en vertical, un aviso tapa la sala y pide girarlo. |
| 2026-11-10 | Textos, cédula, guías e imágenes ya no se pueden seleccionar ni arrastrar, y se quita el resaltado al tocar en móvil, para que la interacción no deje elementos marcados. |
