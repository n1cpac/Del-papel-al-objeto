import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    ScriptComponentSystem,
    ScriptHandler,
    TextureHandler,
    createGraphicsDevice
} from 'playcanvas';

import './starter.css';
import { createVisitorCamera } from './experience/controls';
import { mountDebug } from './experience/debug';
import { mountHud } from './experience/hud';
import { createInspector } from './experience/inspect';
import { mountPieceFocus } from './experience/piece-focus';
import { buildRoom } from './experience/room';
import { mountStartScreen } from './experience/start-screen';

const canvas = document.getElementById('application-canvas');
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No se encontró el canvas de la exposición.');
}

const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(
    window.devicePixelRatio || 1,
    window.matchMedia('(pointer: coarse)').matches ? 1.4 : 1.6
);

const createOptions = new AppOptions();
createOptions.graphicsDevice = device;
createOptions.componentSystems = [
    RenderComponentSystem,
    CameraComponentSystem,
    LightComponentSystem,
    ScriptComponentSystem
];
createOptions.resourceHandlers = [TextureHandler, ContainerHandler, ScriptHandler];

const app = new AppBase(canvas);
app.init(createOptions);
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const resize = (): void => {
    app.resizeCanvas();
};
window.addEventListener('resize', resize);
app.on('destroy', () => window.removeEventListener('resize', resize));

app.scene.ambientLight.set(0.62, 0.62, 0.62);

const light = new Entity('Luz principal');
light.addComponent('light', { type: 'directional', color: Color.WHITE, intensity: 1.05, castShadows: false });
light.setLocalEulerAngles(48, 28, 0);
app.root.addChild(light);

app.start();
const pedestals = buildRoom(app);
const camera = createVisitorCamera(app);
mountHud(app);
mountStartScreen(app, camera);
mountPieceFocus(app, camera, pedestals, createInspector(app, camera));
mountDebug(app, camera);
