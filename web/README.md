# Del papel al objeto · Aplicación web

Sala 3D construida con PlayCanvas Engine, TypeScript y Vite. Incluye un blockout de 84 m² con estaciones y piezas provisionales junto al perímetro, una cámara peatonal a 1,70 m y controles de recorrido para escritorio y móvil. El espacio central queda abierto para circular.

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
- **Móvil:** joystick virtual del lado izquierdo para moverse; arrastre táctil en el lado derecho para mirar.
- La cámara conserva una altura ocular de 1,70 m, se mueve en plano horizontal con velocidad peatonal y un balanceo muy sutil al caminar; restringe el recorrido a la sala y sus umbrales.
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
│   │   ├── hud.ts      # Indicaciones y joystick móvil
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
