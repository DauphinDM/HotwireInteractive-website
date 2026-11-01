import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LANGUAGE_CODES, ORIGIN, splitLocalePath, localePath } from '../src/i18n/config.js';
import { enhanceShell, localizeHtml } from './i18n-html.mjs';

export function i18nPlugin(root) {
  let catalogs;
  const load = async () => catalogs ||= Object.fromEntries(await Promise.all(LANGUAGE_CODES.map(async (code) => [code,
    JSON.parse(await readFile(resolve(root, `src/i18n/messages/${code}.json`), 'utf8'))])));
  return {
    name: 'hotwire-localized-pages',
    configureServer(server) {
      server.watcher.add(resolve(root, 'src/fragments/contact-composer.html'));
      server.watcher.on('change', (file) => {
        const path = file.replaceAll('\\', '/');
        if (path.includes('/src/i18n/messages/')) catalogs = undefined;
        if (path.endsWith('/src/fragments/contact-composer.html')) server.ws.send({ type: 'full-reload' });
      });
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, ORIGIN);
        const { locale, path } = splitLocalePath(url.pathname);
        if (locale === 'en' || !(path.endsWith('/') || path.endsWith('.html'))) return next();
        try {
          const source = await readFile(resolve(root, path.slice(1) + (path.endsWith('/') ? 'index.html' : '')), 'utf8');
          const html = await server.transformIndexHtml(url.pathname, source);
          res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
        } catch (error) { if (error.code === 'ENOENT') return next(); next(error); }
      });
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        const { locale, path } = splitLocalePath(context.path.replace(/index\.html$/, ''));
        return localizeHtml(enhanceShell(html, path), path, locale, (await load())[locale]);
      },
    },
    generateBundle: { order: 'post', async handler(_, bundle) {
      const dictionaries = await load();
      const paths = [];
      // Vite has already rewritten resource URLs to production assets at this stage.
      for (const asset of Object.values(bundle).filter((file) => file.type === 'asset' && file.fileName.endsWith('.html'))) {
        const path = '/' + asset.fileName.replace(/index\.html$/, '');
        if ((path !== '/404.html' && !path.includes('/examples/')) || path === '/websites/examples/') paths.push(path);
        for (const locale of LANGUAGE_CODES.filter((code) => code !== 'en')) {
          // Strip English translation markers before translating its source text again.
          const html = localizeHtml(String(asset.source), path, locale, dictionaries[locale]);
          this.emitFile({ type: 'asset', fileName: locale + '/' + asset.fileName, source: html });
        }
      }
      // Public catalogues support the standalone PHP form; no visitor text is translated remotely.
      for (const locale of LANGUAGE_CODES) this.emitFile({ type: 'asset', fileName: `i18n/${locale}.json`, source: JSON.stringify(dictionaries[locale]) });
      const urls = paths.flatMap((path) => LANGUAGE_CODES.map((locale) => `<url><loc>${ORIGIN}${localePath(path, locale)}</loc>${LANGUAGE_CODES.map((other) => `<xhtml:link rel="alternate" hreflang="${other}" href="${ORIGIN}${localePath(path, other)}"/>`).join('')}</url>`));
      // Replace, rather than duplicate, the public sitemap asset.
      if (bundle['sitemap.xml']) delete bundle['sitemap.xml'];
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>` });
    } },
  };
}
