import type { AppBase, Entity } from 'playcanvas';
import { RESOLUTION_FIXED } from 'playcanvas';

import type { AudioKind, Music } from './audio';
import { tracks } from './audio';
import { WalkController } from './walk-controller';

const resolutionKey = 'del-papel-resolution';
const volumeKey = 'del-papel-music-volume';
const pieceVolumeKey = 'del-papel-piece-volume';
const wait = (milliseconds: number): Promise<void> =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function required<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Falta el elemento de inicio: ${selector}`);
    }
    return element;
}

function readSetting(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function saveSetting(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // La experiencia sigue funcionando aunque el navegador no permita guardar preferencias.
    }
}

/** Menú inicial, ajustes de calidad y secuencia de bienvenida. */
export function mountStartScreen(app: AppBase, camera: Entity, music: Music): void {
    const screen = required<HTMLElement>('#start-screen');
    const hud = required<HTMLElement>('#experience-hud');
    const banner = required<HTMLElement>('#start-brand');
    const topbar = required<HTMLElement>('.topbar');
    const enter = required<HTMLButtonElement>('#start-enter');
    const optionsToggle = required<HTMLButtonElement>('#start-options-toggle');
    const optionsBackdrop = required<HTMLElement>('#start-options-backdrop');
    const optionsClose = required<HTMLButtonElement>('#start-options-close');
    const resolution = required<HTMLSelectElement>('#render-resolution');
    const volume = required<HTMLInputElement>('#music-volume');
    const volumeValue = required<HTMLOutputElement>('#music-volume-value');
    const pieceVolume = required<HTMLInputElement>('#piece-volume');
    const pieceVolumeValue = required<HTMLOutputElement>('#piece-volume-value');
    const menu = required<HTMLElement>('#start-menu');
    const loading = required<HTMLElement>('#start-loading');
    const welcome = required<HTMLElement>('#welcome-message');
    const exitButton = required<HTMLButtonElement>('#exit-tour');
    const exitConfirm = required<HTMLElement>('#exit-confirm');
    const exitCancel = required<HTMLButtonElement>('#exit-cancel');
    const exitAccept = required<HTMLButtonElement>('#exit-accept');
    const walk = camera.script?.get(WalkController);
    if (!(walk instanceof WalkController)) {
        throw new Error('La pantalla de inicio necesita el controlador del visitante.');
    }

    walk.paused = true;

    // Muestra la página cuando el logo ya está decodificado; si falla la imagen, se muestra igual.
    Promise.resolve(banner.querySelector('img')?.decode())
        .catch(() => undefined)
        .then(() => document.body.classList.add('is-ready'));

    const savedResolution = readSetting(resolutionKey);
    resolution.value = savedResolution && ['480', '720', '1080'].includes(savedResolution) ? savedResolution : '720';
    const applyResolution = (): void => {
        const height = Number(resolution.value);
        const aspect = app.graphicsDevice.canvas.clientWidth / Math.max(1, app.graphicsDevice.canvas.clientHeight);
        app.setCanvasResolution(RESOLUTION_FIXED, Math.round(height * aspect), height);
    };
    const onResolution = (): void => {
        saveSetting(resolutionKey, resolution.value);
        applyResolution();
    };
    resolution.addEventListener('change', onResolution);
    window.addEventListener('resize', applyResolution);
    applyResolution();

    // Volúmenes de la música de fondo y de las canciones de las piezas: se guardan y se aplican al instante.
    const volumeControls: [HTMLInputElement, HTMLOutputElement, string, AudioKind][] = [
        [volume, volumeValue, volumeKey, 'music'],
        [pieceVolume, pieceVolumeValue, pieceVolumeKey, 'piece']
    ];
    const removeVolumeListeners = volumeControls.map(([input, output, key, kind]) => {
        const setting = readSetting(key);
        const saved = setting === null ? Number.NaN : Number(setting);
        if (Number.isFinite(saved) && saved >= 0 && saved <= 100) {
            input.value = String(saved);
        }
        const update = (): void => {
            output.textContent = `${input.value}%`;
            music.setVolume(kind, Number(input.value) / 100);
            saveSetting(key, input.value);
        };
        input.addEventListener('input', update);
        update();
        return () => input.removeEventListener('input', update);
    });

    // Popup de opciones: mientras está abierto el menú queda inerte (sin foco ni clics por detrás).
    const setOptions = (open: boolean): void => {
        optionsBackdrop.classList.toggle('is-open', open);
        optionsToggle.setAttribute('aria-expanded', String(open));
        menu.inert = open;
        (open ? optionsClose : optionsToggle).focus();
    };
    // Confirmación de salida: el visitante se detiene mientras decide; al cancelar recupera el estado que tenía.
    let pausedBeforeExit = false;
    const setExitConfirm = (open: boolean): void => {
        if (open === exitConfirm.classList.contains('is-open')) {
            return;
        }
        if (open) {
            pausedBeforeExit = walk.paused;
            walk.paused = true;
        } else {
            walk.paused = pausedBeforeExit;
        }
        exitConfirm.classList.toggle('is-open', open);
        exitButton.setAttribute('aria-expanded', String(open));
        (open ? exitCancel : exitButton).focus();
    };
    exitButton.addEventListener('click', () => setExitConfirm(true));
    exitCancel.addEventListener('click', () => setExitConfirm(false));
    exitConfirm.addEventListener('click', (event) => {
        if (event.target === exitConfirm) {
            setExitConfirm(false);
        }
    });
    // Recargar devuelve al menú con todo en su estado inicial (cámara, inspección, música y banner).
    exitAccept.addEventListener('click', () => window.location.reload());

    const onOptionsKey = (event: KeyboardEvent): void => {
        if (event.code !== 'Escape') {
            return;
        }
        if (optionsBackdrop.classList.contains('is-open')) {
            setOptions(false);
        } else if (exitConfirm.classList.contains('is-open')) {
            setExitConfirm(false);
        }
    };
    optionsToggle.addEventListener('click', () => setOptions(true));
    optionsClose.addEventListener('click', () => setOptions(false));
    optionsBackdrop.addEventListener('click', (event) => {
        if (event.target === optionsBackdrop) {
            setOptions(false);
        }
    });
    window.addEventListener('keydown', onOptionsKey);

    let started = false;
    const onStart = async (): Promise<void> => {
        if (started) return;
        started = true;
        music.play(tracks.tour);
        enter.disabled = true;
        optionsToggle.disabled = true;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        menu.classList.add('is-leaving');
        await wait(reducedMotion ? 0 : 250);
        menu.hidden = true;
        loading.hidden = false;
        requestAnimationFrame(() => loading.classList.add('is-visible'));
        await wait(3000);
        loading.classList.add('is-leaving');
        await wait(reducedMotion ? 0 : 400);
        loading.hidden = true;
        loading.classList.remove('is-leaving');

        // El arte (2:1) pasa de la portada a la esquina con escala uniforme: se mide la imagen, no el marco.
        const logo = banner.querySelector('img') ?? banner;
        const first = logo.getBoundingClientRect();
        banner.classList.remove('intro-brand');
        topbar.append(banner);
        hud.classList.remove('is-intro');
        hud.classList.add('is-landing');
        const last = logo.getBoundingClientRect();
        const frame = banner.getBoundingClientRect();
        const transitionDuration = reducedMotion ? 0 : 900;
        banner.style.transformOrigin = `${last.left - frame.left}px ${last.top - frame.top}px`;
        banner.style.transition = 'none';
        banner.style.transform = `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width})`;
        void banner.offsetWidth;
        requestAnimationFrame(() => {
            banner.style.transition = `transform ${transitionDuration}ms cubic-bezier(.2,.75,.25,1)`;
            banner.style.transform = 'none';
        });

        screen.classList.add('is-exiting');
        await wait(transitionDuration);
        screen.hidden = true;
        walk.paused = false;
        // Limpia la animación en línea y deja que el marco y los controles aparezcan con sus transiciones de CSS.
        banner.style.transition = '';
        banner.style.transform = '';
        banner.style.transformOrigin = '';
        hud.classList.remove('is-landing');

        welcome.hidden = false;
        await wait(4000);
        welcome.classList.add('is-leaving');
        await wait(reducedMotion ? 0 : 700);
        welcome.hidden = true;
        welcome.classList.remove('is-leaving');
    };
    enter.addEventListener('click', onStart);
    // Suena desde el primer gesto en el menú (el navegador no permite audio antes).
    music.play(tracks.menu);

    app.on('destroy', () => {
        window.removeEventListener('resize', applyResolution);
        window.removeEventListener('keydown', onOptionsKey);
        resolution.removeEventListener('change', onResolution);
        removeVolumeListeners.forEach((remove) => remove());
    });
}
