import type { AppBase } from 'playcanvas';

/** Música de fondo (archivos en public/audio). Menú y recorrido comparten pista: la música continúa sin corte al entrar. */
export const tracks = {
    menu: './audio/recorrido.mp3',
    tour: './audio/recorrido.mp3'
};

/** Canal de volumen: música de fondo o canción de una pieza; cada uno se regula por separado en Opciones. */
export type AudioKind = 'music' | 'piece';

// Fundido cruzado: la pista que sale baja un poco antes de que la nueva termine de subir.
const fadeInSeconds = 2;
const fadeOutSeconds = 1.5;

export type Music = {
    /**
     * Cambia a la pista indicada con fundido; `null` silencia. Cada pista recuerda dónde quedó y se retoma desde ahí.
     * `gain` (0…1) atenúa una pista concreta respecto al volumen de su canal.
     */
    play(src: string | null, kind?: AudioKind, gain?: number): void;
    /** Volumen de un canal, de 0 a 1. */
    setVolume(kind: AudioKind, volume: number): void;
};

/**
 * Música en bucle con fundido cruzado entre pistas.
 * El navegador bloquea el audio hasta el primer gesto del visitante: la pista pedida antes suena con ese gesto.
 */
export function createMusic(app: AppBase): Music {
    const elements = new Map<string, HTMLAudioElement>();
    // Pistas que suenan o se están apagando: ganancia propia, canal, avance del fundido (0…1) y si debe sonar.
    const playing = new Map<HTMLAudioElement, { gain: number; kind: AudioKind; level: number; active: boolean }>();
    const volumes: Record<AudioKind, number> = { music: 0.5, piece: 0.5 };
    let current: HTMLAudioElement | null = null;

    const resume = (): void => {
        // Si el navegador aún no permite audio, play() se rechaza y se reintenta con el siguiente gesto.
        current?.play().catch(() => undefined);
    };

    const play = (src: string | null, kind: AudioKind = 'music', gain = 1): void => {
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
        const previous = current ? playing.get(current) : undefined;
        if (previous) {
            previous.active = false;
        }
        current = next;
        if (current) {
            // Si la pista aún se estaba apagando, vuelve a subir desde donde iba, sin saltos.
            const entry = playing.get(current);
            if (entry) {
                Object.assign(entry, { gain, kind, active: true });
            } else {
                playing.set(current, { gain, kind, level: 0, active: true });
            }
            resume();
        }
    };

    // shortcut: iOS Safari ignora audio.volume (fundidos y volumen no aplican allí); usar Web Audio (GainNode) si hace falta.
    const onUpdate = (dt: number): void => {
        for (const [audio, entry] of playing) {
            // Una pista bloqueada por el navegador (aún sin gesto) no avanza su fundido: así no entra de golpe al desbloquearse.
            if (entry.active && audio.paused) {
                continue;
            }
            entry.level = entry.active
                ? Math.min(1, entry.level + dt / fadeInSeconds)
                : Math.max(0, entry.level - dt / fadeOutSeconds);
            // Curva cuadrática: el oído percibe el volumen de forma logarítmica; así el fundido suena parejo y no cae de golpe al final.
            audio.volume = Math.min(1, entry.gain * volumes[entry.kind] * entry.level * entry.level);
            if (!entry.active && entry.level === 0) {
                // Pausar (no detener) conserva la posición: al volver, la canción sigue donde quedó.
                audio.pause();
                playing.delete(audio);
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
    // Solo algunos eventos cuentan como gesto para el navegador: con el dedo, al levantarlo (pointerup / touchend), no al tocar.
    const gestureEvents = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
    gestureEvents.forEach((type) => window.addEventListener(type, onGesture, true));
    document.addEventListener('visibilitychange', onVisibility);

    app.on('destroy', () => {
        app.off('update', onUpdate);
        gestureEvents.forEach((type) => window.removeEventListener(type, onGesture, true));
        document.removeEventListener('visibilitychange', onVisibility);
        elements.forEach((audio) => audio.pause());
    });

    return {
        play,
        setVolume: (kind, value) => {
            volumes[kind] = Math.min(1, Math.max(0, value));
        }
    };
}
