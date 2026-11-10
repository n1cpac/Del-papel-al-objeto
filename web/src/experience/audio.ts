import type { AppBase } from 'playcanvas';

/** Pistas generales (archivos en public/audio). Si menú y recorrido usan el mismo archivo, la música continúa sin corte. */
export const tracks = {
    menu: './audio/menu.mp3',
    tour: './audio/recorrido.mp3'
};

const fadeSeconds = 0.8;

export type Music = {
    /** Cambia a la pista indicada con fundido; `null` silencia. Una pista retomada sigue desde donde quedó. */
    play(src: string | null): void;
    /** Volumen general, de 0 a 1. */
    setVolume(volume: number): void;
};

/**
 * Música de fondo en bucle con fundido cruzado entre pistas.
 * El navegador bloquea el audio hasta el primer gesto del visitante: la pista pedida antes suena con ese gesto.
 */
export function createMusic(app: AppBase): Music {
    const elements = new Map<string, HTMLAudioElement>();
    // Ganancia objetivo de cada pista que suena o se está apagando: 1 = activa, 0 = fundido de salida.
    const gains = new Map<HTMLAudioElement, number>();
    let current: HTMLAudioElement | null = null;
    let volume = 0.5;

    const resume = (): void => {
        // Si el navegador aún no permite audio, play() se rechaza y se reintenta con el siguiente gesto.
        current?.play().catch(() => undefined);
    };

    const play = (src: string | null): void => {
        let next: HTMLAudioElement | null = null;
        if (src) {
            next = elements.get(src) ?? null;
            if (!next) {
                next = new Audio(src);
                next.loop = true;
                next.volume = 0;
                elements.set(src, next);
            }
        }
        if (next === current) {
            return;
        }
        if (current) {
            gains.set(current, 0);
        }
        current = next;
        if (current) {
            gains.set(current, 1);
            resume();
        }
    };

    // shortcut: iOS Safari ignora audio.volume (fundidos y volumen no aplican allí); usar Web Audio (GainNode) si hace falta.
    const onUpdate = (dt: number): void => {
        const step = dt / fadeSeconds;
        for (const [audio, gain] of gains) {
            const target = gain * volume;
            audio.volume =
                target > audio.volume ? Math.min(target, audio.volume + step) : Math.max(target, audio.volume - step);
            if (gain === 0 && audio.volume === 0) {
                audio.pause();
                gains.delete(audio);
            }
        }
    };
    app.on('update', onUpdate);

    const onGesture = (): void => {
        if (current?.paused) {
            resume();
        }
    };
    // Al cambiar de app o pestaña la música se pausa y vuelve al regresar.
    const onVisibility = (): void => {
        if (document.hidden) {
            current?.pause();
        } else {
            resume();
        }
    };
    window.addEventListener('pointerdown', onGesture, true);
    window.addEventListener('keydown', onGesture, true);
    document.addEventListener('visibilitychange', onVisibility);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        window.removeEventListener('pointerdown', onGesture, true);
        window.removeEventListener('keydown', onGesture, true);
        document.removeEventListener('visibilitychange', onVisibility);
        elements.forEach((audio) => audio.pause());
    });

    return {
        play,
        setVolume: (value) => {
            volume = Math.min(1, Math.max(0, value));
        }
    };
}
