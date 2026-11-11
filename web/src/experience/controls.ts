import type { AppBase } from 'playcanvas';
import { Color, Entity } from 'playcanvas';

import { WalkController } from './walk-controller';

export function createVisitorCamera(app: AppBase): Entity {
    const camera = new Entity('visitor-camera');
    camera.addComponent('camera', {
        clearColor: new Color().fromString('#ebe9e2'),
        fov: 68,
        nearClip: 0.08,
        farClip: 100
    });
    app.root.addChild(camera);
    // Aparición en el eje del brazo de entrada (x = 9): sobre la guía del suelo y frente al centro de la puerta.
    camera.setPosition(9, 1.7, 9.15);
    camera.setLocalEulerAngles(0, 0, 0);
    camera.addComponent('script');
    camera.script?.create(WalkController);

    return camera;
}
