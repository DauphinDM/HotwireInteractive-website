import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { i18nPlugin } from './scripts/i18n-vite-plugin.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));

// Vite does not execute PHP. Never serve PHP source as a successful contact API.
function phpRequiredMiddleware(req, res, next) {
  if (!req.url?.split('?')[0].startsWith('/api/')) return next();
  res.statusCode = 503;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, message: 'The contact service needs PHP. Run the built site on a PHP-enabled server; Vite cannot send inquiries.' }));
}

export default {
  root,
  appType: 'mpa',
  plugins: [i18nPlugin(root), {
    name: 'php-contact-safety',
    configureServer(server) { server.middlewares.use(phpRequiredMiddleware); },
    configurePreviewServer(server) { server.middlewares.use(phpRequiredMiddleware); },
  }],
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const locale = id.replaceAll('\\', '/').match(/\/src\/i18n\/messages\/(en|nl|fr|de)\.json$/)?.[1];
          if (locale) return `locale-${locale}`;
        },
      },
      input: {
        main: resolve(root, 'index.html'),
        websites: resolve(root, 'websites/index.html'),
        pricing: resolve(root, 'websites/pricing/index.html'),
        examples: resolve(root, 'websites/examples/index.html'),
        exampleLocal: resolve(root, 'websites/examples/local/index.html'),
        examplePortfolio: resolve(root, 'websites/examples/portfolio/index.html'),
        exampleShop: resolve(root, 'websites/examples/shop/index.html'),
        exampleBooking: resolve(root, 'websites/examples/booking/index.html'),
        agreement: resolve(root, 'websites/agreement/index.html'),
        privacy: resolve(root, 'privacy/index.html'),
        terms: resolve(root, 'terms/index.html'),
        cookies: resolve(root, 'cookies/index.html'),
        team: resolve(root, 'team/index.html'),
        dauphindm: resolve(root, 'team/dauphindm/index.html'),
        liamvl: resolve(root, 'team/liamvl/index.html'),
        notFound: resolve(root, '404.html'),
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
};
