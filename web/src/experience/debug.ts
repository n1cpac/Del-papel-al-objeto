import type { AppBase, Entity } from 'playcanvas';
import { Color, Vec3 } from 'playcanvas';

// Límites de la huella de la sala (ver room.ts).
const minX = -6;
const maxX = 12;
const minZ = -2;
const maxZ = 10;
const gridY = 0.01;

/**
 * Modo de depuración para comunicar ubicaciones: cuadrícula de 1 m en el piso (eje X rojo, eje Z azul),
 * mira central y lectura de posición, rumbo y punto del piso al que apunta la mira.
 * Se activa con la tecla º/` (Backquote) o con `?debug` en la URL; clic en la lectura la copia.
 */
export function mountDebug(app: AppBase, camera: Entity): void {
    const readout = document.querySelector<HTMLElement>('#debug-readout');
    const crosshair = document.querySelector<HTMLElement>('#debug-crosshair');
    if (!readout || !crosshair) {
        throw new Error('Falta la interfaz de depuración.');
    }

    const positions: Vec3[] = [];
    const colors: Color[] = [];
    const minor = new Color(0.35, 0.4, 0.42);
    for (let x = minX; x <= maxX; x++) {
        const color = x === 0 ? Color.RED : minor;
        positions.push(new Vec3(x, gridY, minZ), new Vec3(x, gridY, maxZ));
        colors.push(color, color);
    }
    for (let z = minZ; z <= maxZ; z++) {
        const color = z === 0 ? Color.BLUE : minor;
        positions.push(new Vec3(minX, gridY, z), new Vec3(maxX, gridY, z));
        colors.push(color, color);
    }

    let enabled = new URLSearchParams(location.search).has('debug');
    const setEnabled = (value: boolean): void => {
        enabled = value;
        readout.hidden = !value;
        crosshair.hidden = !value;
    };
    setEnabled(enabled);

    const onKey = (event: KeyboardEvent): void => {
        if (event.code === 'Backquote') {
            setEnabled(!enabled);
        }
    };
    window.addEventListener('keydown', onKey);
    readout.addEventListener('click', () => {
        void navigator.clipboard?.writeText(readout.textContent ?? '');
        readout.dataset.copied = 'true';
        setTimeout(() => delete readout.dataset.copied, 900);
    });

    const f = (value: number): string => value.toFixed(2);
    const onUpdate = (): void => {
        if (!enabled) {
            return;
        }
        app.drawLines(positions, colors);

        const eye = camera.getPosition();
        const forward = camera.forward;
        // Desde el vector de mirada: los Euler del motor se descomponen raro al pasar de ±90°. 0° = hacia -z (muro del fondo).
        const yaw = (Math.atan2(-forward.x, -forward.z) * 180) / Math.PI;
        const pitch = (Math.asin(forward.y) * 180) / Math.PI;
        // Punto del piso bajo la mira: intersección del rayo central con y = 0.
        const aim =
            forward.y < -0.01
                ? `x ${f(eye.x - (forward.x * eye.y) / forward.y)} · z ${f(eye.z - (forward.z * eye.y) / forward.y)}`
                : 'sin piso (mira al horizonte)';
        readout.textContent = `Posición: x ${f(eye.x)} · z ${f(eye.z)} | Rumbo: ${yaw.toFixed(0)}° · inclinación ${pitch.toFixed(0)}° | Mira al piso: ${aim}`;
    };
    app.on('update', onUpdate);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        window.removeEventListener('keydown', onKey);
    });
}
