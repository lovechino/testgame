import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    publicDir: process.env.PUBLIC_DIR || 'public',
    build: {
        outDir: process.env.OUT_DIR || 'dist',
        emptyOutDir: true,

        // Optimization settings
        sourcemap: false, // Disable sourcemaps to save space
        minify: 'esbuild', // Fast minification

        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000, // 1000 KB

        rollupOptions: {
            output: {
                // Enable code splitting - separate vendor libraries from app code
                manualChunks: (id) => {
                    // Phaser in separate chunk (largest library ~700KB)
                    if (id.includes('node_modules/phaser')) {
                        return 'phaser';
                    }

                    // Howler (audio library) in separate chunk
                    if (id.includes('node_modules/howler')) {
                        return 'howler';
                    }

                    // Iruka SDK in separate chunk
                    if (id.includes('node_modules/@iruka-edu')) {
                        return 'iruka-sdk';
                    }

                    // All other node_modules in vendor chunk
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }

                    // App code stays in main chunk
                },

                // Optimize chunk file names
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            }
        },

        // Enable compression reporting
        reportCompressedSize: true,

        // Optimize dependencies
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },

    // Optimize dependencies during dev
    optimizeDeps: {
        include: ['phaser', 'howler'],
    },

    server: {
        open: true, // tự động mở browser
    },
});
