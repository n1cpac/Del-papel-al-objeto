import type { AppBase, Entity } from 'playcanvas';
import { Vec3 } from 'playcanvas';

import type { Music } from './audio';
import { tracks } from './audio';
import type { ReadingLevel } from './curatorial';
import { glossaryTerms, pieceCuratorialMeta } from './curatorial';
import type { Inspector } from './inspect';
import type { Piece } from './pieces';
import { pieces, piecesById } from './pieces';

export const maxInspectDistance = 2.8;
const closeMargin = 0.4;
// Recuadro imaginario: fracción del ancho y alto de la vista, centrado.
const boxWidth = 0.36;
const boxHeight = 0.5;
const labelSideOffset = 0.42;

const levelLabels: [ReadingLevel, string][] = [
    ['basico', 'Básico'],
    ['general', 'General'],
    ['especializado', 'Especializado']
];

function matchingGlossaryTerms(text: string): string[] {
    const normalized = text.toLowerCase();
    return Object.keys(glossaryTerms).filter((term) => normalized.includes(term.toLowerCase()));
}

/**
 * Muestra una señal contextual con efecto hover cuando una pieza está cerca y centrada en la vista.
 * «Interactuar» (botón, tecla E o Enter) abre la cédula curatorial y el visor 3D; Esc o × cierra.
 */
export function mountPieceFocus(
    app: AppBase,
    cameraEntity: Entity,
    pedestals: Map<Piece, Entity>,
    inspector: Inspector,
    music: Music
): void {
    const label = document.querySelector<HTMLElement>('#piece-label');
    const labelName = document.querySelector<HTMLElement>('#piece-label-name');
    const interact = document.querySelector<HTMLButtonElement>('#piece-interact');
    const interactText = document.querySelector<HTMLElement>('#piece-interact-text');
    const panel = document.querySelector<HTMLElement>('#piece-panel');
    const panelBody = document.querySelector<HTMLElement>('#piece-panel-body');
    const close = document.querySelector<HTMLButtonElement>('#piece-panel-close');
    const npcDialog = document.querySelector<HTMLElement>('#npc-dialog');
    const guideBackdrop = document.querySelector<HTMLElement>('#guide-backdrop');
    const camera = cameraEntity.camera;
    if (!label || !labelName || !interact || !interactText || !panel || !panelBody || !close || !camera) {
        throw new Error('Falta la interfaz de piezas.');
    }

    const anchor = new Vec3();
    const side = new Vec3();
    const screen = new Vec3();
    let focused: Piece | null = null;
    let openPiece: Piece | null = null;
    let currentLevel: ReadingLevel = 'general';
    let activeGlossaryTerm: string | null = null;
    let comparatorBlend = 50;

    const renderPanelContent = (piece: Piece, animateSwap = false): void => {
        const meta = pieceCuratorialMeta[piece.id];
        const rows = piece.fields.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join('');
        const bodyText = meta ? meta.levels[currentLevel] : piece.description;
        const allText = `${bodyText} ${meta?.triggerQuestion ?? ''} ${piece.fields.map((f) => f[1]).join(' ')}`;
        const terms = matchingGlossaryTerms(allText).slice(0, 3);

        const levelButtons = meta
            ? `<div class="reading-levels" role="group" aria-label="Nivel de lectura">
                ${levelLabels
                    .map(
                        ([key, text]) =>
                            `<button type="button" class="level-chip${currentLevel === key ? ' is-active' : ''}" data-level="${key}">${text}</button>`
                    )
                    .join('')}
               </div>`
            : '';

        const comparatorHtml = meta?.comparator
            ? `<section class="comparator-card" aria-label="Comparador papel y producto">
                <div class="comparator-header">
                    <span>Comparador: papel ↔ producto</span>
                    <span>${comparatorBlend < 50 ? 'Origen' : comparatorBlend > 50 ? 'Producto' : 'Equilibrado'}</span>
                </div>
                <input id="piece-comparator" class="comparator-range" type="range" min="0" max="100" value="${comparatorBlend}" aria-label="Comparar origen en papel con producto comercial" />
                <div class="comparator-cols">
                    <div class="comparator-pane" style="opacity:${1 - (comparatorBlend / 100) * 0.55}">
                        <strong>${meta.comparator.originTitle}</strong>
                        <span>${meta.comparator.originDetail}</span>
                    </div>
                    <div class="comparator-pane" style="opacity:${0.45 + (comparatorBlend / 100) * 0.55}">
                        <strong>${meta.comparator.productTitle}</strong>
                        <span>${meta.comparator.productDetail}</span>
                    </div>
                </div>
               </section>`
            : '';

        const triggerHtml = meta
            ? `<p class="piece-trigger"><strong>Pregunta clave:</strong> ${meta.triggerQuestion}</p>`
            : '';

        const glossaryHtml = terms.length
            ? `<div class="glossary-chips" aria-label="Glosario de términos">
                ${terms
                    .map(
                        (term) =>
                            `<button type="button" class="glossary-chip${activeGlossaryTerm === term ? ' is-active' : ''}" data-term="${term}">${term}</button>`
                    )
                    .join('')}
               </div>
               ${
                   activeGlossaryTerm && glossaryTerms[activeGlossaryTerm]
                       ? `<div class="glossary-box is-switching"><strong>${activeGlossaryTerm}:</strong> ${glossaryTerms[activeGlossaryTerm]}</div>`
                       : ''
               }`
            : '';

        panelBody.innerHTML = `
            <p class="piece-station">${piece.station}</p>
            <h2 id="piece-panel-title">${piece.name}</h2>
            ${piece.status ? `<p class="piece-status">${piece.status}</p>` : ''}
            ${levelButtons}
            <div class="piece-dynamic-content${animateSwap ? ' is-switching' : ''}">
                <p class="piece-body-text">${bodyText}</p>
                <dl>${rows}</dl>
                ${comparatorHtml}
                ${triggerHtml}
                ${glossaryHtml}
            </div>`;

        panelBody.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
            button.addEventListener('click', () => {
                const nextLevel = button.dataset.level as ReadingLevel | undefined;
                if (nextLevel && nextLevel !== currentLevel) {
                    currentLevel = nextLevel;
                    renderPanelContent(piece, true);
                }
            });
        });

        panelBody.querySelectorAll<HTMLButtonElement>('[data-term]').forEach((button) => {
            button.addEventListener('click', () => {
                const term = button.dataset.term ?? null;
                activeGlossaryTerm = activeGlossaryTerm === term ? null : term;
                renderPanelContent(piece, true);
            });
        });

        const range = panelBody.querySelector<HTMLInputElement>('#piece-comparator');
        range?.addEventListener('input', () => {
            comparatorBlend = Number(range.value);
            const panes = panelBody.querySelectorAll<HTMLElement>('.comparator-pane');
            const headerStatus = panelBody.querySelector<HTMLElement>('.comparator-header span:last-child');
            if (panes.length === 2) {
                panes[0].style.opacity = String(1 - (comparatorBlend / 100) * 0.55);
                panes[1].style.opacity = String(0.45 + (comparatorBlend / 100) * 0.55);
            }
            if (headerStatus) {
                headerStatus.textContent =
                    comparatorBlend < 50 ? 'Origen' : comparatorBlend > 50 ? 'Producto' : 'Equilibrado';
            }
        });
    };

    const openPanel = (piece: Piece): void => {
        openPiece = piece;
        activeGlossaryTerm = null;
        comparatorBlend = 50;
        // La música del recorrido se pausa (y recuerda su posición) mientras suena la canción de la pieza; sin canción, sigue.
        if (piece.audio) {
            music.play(piece.audio.src, 'piece', piece.audio.gain);
        }
        renderPanelContent(piece, false);
        panel.hidden = false;
        panel.classList.remove('is-entering');
        void panel.offsetWidth;
        panel.classList.add('is-entering');
        label.hidden = true;
        app.fire('piece:panel-state', true, piece.id);
        const pedestal = pedestals.get(piece);
        if (pedestal) {
            inspector.open(pedestal, !piece.onWall);
        }
        close.focus();
    };

    const closePanel = (): void => {
        const wasOpen = !!openPiece;
        const closedId = openPiece?.id ?? null;
        if (openPiece) {
            music.play(tracks.tour);
        }
        panel.hidden = true;
        openPiece = null;
        inspector.close();
        if (wasOpen) {
            app.fire('piece:panel-state', false, closedId);
        }
    };

    const activatePiece = (piece: Piece): void => {
        if (piece.isExit) {
            label.classList.remove('is-focused');
            label.hidden = true;
            focused = null;
            closePanel();
            app.fire('tour:complete');
            return;
        }
        if (piece.isReflection) {
            label.classList.remove('is-focused');
            label.hidden = true;
            focused = null;
            app.fire('reflection:open');
            return;
        }
        openPanel(piece);
    };

    const onInspectById = (pieceId: string): void => {
        const found = piecesById[pieceId as keyof typeof piecesById] as Piece | undefined;
        if (!found) return;
        const eye = cameraEntity.getPosition();
        const dist = Math.hypot(found.x - eye.x, found.z - eye.z);
        if (dist > maxInspectDistance) {
            app.fire('piece:inspect-denied', found, dist);
            return;
        }
        openPanel(found);
    };
    app.on('piece:inspect', onInspectById);
    app.on('piece:close-all', closePanel);

    interact.addEventListener('click', () => focused && activatePiece(focused));
    close.addEventListener('click', closePanel);
    const onKey = (event: KeyboardEvent): void => {
        const dialogActive = (npcDialog && !npcDialog.hidden) || guideBackdrop?.classList.contains('is-open');
        if (event.code === 'Escape') {
            closePanel();
        } else if ((event.code === 'KeyE' || event.code === 'Enter') && focused && panel.hidden && !dialogActive) {
            activatePiece(focused);
        }
    };
    window.addEventListener('keydown', onKey);

    const onUpdate = (): void => {
        const eye = cameraEntity.getPosition();
        const forward = cameraEntity.forward;
        const { clientWidth: width, clientHeight: height } = app.graphicsDevice.canvas;

        // Cierra la cédula al alejarse físicamente; el margen evita cierres por pasos pequeños en el límite.
        if (openPiece && Math.hypot(openPiece.x - eye.x, openPiece.z - eye.z) > maxInspectDistance + closeMargin) {
            closePanel();
        }

        const dialogActive = (npcDialog && !npcDialog.hidden) || guideBackdrop?.classList.contains('is-open');
        // Durante la inspección o un diálogo abierto la etiqueta contextual sobra.
        if (!panel.hidden || dialogActive) {
            label.hidden = true;
            return;
        }

        let best: Piece | null = null;
        let bestOffset = Infinity;
        for (const piece of pieces) {
            // Las piezas de muro sur o infografía solo se enfocan desde su cara (z mayor que la suya), no por detrás.
            if (piece.onWall && !piece.isExit && eye.z < piece.z) {
                continue;
            }
            anchor.set(piece.x, piece.y, piece.z);
            const distance = Math.hypot(anchor.x - eye.x, anchor.z - eye.z);
            // Descarta piezas lejanas o detrás de la cámara (worldToScreen proyecta también las de atrás).
            if (distance > maxInspectDistance || side.sub2(anchor, eye).dot(forward) <= 0) {
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
            label.classList.remove('is-focused');
            label.hidden = true;
            return;
        }
        // La etiqueta se ancla a un punto a la derecha del objeto, así acompaña su tamaño en pantalla.
        side.copy(cameraEntity.right)
            .mulScalar(labelSideOffset)
            .add(anchor.set(best.x, best.y, best.z));
        camera.worldToScreen(side, screen);
        labelName.textContent = best.name;
        if (best.isExit) {
            interactText.textContent = 'Salir de la exposición';
        } else if (best.isReflection) {
            interactText.textContent = 'Realizar actividad final';
        } else {
            interactText.textContent = 'Explorar objeto';
        }
        label.classList.add('is-focused');
        label.style.left = `${Math.max(12, Math.min(screen.x, width - label.offsetWidth - 12))}px`;
        label.style.top = `${screen.y}px`;
        label.hidden = false;
    };
    app.on('update', onUpdate);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        app.off('piece:inspect', onInspectById);
        app.off('piece:close-all', closePanel);
        window.removeEventListener('keydown', onKey);
    });
}
