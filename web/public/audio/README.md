# Audio

Música de la experiencia (MP3 u OGG, en bucle). Rutas esperadas por `src/experience/audio.ts`:

- `menu.mp3`: menú inicial.
- `recorrido.mp3`: recorrido por la sala. Si es el mismo archivo que el del menú, la música continúa sin corte.
- `piezas/<nombre>.mp3`: opcional por pieza; se asigna con el campo `audio` en `src/experience/pieces.ts` (p. ej. `audio: './audio/piezas/manga.mp3'`).

Mantén los archivos ligeros (128 kbps basta) para no alargar la carga en móvil.
