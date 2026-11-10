// Distancia desde el borde superior donde debe empezar el gesto y recorrido mínimo hacia abajo, en píxeles.
const edgeZone = 40;
const swipeDistance = 60;

// `lock` no está en los tipos DOM de TypeScript porque no todos los navegadores lo implementan.
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

/**
 * Móvil: al tocar la sala pasa a pantalla completa (oculta la barra del navegador) y bloquea la vista horizontal;
 * el navegador exige un gesto, no puede hacerse al cargar. Deslizar hacia abajo desde el borde superior sale.
 * En vertical, el aviso #rotate-overlay (CSS) tapa la sala; tocarlo también entra en horizontal.
 * Sin efecto en escritorio. En navegadores sin Fullscreen API (p. ej. Safari en iPhone) solo queda el aviso.
 */
export function mountMobileFullscreen(canvas: HTMLCanvasElement): void {
    if (!window.matchMedia('(pointer: coarse)').matches) {
        return;
    }
    if (!document.fullscreenEnabled) {
        // Sin pantalla completa no se puede forzar el giro: el aviso solo pide girar a mano.
        document.querySelector<HTMLElement>('.rotate-hint')?.toggleAttribute('hidden', true);
        return;
    }

    const enterLandscape = (): void => {
        if (document.fullscreenElement) {
            return;
        }
        // Si el navegador rechaza la pantalla completa o el bloqueo, la experiencia sigue y el aviso pide girar.
        document.documentElement
            .requestFullscreen({ navigationUI: 'hide' })
            .then(() => (screen.orientation as LockableOrientation).lock?.('landscape'))
            .catch(() => undefined);
    };
    canvas.addEventListener('pointerdown', enterLandscape);
    document.querySelector('#rotate-overlay')?.addEventListener('pointerdown', enterLandscape);

    let startY = -1;
    window.addEventListener(
        'touchstart',
        (event) => {
            const touch = event.touches[0];
            startY = event.touches.length === 1 && touch && touch.clientY < edgeZone ? touch.clientY : -1;
        },
        { passive: true }
    );
    window.addEventListener(
        'touchmove',
        (event) => {
            const touch = event.touches[0];
            if (startY >= 0 && touch && touch.clientY - startY > swipeDistance && document.fullscreenElement) {
                startY = -1;
                void document.exitFullscreen();
            }
        },
        { passive: true }
    );
}
