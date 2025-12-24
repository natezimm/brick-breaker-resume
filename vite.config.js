import { defineConfig } from 'vite';

export default defineConfig({
    // Use relative base path so the app works in subdirectories or root
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    server: {
        port: 8080,
        open: true
    }
});
