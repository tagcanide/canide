import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: o site é servido em https://<usuario>.github.io/<repositorio>/.
// Com base relativa ('./') os assets funcionam nesse subcaminho e também num domínio próprio,
// porque o site é uma página única com navegação por âncora.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');

  return {
    base: env.VITE_BASE || './',
    plugins: [
      react(),
      {
        name: 'canide-seo-files',
        // robots.txt e sitemap.xml dependem do endereço público, definido em VITE_SITE_URL.
        generateBundle() {
          const robots = ['User-agent: *', 'Allow: /'];
          if (siteUrl) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`);
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' });
          if (siteUrl) {
            this.emitFile({
              type: 'asset',
              fileName: 'sitemap.xml',
              source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`
            });
          }
        }
      }
    ],
    build: {
      target: 'es2020',
      assetsInlineLimit: 2048,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        // Duas páginas: o site e o controle remoto do celular (controle.html).
        input: { main: 'index.html', controle: 'controle.html' },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/animejs')) return 'anime';
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          }
        }
      }
    }
  };
});
