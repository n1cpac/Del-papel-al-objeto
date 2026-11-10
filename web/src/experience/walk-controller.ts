import {
    DualGestureSource,
    KeyboardMouseSource,
    Script,
    Vec3
} from 'playcanvas';
import { isInsideGallery } from './room';

/**
 * Recorrido peatonal sin física: mantiene la altura del visitante y orienta el movimiento en el plano horizontal.
 */
export class WalkController extends Script {
    static scriptName = 'walkController';

    private readonly keyboardMouse = new KeyboardMouseSource();
    private readonly touchControls = new DualGestureSource('joystick-touch');
    private readonly right = new Vec3();
    private readonly forward = new Vec3();
    private readonly candidate = new Vec3();
    private readonly lastSafe = new Vec3();
    private yaw = 0;
    private pitch = 0;
    private stepPhase = 0;
    private bobWeight = 0;
    private readonly eyeHeight = 1.7;
    private readonly speed = 1.75;
    private readonly mobileSpeed = 1.65;
    private readonly lookSensitivity = 0.11;
    private readonly bobAmount = 0.018;
    private readonly bobRate = Math.PI * 3.6;

    initialize(): void {
        const canvas = this.app.graphicsDevice.canvas;
        this.keyboardMouse.attach(canvas);
        this.touchControls.attach(canvas);

        const angles = this.entity.getLocalEulerAngles();
        this.pitch = angles.x;
        this.yaw = angles.y;
        this.lastSafe.copy(this.entity.getPosition());

        this.touchControls.on('joystick:position:left', (position: number[]) => {
            this.app.fire('joystick:left', position[0], position[1], position[2], position[3]);
        });
    }

    update(dt: number): void {
        const { keyCode } = KeyboardMouseSource;
        const { key, button, mouse } = this.keyboardMouse.read();
        const { leftInput, rightInput } = this.touchControls.read();

        // Mirada: clic y arrastre en desktop; gesto táctil en la mitad derecha de la pantalla.
        if (button[0] > 0) {
            this.yaw -= mouse[0] * this.lookSensitivity;
            this.pitch = Math.max(-68, Math.min(68, this.pitch - mouse[1] * this.lookSensitivity));
        }
        this.yaw -= rightInput[0] * this.lookSensitivity;
        this.pitch = Math.max(-68, Math.min(68, this.pitch - rightInput[1] * this.lookSensitivity));
        this.entity.setLocalEulerAngles(this.pitch, this.yaw, 0);

        const keyboardX = (key[keyCode.D] - key[keyCode.A]) + (key[keyCode.RIGHT] - key[keyCode.LEFT]);
        const keyboardForward = (key[keyCode.W] - key[keyCode.S]) + (key[keyCode.UP] - key[keyCode.DOWN]);
        const touchX = leftInput[0];
        const touchForward = -leftInput[1];
        let moveX = keyboardX + touchX;
        let moveForward = keyboardForward + touchForward;
        const magnitude = Math.hypot(moveX, moveForward);
        if (magnitude > 1) {
            moveX /= magnitude;
            moveForward /= magnitude;
        }

        const moving = magnitude > 0.08;
        const walkSpeed = touchX !== 0 || touchForward !== 0 ? this.mobileSpeed : this.speed;
        const radians = this.yaw * Math.PI / 180;
        this.forward.set(-Math.sin(radians), 0, -Math.cos(radians));
        this.right.set(Math.cos(radians), 0, -Math.sin(radians));

        const deltaX = (this.right.x * moveX + this.forward.x * moveForward) * walkSpeed * dt;
        const deltaZ = (this.right.z * moveX + this.forward.z * moveForward) * walkSpeed * dt;
        const current = this.entity.getPosition();
        this.candidate.set(current.x + deltaX, this.eyeHeight, current.z + deltaZ);

        if (isInsideGallery(this.candidate)) {
            this.entity.setPosition(this.candidate);
        } else {
            // Permite deslizar a lo largo de los muros y evita atravesar el ángulo interior de la L.
            this.candidate.set(current.x + deltaX, this.eyeHeight, current.z);
            if (isInsideGallery(this.candidate)) {
                this.entity.setPosition(this.candidate);
            } else {
                this.candidate.set(current.x, this.eyeHeight, current.z + deltaZ);
                if (isInsideGallery(this.candidate)) {
                    this.entity.setPosition(this.candidate);
                }
            }
        }

        const position = this.entity.getPosition();
        if (isInsideGallery(position)) {
            this.lastSafe.copy(position);
        } else {
            this.entity.setPosition(this.lastSafe);
        }

        if (moving) {
            this.stepPhase += dt * this.bobRate;
        }
        this.bobWeight += ((moving ? 1 : 0) - this.bobWeight) * Math.min(1, dt * 9);
        const bob = Math.sin(this.stepPhase) * this.bobAmount * this.bobWeight;
        this.entity.setPosition(this.entity.getPosition().x, this.eyeHeight + bob, this.entity.getPosition().z);
    }

    destroy(): void {
        this.keyboardMouse.destroy();
        this.touchControls.destroy();
    }
}

