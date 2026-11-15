import type { AppBase, Entity } from 'playcanvas';
import { Quat, Vec3 } from 'playcanvas';

/** Etiqueta de los huesos que rebotan; se conserva al clonar la pieza para inspeccionarla. */
export const springTag = 'muelle';
/** Etiquetas adicionales para huesos que deben desplazarse menos: firme (coletas) y rígido (falda y mangas). */
export const firmSpringTag = 'muelle-firme';
export const stiffSpringTag = 'muelle-rigido';

const stiffness = 90;
const damping = 9;
/** Longitud del péndulo de cada hueso, en unidades locales del modelo, sobre su eje Y (el del hueso en glTF). */
const reach = 0.04;
/** Desvío máximo respecto al reposo, como fracción de la longitud (≈ 35°). */
const maxSwing = 0.7;
/** Multiplicadores de rigidez y de desvío máximo por nivel: a más rigidez y menos desvío, menos movimiento. */
const levels = {
    normal: { stiffness: 1, swing: 1 },
    firm: { stiffness: 1.5, swing: 0.75 },
    stiff: { stiffness: 2.5, swing: 0.5 }
};
const maxStep = 1 / 30;

type Spring = {
    bone: Entity;
    level: { stiffness: number; swing: number };
    restRotation: Quat;
    tip: Vec3;
    velocity: Vec3;
};

const restWorld = new Quat();
const swing = new Quat();
const target = new Vec3();
const restDir = new Vec3();
const dir = new Vec3();
const axis = new Vec3();
const scale = new Vec3();

/**
 * Hace que los huesos etiquetados bajo `root` sigan con retraso el movimiento de la pieza y oscilen hasta
 * volver a su pose de reposo. Devuelve la función que lo detiene, o `null` si no hay huesos etiquetados.
 */
export function attachSpringBones(app: AppBase, root: Entity): (() => void) | null {
    // findByTag recorre en profundidad: cada padre queda antes que sus hijos, como exige la cadena.
    const springs: Spring[] = (root.findByTag(springTag) as Entity[]).map((bone) => ({
        bone,
        level: bone.tags.has(stiffSpringTag)
            ? levels.stiff
            : bone.tags.has(firmSpringTag)
              ? levels.firm
              : levels.normal,
        restRotation: bone.getLocalRotation().clone(),
        tip: new Vec3(),
        velocity: new Vec3()
    }));
    if (springs.length === 0) {
        return null;
    }
    let started = false;

    const update = (dt: number): void => {
        const step = Math.min(dt, maxStep);
        for (const { bone, level, restRotation, tip, velocity } of springs) {
            const k = stiffness * level.stiffness;
            const limit = maxSwing * level.swing;
            const parent = bone.parent;
            if (!parent) {
                continue;
            }
            const origin = bone.getPosition();
            const length = reach * parent.getWorldTransform().getScale(scale).x;
            restWorld.mul2(parent.getRotation(), restRotation);
            restWorld.transformVector(Vec3.UP, restDir);
            target.copy(restDir).mulScalar(length).add(origin);

            if (!started) {
                tip.copy(target);
                velocity.set(0, 0, 0);
            }
            // Muelle amortiguado hacia el reposo (Euler semi-implícito).
            velocity.x += ((target.x - tip.x) * k - velocity.x * damping) * step;
            velocity.y += ((target.y - tip.y) * k - velocity.y * damping) * step;
            velocity.z += ((target.z - tip.z) * k - velocity.z * damping) * step;
            tip.add(dir.copy(velocity).mulScalar(step));

            // Limita el desvío y mantiene la punta a la longitud del hueso.
            dir.sub2(tip, target);
            const offset = dir.length();
            if (offset > limit * length) {
                tip.copy(dir.mulScalar((limit * length) / offset).add(target));
            }
            dir.sub2(tip, origin).normalize();
            tip.copy(dir).mulScalar(length).add(origin);

            // Giro mínimo que lleva la dirección de reposo a la actual.
            axis.cross(restDir, dir);
            swing.set(axis.x, axis.y, axis.z, 1 + restDir.dot(dir)).normalize();
            bone.setRotation(swing.mul(restWorld));
        }
        started = true;
    };

    app.on('update', update);
    return () => app.off('update', update);
}
