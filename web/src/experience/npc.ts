import type { AppBase, ContainerResource } from 'playcanvas';
import { Color, Entity, StandardMaterial, Vec3 } from 'playcanvas';

import {
    collectionSequence,
    educationalPurpose,
    entryInterestChoices,
    pieceCuratorialMeta,
    reflectionOptions,
    stationsById
} from './curatorial';
import { maxInspectDistance } from './piece-focus';
import { piecesById } from './pieces';
import { setDynamicKeepOut } from './room';
import { WalkController } from './walk-controller';

type NpcAct = 'intro' | 'objects' | 'reflection' | 'farewell';

type Waypoint = { x: number; z: number };

const objectSequence = ['manga', 'deck', 'yuji', 'gon', 'miku'] as const;

const stationStops: Record<string, { x: number; z: number; label: string }> = {
    intro: { x: 7.85, z: 7.15, label: 'A · Bienvenida (entrada)' },
    manga: { x: 10.35, z: 0.95, label: 'B · Tomo de manga de Yu-Gi-Oh!' },
    deck: { x: 7.65, z: 0.95, label: 'C · Deck estructurado de Kaiba' },
    yuji: { x: 4.75, z: 0.95, label: 'C · Funko Pop Yuji Itadori #1111' },
    gon: { x: 2.65, z: 0.95, label: 'C · Funko Pop Gon Freecss #651' },
    miku: { x: -0.2, z: 0.95, label: 'D · Peluche de Hatsune Miku' },
    coleccion: { x: -3.45, z: 0.95, label: 'E · Reflexión e infografía' },
    salida: { x: -4.45, z: 1.35, label: 'E · Puerta de salida' }
};

const entranceSpot = stationStops.intro;

function requiredElement<T extends Element>(selector: string): T {
    const found = document.querySelector<T>(selector);
    if (!found) {
        throw new Error(`Falta elemento del guía: ${selector}`);
    }
    return found;
}

function buildCorridorPath(from: Vec3, target: Waypoint): Waypoint[] {
    const path: Waypoint[] = [];
    const fromEntrance = from.z > 3.6;
    const toEntrance = target.z > 3.6;
    if (fromEntrance && !toEntrance) {
        path.push({ x: 9, z: 4 }, { x: 9, z: 1.35 });
    } else if (!fromEntrance && toEntrance) {
        path.push({ x: 9, z: 1.35 }, { x: 9, z: 4 });
    } else if (!fromEntrance && !toEntrance && Math.abs(from.z - 0.95) > 0.35 && Math.abs(from.x - target.x) > 0.6) {
        path.push({ x: from.x, z: 0.95 });
    }
    path.push(target);
    return path;
}

function createNpcArrow(parent: Entity): Entity {
    const surface = new StandardMaterial();
    surface.diffuse = new Color().fromString('#159b95');
    surface.emissive = new Color().fromString('#159b95');
    surface.update();

    const arrow = new Entity('Señal · Guía de exposición');
    arrow.setLocalPosition(0, 2.02, 0);
    parent.addChild(arrow);

    const addPart = (name: string, pos: [number, number, number], scale: [number, number, number], rotZ = 0): void => {
        const part = new Entity(name);
        part.addComponent('render', { type: 'box', material: surface });
        part.setLocalPosition(...pos);
        part.setLocalScale(...scale);
        if (rotZ) {
            part.setLocalEulerAngles(0, 0, rotZ);
        }
        arrow.addChild(part);
    };
    addPart('Vástago', [0, -0.09, 0], [0.035, 0.2, 0.035]);
    addPart('Punta izquierda', [-0.052, -0.24, 0], [0.035, 0.13, 0.035], 40);
    addPart('Punta derecha', [0.052, -0.24, 0], [0.035, 0.13, 0.035], -40);
    return arrow;
}

function normalizeAngle(deg: number): number {
    return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function getVisitorZone(pos: Vec3): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (pos.z > 3.6) return 'A';
    if (pos.x >= 9) return 'B';
    if (pos.x >= 1.4) return 'C';
    if (pos.x >= -1.8) return 'D';
    return 'E';
}

/**
 * Guía virtual interactivo basado en `models/npc.glb`.
 * Coordina los cuatro actos (Introducción -> Objetos -> Reflexión -> Despedida),
 * el intercambio de cara al hablar y la guía educativa A-E del HUD.
 */
export function mountNpcGuide(app: AppBase, cameraEntity: Entity): void {
    const npcLabel = requiredElement<HTMLElement>('#npc-label');
    const npcInteract = requiredElement<HTMLButtonElement>('#npc-interact');
    const npcStatusPill = requiredElement<HTMLElement>('#npc-status-pill');
    const dialog = requiredElement<HTMLElement>('#npc-dialog');
    const dialogStage = requiredElement<HTMLElement>('#npc-dialog-stage');
    const dialogTitle = requiredElement<HTMLElement>('#npc-dialog-title');
    const dialogText = requiredElement<HTMLElement>('#npc-dialog-text');
    const dialogSubtext = requiredElement<HTMLElement>('#npc-dialog-subtext');
    const dialogExtra = requiredElement<HTMLElement>('#npc-dialog-extra');
    const dialogGlossary = requiredElement<HTMLElement>('#npc-dialog-glossary');
    const dialogActions = requiredElement<HTMLElement>('#npc-dialog-actions');
    const dialogClose = requiredElement<HTMLButtonElement>('#npc-dialog-close');

    const guideToggle = requiredElement<HTMLButtonElement>('#guide-toggle');
    const guideBackdrop = requiredElement<HTMLElement>('#guide-backdrop');
    const guideClose = requiredElement<HTMLButtonElement>('#guide-close');
    const guideBody = requiredElement<HTMLElement>('#guide-body');

    const startScreen = requiredElement<HTMLElement>('#start-screen');
    const piecePanel = requiredElement<HTMLElement>('#piece-panel');
    const camera = cameraEntity.camera;
    const walk = cameraEntity.script?.get(WalkController);
    if (!camera || !(walk instanceof WalkController)) {
        throw new Error('El guía necesita la cámara del visitante.');
    }

    const npcRoot = new Entity('NPC · Guía curatorial');
    npcRoot.setLocalPosition(entranceSpot.x, 0, entranceSpot.z);
    npcRoot.setLocalEulerAngles(0, 32, 0);
    app.root.addChild(npcRoot);

    const npcBody = new Entity('NPC · malla');
    npcBody.setLocalScale(1.22, 1.22, 1.22);
    npcRoot.addChild(npcBody);
    const npcArrow = createNpcArrow(npcRoot);

    let neutralHead: Entity | null = null;
    let talkingHead: Entity | null = null;
    let hipsNode: Entity | null = null;
    let hipsBaseY = 0;

    app.assets.loadFromUrl(`${import.meta.env.BASE_URL}models/npc.glb`, 'container', (error, asset) => {
        if (error || !asset?.resource) {
            console.warn('No se pudo cargar el modelo del guía (npc.glb).', error);
            return;
        }
        const instance = (asset.resource as ContainerResource).instantiateRenderEntity();
        npcBody.addChild(instance);

        const neutral = instance.findByName('Object_9');
        const talking = instance.findByName('head_talking_NPC');
        const hips = instance.findByName('Character1_Hips_01');
        if (neutral instanceof Entity) {
            neutralHead = neutral;
            neutralHead.enabled = true;
        }
        if (talking instanceof Entity) {
            talkingHead = talking;
            talkingHead.enabled = false;
        }
        if (hips instanceof Entity) {
            hipsNode = hips;
            hipsBaseY = hips.getLocalPosition().y;
        }
    });

    // Estado narrativo y educativo
    let act: NpcAct = 'intro';
    let introStep = 0;
    let objectIndex = 0;
    let guidedMode = false;
    let pendingResumeAfterInspect = false;
    let selectedInterestChoice = '';
    let reflectionSelectedId: string | null = null;
    let reflectionSolved = false;
    const visitedPieces = new Set<string>();

    // Estado espacial y animación facial
    let waypoints: Waypoint[] = [];
    let waitingStopKey: string | null = 'intro';
    let autoGreetedStopKey: string | null = null;
    let errorDisclaimerTimer: number | null = null;
    let errorDisclaimerActive = false;
    let npcYaw = 32;
    let elapsed = 0;
    let mouthTimer = 0;
    let mouthFlipTimer = 0;
    let mouthOpen = false;
    let npcFocused = false;
    let pausedBeforeGuide = false;

    const triggerSpeakAnimation = (seconds = 2.4): void => {
        mouthTimer = seconds;
        mouthFlipTimer = 0;
    };

    const setMouth = (open: boolean): void => {
        if (mouthOpen === open) return;
        mouthOpen = open;
        if (neutralHead) neutralHead.enabled = !open;
        if (talkingHead) talkingHead.enabled = open;
    };

    const updateStatusPill = (): void => {
        if (errorDisclaimerActive) {
            return;
        }
        npcStatusPill.classList.remove('is-error');
        if (waypoints.length > 0 && guidedMode && startScreen.hidden && dialog.hidden) {
            const targetKey =
                act === 'objects'
                    ? objectSequence[objectIndex]
                    : act === 'reflection'
                      ? 'coleccion'
                      : act === 'farewell'
                        ? 'salida'
                        : 'intro';
            npcStatusPill.textContent = `El guía avanza hacia ${stationStops[targetKey]?.label ?? 'la siguiente estación'}`;
            npcStatusPill.hidden = false;
            return;
        }
        if (waitingStopKey && guidedMode && waitingStopKey !== 'intro' && startScreen.hidden && dialog.hidden) {
            npcStatusPill.textContent = `El guía te espera en ${stationStops[waitingStopKey]?.label ?? 'su estación'} (acércate o pulsa E)`;
            npcStatusPill.hidden = false;
            return;
        }
        npcStatusPill.hidden = true;
    };

    const showDisclaimer = (message: string, isError = false): void => {
        if (errorDisclaimerTimer !== null) {
            window.clearTimeout(errorDisclaimerTimer);
            errorDisclaimerTimer = null;
        }
        npcStatusPill.textContent = message;
        npcStatusPill.classList.toggle('is-error', isError);
        npcStatusPill.hidden = false;
        if (isError) {
            errorDisclaimerActive = true;
            errorDisclaimerTimer = window.setTimeout(() => {
                errorDisclaimerActive = false;
                npcStatusPill.classList.remove('is-error');
                updateStatusPill();
            }, 3800);
        }
    };

    const walkToStop = (stopKey: string): void => {
        const target = stationStops[stopKey];
        if (!target) return;
        waitingStopKey = stopKey;
        autoGreetedStopKey = null;
        waypoints = buildCorridorPath(npcRoot.getPosition(), { x: target.x, z: target.z });
        updateStatusPill();
    };

    const closeDialog = (): void => {
        dialog.hidden = true;
        dialog.classList.remove('is-entering', 'is-shake');
        mouthTimer = 0;
        setMouth(false);
        updateStatusPill();
    };

    const appendActionButton = (
        label: string,
        variant: 'primary' | 'secondary',
        onClick: () => void
    ): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `start-button ${variant === 'primary' ? 'start-button-primary' : 'start-button-secondary'}`;
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        dialogActions.appendChild(btn);
        return btn;
    };

    const renderDialog = (shouldSpeak = true): void => {
        const wasHidden = dialog.hidden;
        dialog.hidden = false;
        dialog.classList.remove('is-shake', 'is-step-animating');
        if (wasHidden) {
            dialog.classList.remove('is-entering');
        }
        npcLabel.hidden = true;
        dialogGlossary.hidden = true;
        dialogGlossary.innerHTML = '';
        dialogExtra.hidden = true;
        dialogExtra.innerHTML = '';
        dialogSubtext.hidden = true;
        dialogSubtext.textContent = '';
        dialogActions.innerHTML = '';

        if (shouldSpeak) {
            triggerSpeakAnimation(2.2);
        }

        if (act === 'intro') {
            dialogStage.textContent = 'Acto 1 · Bienvenida';
            if (introStep === 0) {
                dialogTitle.textContent = '¡Bienvenido a Del papel al objeto!';
                dialogText.textContent =
                    'Soy tu guía en esta exposición de la Universidad Militar Nueva Granada. Veremos cinco piezas (un manga, cartas TCG, dos Funko Pop y un peluche) que pasaron de Japón al coleccionismo occidental.';
                dialogSubtext.textContent =
                    'Propósito: descubrir qué convierte un grupo de objetos en una colección con sentido.';
                dialogSubtext.hidden = false;

                appendActionButton('Continuar →', 'primary', () => {
                    introStep = 1;
                    renderDialog();
                });
                appendActionButton('Explorar por mi cuenta', 'secondary', () => {
                    guidedMode = false;
                    closeDialog();
                });
            } else {
                dialogTitle.textContent = '¿Qué te llama la atención coleccionar?';
                dialogText.textContent =
                    'Elige una opción y decide si deseas iniciar el recorrido guiado o ir libremente.';
                dialogExtra.hidden = false;

                const grid = document.createElement('div');
                grid.className = 'npc-choice-grid';
                for (const choice of entryInterestChoices) {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = `npc-choice-btn${selectedInterestChoice === choice ? ' is-selected' : ''}`;
                    chip.textContent = choice;
                    chip.addEventListener('click', () => {
                        selectedInterestChoice = choice;
                        renderDialog(false);
                    });
                    grid.appendChild(chip);
                }
                dialogExtra.append(grid);

                appendActionButton('Iniciar recorrido guiado →', 'primary', () => {
                    if (!selectedInterestChoice) {
                        selectedInterestChoice = entryInterestChoices[0];
                    }
                    guidedMode = true;
                    act = 'objects';
                    objectIndex = 0;
                    closeDialog();
                    walkToStop(objectSequence[0]);
                });
                appendActionButton('Explorar libremente', 'secondary', () => {
                    guidedMode = false;
                    closeDialog();
                });
            }
        } else if (act === 'objects') {
            const pieceId = objectSequence[objectIndex];
            const piece = piecesById[pieceId];
            const meta = pieceCuratorialMeta[pieceId];
            visitedPieces.add(pieceId);

            dialogStage.textContent = `Acto 2 · Objeto ${objectIndex + 1} de ${objectSequence.length}`;
            dialogTitle.textContent = piece.name;
            dialogText.textContent = meta.npcSummary;
            dialogSubtext.textContent = meta.npcObservation;
            dialogSubtext.hidden = false;

            appendActionButton('Explorar objeto en 3D', 'secondary', () => {
                const eye = cameraEntity.getPosition();
                const distToPiece = Math.hypot(piece.x - eye.x, piece.z - eye.z);
                if (distToPiece > maxInspectDistance) {
                    showDisclaimer('Estás muy lejos del objeto · Acércate al pedestal para abrir el visor 3D', true);
                    let inlineErr = dialogExtra.querySelector<HTMLElement>('.npc-inline-error');
                    if (!inlineErr) {
                        dialogExtra.hidden = false;
                        inlineErr = document.createElement('div');
                        inlineErr.className = 'npc-inline-error';
                        dialogExtra.prepend(inlineErr);
                    }
                    inlineErr.textContent =
                        'No estás lo suficientemente cerca de esta pieza. Acércate al pedestal para abrir el visor 3D.';
                    inlineErr.classList.remove('is-shake');
                    void inlineErr.offsetWidth;
                    inlineErr.classList.add('is-shake');
                    dialog.classList.remove('is-shake');
                    void dialog.offsetWidth;
                    dialog.classList.add('is-shake');
                    return;
                }
                pendingResumeAfterInspect = true;
                closeDialog();
                app.fire('piece:inspect', pieceId);
            });

            const isLastObject = objectIndex === objectSequence.length - 1;
            appendActionButton(isLastObject ? 'Ir a la reflexión →' : 'Pasar al siguiente →', 'primary', () => {
                guidedMode = true;
                if (!isLastObject) {
                    objectIndex += 1;
                    closeDialog();
                    walkToStop(objectSequence[objectIndex]);
                } else {
                    act = 'reflection';
                    closeDialog();
                    walkToStop('coleccion');
                }
            });
            appendActionButton('Seguir libre', 'secondary', () => {
                guidedMode = false;
                closeDialog();
            });
        } else if (act === 'reflection') {
            visitedPieces.add('coleccion');
            const stationE = stationsById.E;
            dialogStage.textContent = 'Acto 3 · Reflexión final';
            dialogTitle.textContent = '¿Qué hace que estos cinco objetos sean una colección?';
            dialogText.textContent = stationE.where;
            dialogExtra.hidden = false;

            const choiceList = document.createElement('div');
            choiceList.className = 'npc-choice-grid';
            choiceList.style.gridTemplateColumns = '1fr';
            for (const opt of reflectionOptions) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `npc-choice-btn${reflectionSelectedId === opt.id ? ' is-selected' : ''}`;
                btn.textContent = opt.label;
                btn.addEventListener('click', () => {
                    reflectionSelectedId = opt.id;
                    reflectionSolved = opt.correct;
                    renderDialog(false);
                });
                choiceList.appendChild(btn);
            }
            dialogExtra.appendChild(choiceList);

            const selectedOpt = reflectionOptions.find((o) => o.id === reflectionSelectedId);
            if (selectedOpt) {
                const fb = document.createElement('div');
                fb.className = `reflection-feedback ${selectedOpt.correct ? 'is-correct' : 'is-wrong'}`;
                fb.textContent = selectedOpt.feedback;
                dialogExtra.appendChild(fb);
            }

            if (reflectionSolved) {
                const initialText = selectedInterestChoice || 'Explorar distintas piezas por curiosidad';
                const comp = document.createElement('div');
                comp.className = 'reflection-comparison';
                comp.innerHTML = `
                    <p style="margin:0 0 4px"><strong>Tu punto de partida:</strong> ${initialText}.</p>
                    <p style="margin:0"><strong>Criterio curatorial:</strong> ${collectionSequence}.</p>`;
                dialogExtra.appendChild(comp);
            }

            if (reflectionSolved) {
                appendActionButton('Ir a la despedida →', 'primary', () => {
                    act = 'farewell';
                    guidedMode = true;
                    closeDialog();
                    walkToStop('salida');
                });
            }
            appendActionButton('Cerrar por ahora', 'secondary', closeDialog);
        } else {
            dialogStage.textContent = 'Acto 4 · Despedida';
            dialogTitle.textContent = '¡Gracias por acompañarme!';
            dialogText.textContent =
                'Recorrimos desde la tinta del manga hasta cartas, figuras de vinilo y un peluche digital. Ya puedes cruzar la Puerta de salida.';
            dialogSubtext.textContent = collectionSequence;
            dialogSubtext.hidden = false;

            appendActionButton('Salir de la exposición →', 'primary', () => {
                closeDialog();
                app.fire('tour:complete');
            });
            appendActionButton('Seguir en la sala', 'secondary', () => {
                guidedMode = false;
                closeDialog();
            });
        }

        void dialog.offsetWidth;
        if (wasHidden) {
            dialog.classList.add('is-entering');
        } else {
            dialog.classList.add('is-step-animating');
        }
        updateStatusPill();
    };

    const renderGuideModal = (): void => {
        const visitorZone = getVisitorZone(cameraEntity.getPosition());
        const guideTarget =
            act === 'intro'
                ? 'A'
                : act === 'objects'
                  ? stationsById[pieceCuratorialMeta[objectSequence[objectIndex]].stationId].id
                  : 'E';

        const stationList: { id: 'A' | 'B' | 'C' | 'D' | 'E'; subtitle: string; done: boolean }[] = [
            { id: 'A', subtitle: 'Bienvenida', done: act !== 'intro' },
            { id: 'B', subtitle: 'Manga', done: visitedPieces.has('manga') },
            {
                id: 'C',
                subtitle: 'Deck · Yuji · Gon',
                done: visitedPieces.has('deck') && visitedPieces.has('yuji') && visitedPieces.has('gon')
            },
            { id: 'D', subtitle: 'Miku', done: visitedPieces.has('miku') },
            { id: 'E', subtitle: 'Reflexión', done: reflectionSolved }
        ];

        guideBody.innerHTML = `
            <p style="margin:0">${educationalPurpose}</p>
            <div>
                <p style="margin:0 0 6px"><strong>Estaciones de la sala (A a E):</strong></p>
                <div class="guide-map">
                    ${stationList
                        .map(
                            (s) =>
                                `<div class="guide-station-card${visitorZone === s.id ? ' is-current' : ''}${s.done ? ' is-done' : ''}">
                                    <strong>${s.id}${visitorZone === s.id ? ' · Tú' : ''}${guideTarget === s.id ? ' · Guía' : ''}</strong>
                                    <span>${s.subtitle}</span>
                                    ${s.done ? '<span class="guide-station-done">✓ Visto</span>' : ''}
                                </div>`
                        )
                        .join('')}
                </div>
            </div>
            <div class="npc-dialog-actions">
                <button id="guide-resume-npc" type="button" class="start-button start-button-primary">
                    ${guidedMode ? 'Hablar con el guía' : 'Activar guía paso a paso'}
                </button>
                <button id="guide-free-mode" type="button" class="start-button start-button-secondary">
                    Exploración libre
                </button>
            </div>`;

        guideBody.querySelector('#guide-resume-npc')?.addEventListener('click', () => {
            setGuideModal(false);
            guidedMode = true;
            if (act === 'intro' && introStep < 1) {
                introStep = 0;
            }
            renderDialog();
        });
        guideBody.querySelector('#guide-free-mode')?.addEventListener('click', () => {
            guidedMode = false;
            setGuideModal(false);
            updateStatusPill();
        });
    };

    const setGuideModal = (open: boolean): void => {
        const isOpen = guideBackdrop.classList.contains('is-open');
        if (open === isOpen) return;
        if (open) {
            pausedBeforeGuide = walk.paused;
            walk.paused = true;
            renderGuideModal();
        } else {
            walk.paused = pausedBeforeGuide;
        }
        guideBackdrop.classList.toggle('is-open', open);
        guideToggle.setAttribute('aria-expanded', String(open));
        (open ? guideClose : guideToggle).focus();
    };

    guideToggle.addEventListener('click', () => setGuideModal(true));
    guideClose.addEventListener('click', () => setGuideModal(false));
    guideBackdrop.addEventListener('click', (event) => {
        if (event.target === guideBackdrop) setGuideModal(false);
    });

    const openNpcDialogue = (): void => {
        if (!piecePanel.hidden) return;
        renderDialog();
    };

    npcInteract.addEventListener('click', openNpcDialogue);
    dialogClose.addEventListener('click', closeDialog);

    const onKeyDown = (event: KeyboardEvent): void => {
        if (event.code === 'Escape') {
            if (guideBackdrop.classList.contains('is-open')) {
                setGuideModal(false);
            } else if (!dialog.hidden) {
                closeDialog();
            }
            return;
        }
        if ((event.code === 'KeyE' || event.code === 'Enter') && npcFocused && dialog.hidden && piecePanel.hidden) {
            openNpcDialogue();
        }
    };
    window.addEventListener('keydown', onKeyDown);

    const onPanelState = (isOpen: boolean, pieceId: string | null): void => {
        if (pieceId) {
            visitedPieces.add(pieceId);
        }
        if (!isOpen && pendingResumeAfterInspect) {
            pendingResumeAfterInspect = false;
            renderDialog(false);
        }
    };
    const onOpenReflection = (): void => {
        act = 'reflection';
        guidedMode = true;
        walkToStop('coleccion');
        renderDialog();
    };
    const onInspectDenied = (): void => {
        showDisclaimer('Estás muy lejos del objeto · Acércate al pedestal para abrir el visor 3D', true);
    };
    const onTourReset = (): void => {
        closeDialog();
        setGuideModal(false);
        act = 'intro';
        introStep = 0;
        objectIndex = 0;
        guidedMode = false;
        pendingResumeAfterInspect = false;
        selectedInterestChoice = '';
        reflectionSelectedId = null;
        reflectionSolved = false;
        visitedPieces.clear();
        waypoints = [];
        waitingStopKey = 'intro';
        autoGreetedStopKey = null;
        errorDisclaimerActive = false;
        if (errorDisclaimerTimer !== null) {
            window.clearTimeout(errorDisclaimerTimer);
            errorDisclaimerTimer = null;
        }
        npcRoot.setLocalPosition(entranceSpot.x, 0, entranceSpot.z);
        npcYaw = 32;
        npcRoot.setLocalEulerAngles(0, npcYaw, 0);
        updateStatusPill();
    };

    app.on('piece:panel-state', onPanelState);
    app.on('piece:inspect-denied', onInspectDenied);
    app.on('reflection:open', onOpenReflection);
    app.on('tour:complete', onTourReset);

    const anchor = new Vec3();
    const screen = new Vec3();
    const toTarget = new Vec3();

    const onUpdate = (dt: number): void => {
        elapsed += dt;
        const npcPos = npcRoot.getPosition();
        let nextX = npcPos.x;
        let nextZ = npcPos.z;

        // Movimiento suave por el pasillo cuando cambia de estación.
        const isWalking = waypoints.length > 0;
        if (isWalking) {
            const next = waypoints[0];
            const dx = next.x - nextX;
            const dz = next.z - nextZ;
            const dist = Math.hypot(dx, dz);
            const speed = 2.35;
            if (dist <= speed * dt + 0.03) {
                nextX = next.x;
                nextZ = next.z;
                waypoints.shift();
                if (waypoints.length === 0) {
                    updateStatusPill();
                }
            } else {
                nextX += (dx / dist) * speed * dt;
                nextZ += (dz / dist) * speed * dt;
                const moveYaw = (Math.atan2(dx, dz) * 180) / Math.PI;
                npcYaw += normalizeAngle(moveYaw - npcYaw) * Math.min(1, dt * 8);
            }
            npcRoot.setLocalPosition(nextX, 0, nextZ);
            npcBody.setLocalPosition(0, Math.abs(Math.sin(elapsed * 8.5)) * 0.028, 0);
        } else {
            // Respiración sutil en reposo y giro suave hacia el visitante.
            npcBody.setLocalPosition(0, Math.sin(elapsed * 2.1) * 0.008, 0);
            const eye = cameraEntity.getPosition();
            const targetYaw = (Math.atan2(eye.x - nextX, eye.z - nextZ) * 180) / Math.PI;
            npcYaw += normalizeAngle(targetYaw - npcYaw) * Math.min(1, dt * 5);
        }
        npcRoot.setLocalEulerAngles(0, npcYaw, 0);
        if (hipsNode) {
            const hipPos = hipsNode.getLocalPosition();
            hipsNode.setLocalPosition(hipPos.x, hipsBaseY + Math.sin(elapsed * 2.1) * 0.35, hipPos.z);
        }

        // Alterna la cara entre neutral y hablando cuando el NPC narra.
        if (mouthTimer > 0 && !dialog.hidden) {
            mouthTimer = Math.max(0, mouthTimer - dt);
            mouthFlipTimer += dt;
            if (mouthFlipTimer >= 0.17) {
                mouthFlipTimer = 0;
                setMouth(!mouthOpen);
            }
        } else {
            setMouth(false);
        }

        // Colisión del guía solo cuando está quieto para no encerrar al visitante al cruzarse.
        setDynamicKeepOut(!startScreen.hidden || isWalking ? null : { x: nextX, z: nextZ, radius: 0.28 });

        // Flecha sobre el guía y etiqueta contextual.
        npcArrow.enabled =
            !isWalking && Boolean(dialog.hidden) && Boolean(piecePanel.hidden) && Boolean(startScreen.hidden);
        if (npcArrow.enabled) {
            npcArrow.setLocalPosition(0, 2.02 + Math.sin(elapsed * 2.4) * 0.075, 0);
        }

        if (
            !startScreen.hidden ||
            !piecePanel.hidden ||
            !dialog.hidden ||
            guideBackdrop.classList.contains('is-open')
        ) {
            npcFocused = false;
            npcLabel.hidden = true;
            return;
        }

        const eye = cameraEntity.getPosition();
        const distToVisitor = Math.hypot(nextX - eye.x, nextZ - eye.z);

        // Si el guía esperaba en una nueva estación guiada y el visitante se acerca, abre su narración una sola vez.
        if (
            guidedMode &&
            !isWalking &&
            waitingStopKey &&
            waitingStopKey !== 'intro' &&
            autoGreetedStopKey !== waitingStopKey &&
            distToVisitor <= 3.1
        ) {
            autoGreetedStopKey = waitingStopKey;
            renderDialog();
            return;
        }

        if (isWalking || distToVisitor > 3.3) {
            npcFocused = false;
            npcLabel.hidden = true;
            return;
        }

        anchor.set(npcPos.x, 1.38, npcPos.z);
        if (toTarget.sub2(anchor, eye).dot(cameraEntity.forward) <= 0) {
            npcFocused = false;
            npcLabel.hidden = true;
            return;
        }

        camera.worldToScreen(anchor, screen);
        const { clientWidth: width, clientHeight: height } = app.graphicsDevice.canvas;
        const dx = Math.abs(screen.x - width / 2) / width;
        const dy = Math.abs(screen.y - height / 2) / height;
        npcFocused = dx < 0.22 && dy < 0.34;
        if (!npcFocused) {
            npcLabel.hidden = true;
            return;
        }

        const labelPos = new Vec3().copy(cameraEntity.right).mulScalar(0.36).add(anchor);
        camera.worldToScreen(labelPos, screen);
        npcLabel.style.left = `${Math.max(12, Math.min(screen.x, width - npcLabel.offsetWidth - 12))}px`;
        npcLabel.style.top = `${screen.y}px`;
        npcLabel.classList.add('is-focused');
        npcLabel.hidden = false;
    };

    app.on('update', onUpdate);
    app.on('destroy', () => {
        setDynamicKeepOut(null);
        if (errorDisclaimerTimer !== null) {
            window.clearTimeout(errorDisclaimerTimer);
            errorDisclaimerTimer = null;
        }
        app.off('update', onUpdate);
        app.off('piece:panel-state', onPanelState);
        app.off('piece:inspect-denied', onInspectDenied);
        app.off('reflection:open', onOpenReflection);
        app.off('tour:complete', onTourReset);
        window.removeEventListener('keydown', onKeyDown);
    });
}
