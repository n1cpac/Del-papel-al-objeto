import type { AppBase, Entity } from 'playcanvas';
import { RESOLUTION_FIXED } from 'playcanvas';

import { WalkController } from './walk-controller';

const resolutionKey = 'del-papel-resolution';
const volumeKey = 'del-papel-music-volume';
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
export function mountStartScreen(app: AppBase, camera: Entity): void {
    const screen = required<HTMLElement>('#start-screen');
    const hud = required<HTMLElement>('#experience-hud');
    const banner = required<HTMLElement>('#start-brand');
    const topbar = required<HTMLElement>('.topbar');
    const enter = required<HTMLButtonElement>('#start-enter');
    const optionsToggle = required<HTMLButtonElement>('#start-options-toggle');
    const options = required<HTMLElement>('#start-options');
    const resolution = required<HTMLSelectElement>('#render-resolution');
    const volume = required<HTMLInputElement>('#music-volume');
    const volumeValue = required<HTMLOutputElement>('#music-volume-value');
    const menu = required<HTMLElement>('#start-menu');
    const loading = required<HTMLElement>('#start-loading');
    const welcome = required<HTMLElement>('#welcome-message');
    const walk = camera.script?.get(WalkController);
    if (!(walk instanceof WalkController)) {
        throw new Error('La pantalla de inicio necesita el controlador del visitante.');
    }

    walk.paused = true;

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

    const volumeSetting = readSetting(volumeKey);
    const savedVolume = volumeSetting === null ? Number.NaN : Number(volumeSetting);
    if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100) {
        volume.value = String(savedVolume);
    }
    const updateVolume = (): void => {
        volumeValue.textContent = `${volume.value}%`;
        saveSetting(volumeKey, volume.value);
    };
    volume.addEventListener('input', updateVolume);
    updateVolume();

    const toggleOptions = (): void => {
        const show = options.hidden;
        options.hidden = !show;
        optionsToggle.setAttribute('aria-expanded', String(show));
    };
    optionsToggle.addEventListener('click', toggleOptions);

    let started = false;
    const onStart = async (): Promise<void> => {
        if (started) return;
        started = true;
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

        const first = banner.getBoundingClientRect();
        banner.classList.remove('intro-brand');
        topbar.append(banner);
        hud.classList.remove('is-intro');
        const last = banner.getBoundingClientRect();
        const transitionDuration = reducedMotion ? 0 : 900;
        banner.style.transformOrigin = 'top left';
        banner.style.transition = 'none';
        banner.style.transform = `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`;
        void banner.offsetWidth;
        requestAnimationFrame(() => {
            banner.style.transition = `transform ${transitionDuration}ms cubic-bezier(.2,.75,.25,1)`;
            banner.style.transform = 'none';
        });

        screen.classList.add('is-exiting');
        await wait(transitionDuration);
        screen.hidden = true;
        walk.paused = false;

        welcome.hidden = false;
        await wait(4000);
        welcome.classList.add('is-leaving');
        await wait(reducedMotion ? 0 : 700);
        welcome.hidden = true;
        welcome.classList.remove('is-leaving');
    };
    enter.addEventListener('click', onStart);

    app.on('destroy', () => {
        window.removeEventListener('resize', applyResolution);
        resolution.removeEventListener('change', onResolution);
        volume.removeEventListener('input', updateVolume);
    });
}
