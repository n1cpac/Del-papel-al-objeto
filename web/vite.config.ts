import { defineConfig } from 'vite';

export default defineConfig({
    // Builds use relative asset URLs so the site can be hosted from a project subdirectory.
    base: './',
    build: {
        chunkSizeWarningLimit: 3000
    }
});
