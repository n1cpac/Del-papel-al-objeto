import type { AppBase, LightComponent, RenderComponent } from 'playcanvas';
import { BoundingBox, CameraFrame, Entity, Layer, Quat, Vec3 } from 'playcanvas';

import { WalkController } from './walk-controller';

const degreesPerPixel = 0.4;
const keyZoomFactor = 1.12;

export type Inspector = {
    /** `rotatable` en falso deja la pieza fija: solo se acerca o aleja. */
    open(pedestal: Entity, rotatable?: boolean): void;
    close(): void;
};

/**
 * Modo de inspección: copia la pieza frente a la cámara, la mantiene centrada, desenfoca el fondo con
 * profundidad de campo y permite girarla (arrastre) y acercarla (rueda, pellizco, + / -).
 */
export function createInspector(app: AppBase, cameraEntity: Entity): Inspector {
    const camera = cameraEntity.camera;
    const walk = cameraEntity.script?.get(WalkController);
    if (!camera || !(walk instanceof WalkController)) {
        throw new Error('La inspección necesita la cámara del visitante.');
    }
    const canvas = app.graphicsDevice.canvas;
    // Mismo corte que el CSS de móvil (starter.css).
    const compactLayout = window.matchMedia('(pointer: coarse), (max-width: 650px)');
    const touchCapable = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

    // Post-proceso solo activo durante la inspección: el recorrido normal no paga su costo.
    const frame = new CameraFrame(app, camera);
    frame.rendering.toneMapping = camera.toneMapping;
    frame.rendering.samples = 4;
    frame.dof.enabled = true;
    frame.dof.highQuality = true;
    frame.dof.blurRadius = 7;
    frame.vignette.intensity = 0.55;
    frame.vignette.inner = 0.35;
    frame.vignette.outer = 1.1;
    // La pieza no está en la imagen principal (ver capa de inspección): se desenfoca toda la sala, cerca o lejos.
    frame.dof.focusDistance = 0;
    frame.dof.focusRange = 0.6;
    frame.update();
    frame.enabled = false;

    // La pieza inspeccionada se dibuja en su propia capa con una segunda cámara, después de la escena y con la
    // profundidad limpia: ningún muro puede taparla y queda nítida sobre el fondo desenfocado.
    const inspectLayer = new Layer({ name: 'Inspección' });
    app.scene.layers.push(inspectLayer);
    for (const light of app.root.findComponents('light') as LightComponent[]) {
        light.layers = [...light.layers, inspectLayer.id];
    }
    const overlay = new Entity('Cámara de inspección');
    overlay.addComponent('camera', {
        layers: [inspectLayer.id],
        clearColorBuffer: false,
        clearDepthBuffer: true,
        priority: camera.priority + 1,
        fov: camera.fov,
        nearClip: camera.nearClip,
        farClip: camera.farClip,
        toneMapping: camera.toneMapping,
        gammaCorrection: camera.gammaCorrection
    });
    overlay.enabled = false;
    // Hija de la cámara del visitante: comparte posición, giro y balanceo al caminar.
    cameraEntity.addChild(overlay);

    const pivot = new Entity('Inspección');
    pivot.enabled = false;
    app.root.addChild(pivot);

    const center = new Vec3();
    const position = new Vec3();
    const shift = new Vec3();
    const panel = document.querySelector<HTMLElement>('#piece-panel');
    const controlCard = document.querySelector<HTMLElement>('.control-card');
    const turnUp = new Quat();
    const turnSide = new Quat();
    const rotation = new Quat();
    const bounds = new BoundingBox();
    let model: Entity | null = null;
    let hiddenParts: Entity[] = [];
    let distance = 1;
    let minDistance = 0.5;
    let maxDistance = 2;
    let active = false;
    let objectRadius = 0;
    let fitDistance = 1;
    let layoutKey = '';

    const getLayout = (): {
        canvasRect: DOMRect;
        leftFraction: number;
        topFraction: number;
        bottomFraction: number;
        halfWidth: number;
        halfHeight: number;
    } => {
        const canvasRect = canvas.getBoundingClientRect();
        // Escritorio amplio: la pieza va al centro de la pantalla; solo en móvil o ventanas estrechas se aparta de la cédula.
        const panelRect = panel?.hidden || !compactLayout.matches ? null : panel?.getBoundingClientRect();
        // Cédula a lo ancho (abajo, en ventanas verticales estrechas): limita el alto libre en lugar del ancho.
        const panelBelow = !!panelRect && panelRect.left - canvasRect.left < canvasRect.width * 0.25;
        const leftEdge =
            panelRect && !panelBelow
                ? Math.max(canvasRect.left, Math.min(panelRect.left, canvasRect.right))
                : canvasRect.right;
        const leftFraction = Math.max(0.1, Math.min(1, (leftEdge - canvasRect.left) / canvasRect.width));
        const topEdge = canvasRect.top;
        let bottomEdge = canvasRect.bottom;
        if (compactLayout.matches && controlCard && getComputedStyle(controlCard).display !== 'none') {
            bottomEdge = Math.min(bottomEdge, controlCard.getBoundingClientRect().top - 16);
        }
        if (panelRect && panelBelow) {
            bottomEdge = Math.min(bottomEdge, panelRect.top - 16);
        }
        const topFraction = Math.max(0, (topEdge - canvasRect.top) / canvasRect.height);
        const bottomFraction = Math.min(1, (bottomEdge - canvasRect.top) / canvasRect.height);
        const verticalTangent = Math.tan((camera.fov * Math.PI) / 360);
        const aspect = canvasRect.width / canvasRect.height;
        const horizontalTangent = verticalTangent * aspect;
        const halfWidth = distance * horizontalTangent;
        const halfHeight = distance * verticalTangent;
        return { canvasRect, leftFraction, topFraction, bottomFraction, halfWidth, halfHeight };
    };

    const layoutSignature = (): string => {
        const { canvasRect, leftFraction, topFraction, bottomFraction } = getLayout();
        return `${canvasRect.width}:${canvasRect.height}:${leftFraction.toFixed(3)}:${topFraction.toFixed(3)}:${bottomFraction.toFixed(3)}`;
    };

    const calculateFitDistance = (radius: number): number => {
        const { leftFraction, topFraction, bottomFraction } = getLayout();
        const verticalTangent = Math.tan((camera.fov * Math.PI) / 360);
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const horizontalTangent = verticalTangent * aspect;
        const availableHeight = Math.max(0.25, bottomFraction - topFraction);
        return Math.max(radius / (verticalTangent * availableHeight), radius / (horizontalTangent * leftFraction));
    };

    const placeAtCenter = (): void => {
        position.copy(cameraEntity.forward).mulScalar(distance).add(cameraEntity.getPosition());
        // Centra la pieza en el espacio libre entre el borde izquierdo y la cédula, en cualquier pantalla.
        const { leftFraction, topFraction, bottomFraction, halfWidth, halfHeight } = getLayout();
        position.add(shift.copy(cameraEntity.right).mulScalar((leftFraction - 1) * halfWidth));
        const freeCenterY = (topFraction + bottomFraction) / 2;
        const verticalOffset = (0.5 - freeCenterY) * 2 * halfHeight;
        position.add(shift.copy(cameraEntity.up).mulScalar(verticalOffset));
        pivot.setPosition(position);
    };

    const zoom = (factor: number): void => {
        distance = Math.min(maxDistance, Math.max(minDistance, distance * factor));
    };

    // En escritorio se puede seguir caminando: la pieza acompaña a la cámara para mantenerse centrada.
    const onUpdate = (): void => {
        if (active) {
            const nextLayoutKey = layoutSignature();
            if (nextLayoutKey !== layoutKey) {
                const zoomRatio = distance / fitDistance;
                fitDistance = calculateFitDistance(objectRadius);
                minDistance = Math.max(objectRadius + camera.nearClip + 0.05, fitDistance * 0.7);
                maxDistance = fitDistance * 2.4;
                distance = Math.max(minDistance, Math.min(maxDistance, fitDistance * zoomRatio));
                layoutKey = nextLayoutKey;
            }
            placeAtCenter();
        }
    };
    app.on('update', onUpdate);

    const rotate = (degreesX: number, degreesY: number): void => {
        // Giro horizontal sobre el eje vertical del mundo; giro vertical sobre el eje lateral de la cámara.
        turnUp.setFromAxisAngle(Vec3.UP, degreesX);
        turnSide.setFromAxisAngle(cameraEntity.right, degreesY);
        rotation.copy(pivot.getRotation());
        pivot.setRotation(turnUp.mul(turnSide).mul(rotation));
    };

    let rotatable = true;
    const open = (pedestal: Entity, canRotate = true): void => {
        if (active) {
            return;
        }
        active = true;
        rotatable = canRotate;
        // Escritorio: solo se bloquea la mirada (el arrastre gira la pieza) y se sale alejándose.
        // Móvil: se pausa todo, porque el joystick se oculta durante la inspección.
        if (touchCapable) {
            walk.paused = true;
        } else {
            walk.lookLocked = true;
        }
        document.body.classList.add('inspecting');
        document.body.classList.toggle('inspect-fixed', !rotatable);

        // La pieza es todo lo que no es base del pedestal; se copia y el original se oculta («se toma» del pedestal).
        hiddenParts = pedestal.children.filter(
            (child): child is Entity => child instanceof Entity && !child.tags.has('base')
        );
        model = new Entity('Pieza inspeccionada');
        pivot.setPosition(Vec3.ZERO);
        pivot.setRotation(Quat.IDENTITY);
        pivot.addChild(model);
        for (const part of hiddenParts) {
            model.addChild(part.clone());
            part.enabled = false;
        }
        for (const render of model.findComponents('render') as RenderComponent[]) {
            render.layers = [inspectLayer.id];
        }
        pivot.enabled = true;

        // Centra la pieza en el pivote a partir de sus límites reales (sirve también para los GLB futuros).
        const meshes = (model.findComponents('render') as RenderComponent[]).flatMap((render) => render.meshInstances);
        meshes.forEach((mesh, i) => (i === 0 ? bounds.copy(mesh.aabb) : bounds.add(mesh.aabb)));
        center.copy(bounds.center);
        model.setLocalPosition(-center.x, -center.y, -center.z);

        objectRadius = bounds.halfExtents.length();
        fitDistance = calculateFitDistance(objectRadius);
        distance = fitDistance * 1.35;
        minDistance = Math.max(objectRadius + camera.nearClip + 0.05, fitDistance * 0.7);
        maxDistance = fitDistance * 2.4;
        layoutKey = layoutSignature();

        // Muestra el frente de la pieza hacia el visitante.
        const forward = cameraEntity.forward;
        pivot.setEulerAngles(0, (Math.atan2(-forward.x, -forward.z) * 180) / Math.PI, 0);
        frame.enabled = true;
        overlay.enabled = true;
        placeAtCenter();
    };

    const close = (): void => {
        if (!active) {
            return;
        }
        active = false;
        frame.enabled = false;
        overlay.enabled = false;
        pivot.enabled = false;
        model?.destroy();
        model = null;
        hiddenParts.forEach((part) => (part.enabled = true));
        hiddenParts = [];
        pointers.clear();
        walk.paused = false;
        walk.lookLocked = false;
        document.body.classList.remove('inspecting', 'inspect-fixed');
    };

    // Entrada propia de la inspección: arrastre con un puntero gira, dos punteros (pellizco) acercan.
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const onPointerDown = (event: PointerEvent): void => {
        if (!active) {
            return;
        }
        // Refuerza el bloqueo si el navegador móvil reporta el puntero principal como fino.
        if (event.pointerType === 'touch') {
            walk.paused = true;
        }
        canvas.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        pinch = 0;
    };
    const onPointerMove = (event: PointerEvent): void => {
        const previous = pointers.get(event.pointerId);
        if (!active || !previous) {
            return;
        }
        if (pointers.size === 1 && rotatable) {
            rotate((event.clientX - previous.x) * degreesPerPixel, (event.clientY - previous.y) * degreesPerPixel);
        }
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const span = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinch > 0 && span > 0) {
                zoom(pinch / span);
            }
            pinch = span;
        }
    };
    const onPointerUp = (event: PointerEvent): void => {
        pointers.delete(event.pointerId);
        pinch = 0;
    };
    const onWheel = (event: WheelEvent): void => {
        if (active) {
            zoom(Math.exp(event.deltaY * 0.0015));
        }
    };
    const keyActions: Record<string, () => void> = {
        Equal: () => zoom(1 / keyZoomFactor),
        NumpadAdd: () => zoom(1 / keyZoomFactor),
        Minus: () => zoom(keyZoomFactor),
        NumpadSubtract: () => zoom(keyZoomFactor)
    };
    const onKey = (event: KeyboardEvent): void => {
        const action = keyActions[event.code];
        if (active && action) {
            event.preventDefault();
            action();
        }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('keydown', onKey);
        frame.destroy();
    });

    return { open, close };
}
