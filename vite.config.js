import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
base: '/measurements-app/',

    plugins: [
        VitePWA({
            registerType: 'autoUpdate',

            manifest: {
                name: 'My Measurements',
                short_name: 'Measurements',
                description: 'Track weight and waist measurements',
                theme_color: '#333333',
                background_color: '#f5f5f5',
                display: 'standalone',

                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
});