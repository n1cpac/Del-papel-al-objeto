import type { AppBase } from 'playcanvas';

export function mountHud(app: AppBase): void {
    const root = document.querySelector<HTMLElement>('#experience-hud');
    const base = document.querySelector<HTMLElement>('#joystick-base');
    const knob = document.querySelector<HTMLElement>('#joystick-knob');
    if (!root || !base || !knob) {
        throw new Error('Falta el contenedor de la interfaz o del joystick.');
    }

    const onJoystick = (baseX: number, baseY: number, stickX: number, stickY: number): void => {
        if (baseX < 0 || baseY < 0 || stickX < 0 || stickY < 0) {
            base.hidden = true;
            knob.hidden = true;
            return;
        }

        base.hidden = false;
        knob.hidden = false;
        base.style.left = `${baseX}px`;
        base.style.top = `${baseY}px`;
        knob.style.left = `${stickX}px`;
        knob.style.top = `${stickY}px`;
    };

    app.on('joystick:left', onJoystick);
    app.on('destroy', () => {
        app.off('joystick:left', onJoystick);
        root.remove();
        base.remove();
        knob.remove();
    });
}
