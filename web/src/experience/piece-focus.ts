import type { AppBase, Entity } from 'playcanvas';
import { Vec3 } from 'playcanvas';

import type { Inspector } from './inspect';
import type { Piece } from './pieces';
import { pieces } from './pieces';

const maxDistance = 2.8;
const closeMargin = 0.4;
// Recuadro imaginario: fracción del ancho y alto de la vista, centrado.
const boxWidth = 0.36;
const boxHeight = 0.5;
const labelSideOffset = 0.42;

/**
 * Muestra el nombre de la pieza y el botón «Interactuar» cuando la pieza está cerca y centrada en la vista.
 * «Interactuar» (botón, tecla E o Enter) abre la cédula; Esc o el botón de cierre la cierra.
 */
export function mountPieceFocus(
    app: AppBase,
    cameraEntity: Entity,
    pedestals: Map<Piece, Entity>,
    inspector: Inspector
): void {
    const label = document.querySelector<HTMLElement>('#piece-label');
    const labelName = document.querySelector<HTMLElement>('#piece-label-name');
    const interact = document.querySelector<HTMLButtonElement>('#piece-interact');
    const panel = document.querySelector<HTMLElement>('#piece-panel');
    const panelBody = document.querySelector<HTMLElement>('#piece-panel-body');
    const close = document.querySelector<HTMLButtonElement>('#piece-panel-close');
    const camera = cameraEntity.camera;
    if (!label || !labelName || !interact || !panel || !panelBody || !close || !camera) {
        throw new Error('Falta la interfaz de piezas.');
    }

    const anchor = new Vec3();
    const side = new Vec3();
    const screen = new Vec3();
    let focused: Piece | null = null;
    let openPiece: Piece | null = null;

    const openPanel = (piece: Piece): void => {
        openPiece = piece;
        const rows = piece.fields.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join('');
        panelBody.innerHTML = `
            <p class="piece-station">${piece.station}</p>
            <h2 id="piece-panel-title">${piece.name}</h2>
            ${piece.status ? `<p class="piece-status">${piece.status}</p>` : ''}
            <p>${piece.description}</p>
            <dl>${rows}</dl>
            <p class="piece-detail">${piece.detail}</p>`;
        panel.hidden = false;
        label.hidden = true;
        const pedestal = pedestals.get(piece);
        if (pedestal) {
            inspector.open(pedestal);
        }
        close.focus();
    };
    const closePanel = (): void => {
        panel.hidden = true;
        openPiece = null;
        inspector.close();
    };

    interact.addEventListener('click', () => focused && openPanel(focused));
    close.addEventListener('click', closePanel);
    const onKey = (event: KeyboardEvent): void => {
        if (event.code === 'Escape') {
            closePanel();
        } else if ((event.code === 'KeyE' || event.code === 'Enter') && focused && panel.hidden) {
            openPanel(focused);
        }
    };
    window.addEventListener('keydown', onKey);

    const onUpdate = (): void => {
        const eye = cameraEntity.getPosition();
        const forward = cameraEntity.forward;
        const { clientWidth: width, clientHeight: height } = app.graphicsDevice.canvas;

        // Cierra la cédula al alejarse físicamente; el margen evita cierres por pasos pequeños en el límite.
        if (openPiece && Math.hypot(openPiece.x - eye.x, openPiece.z - eye.z) > maxDistance + closeMargin) {
            closePanel();
        }

        // Durante la inspección la etiqueta sobra: la pieza ya está en primer plano.
        if (!panel.hidden) {
            label.hidden = true;
            return;
        }

        let best: Piece | null = null;
        let bestOffset = Infinity;
        for (const piece of pieces) {
            anchor.set(piece.x, piece.y, piece.z);
            const distance = Math.hypot(anchor.x - eye.x, anchor.z - eye.z);
            // Descarta piezas lejanas o detrás de la cámara (worldToScreen proyecta también las de atrás).
            if (distance > maxDistance || side.sub2(anchor, eye).dot(forward) <= 0) {
                continue;
            }
            camera.worldToScreen(anchor, screen);
            const dx = Math.abs(screen.x - width / 2) / width;
            const dy = Math.abs(screen.y - height / 2) / height;
            if (dx < boxWidth / 2 && dy < boxHeight / 2 && dx < bestOffset) {
                best = piece;
                bestOffset = dx;
            }
        }

        focused = best;
        if (!best) {
            label.hidden = true;
            return;
        }
        // La etiqueta se ancla a un punto a la derecha del objeto, así acompaña su tamaño en pantalla.
        side.copy(cameraEntity.right)
            .mulScalar(labelSideOffset)
            .add(anchor.set(best.x, best.y, best.z));
        camera.worldToScreen(side, screen);
        labelName.textContent = best.name;
        label.style.left = `${Math.min(screen.x, width - label.offsetWidth - 12)}px`;
        label.style.top = `${screen.y}px`;
        label.hidden = false;
    };
    app.on('update', onUpdate);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        window.removeEventListener('keydown', onKey);
    });
}
