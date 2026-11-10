import { AppBase, Color, Entity } from 'playcanvas';
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
    camera.setPosition(8.05, 1.7, 9.15);
    camera.setLocalEulerAngles(0, -19, 0);
    camera.addComponent('script');
    camera.script.create(WalkController);

    return camera;
}
