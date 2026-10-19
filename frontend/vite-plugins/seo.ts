import type { HtmlTagDescriptor, Plugin } from 'vite';
import { BRAND, PHONE_TEL } from '../src/config';
import { FAQ, HERO } from '../src/content';

/**
 * Всё, что нужно поисковикам:
 *  - robots.txt и sitemap.xml (создаются при сборке);
 *  - canonical, Open Graph и Twitter-карточка с абсолютными адресами (когда известен адрес сайта SITE_URL);
 *  - метки подтверждения владения для Яндекс Вебмастера и Google Search Console;
 *  - демо-сборка закрыта от индексации (noindex), чтобы копия сайта не конкурировала с настоящим.
 */
interface SeoOptions {
  base: string;
  /** Адрес сайта без слеша в конце, например https://example.ru. Пусто, если ещё не известен. */
  siteUrl: string;
  demo: boolean;
  yandexVerification?: string;
  googleVerification?: string;
}

const SITE_TITLE = HERO.title.replace(/ /g, ' ');
const SITE_DESCRIPTION = 'Откачка септиков, выгребных ям и шамбо ассенизаторской машиной. Позвоните +7 (4212) 20-60-06 или оставьте номер.';

/**
 * Структурированные данные для поисковиков: карточка местной компании (телефон и зона обслуживания)
 * и вопросы-ответы. Тексты берутся из src/content.ts, поэтому всегда совпадают с тем, что видит посетитель.
 */
function structuredData(url: string) {
  const nbsp = / /g;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${url}#business`,
        name: BRAND,
        description: HERO.lead.replace(nbsp, ' '),
        telephone: PHONE_TEL,
        ...(url ? { url, image: `${url}og-image.png` } : {}),
        address: { '@type': 'PostalAddress', addressLocality: 'Хабаровск', addressRegion: 'Хабаровский край', addressCountry: 'RU' },
        areaServed: [
          { '@type': 'City', name: 'Хабаровск' },
          { '@type': 'AdministrativeArea', name: 'Хабаровский район' },
        ],
        knowsAbout: ['Откачка септиков', 'Откачка выгребных ям', 'Откачка шамбо', 'Вывоз на утилизацию'],
        contactPoint: { '@type': 'ContactPoint', telephone: PHONE_TEL, contactType: 'customer service', areaServed: 'RU', availableLanguage: 'ru' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };
}

export function seoPlugin({ base, siteUrl, demo, yandexVerification, googleVerification }: SeoOptions): Plugin {
  const indexable = !demo;
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' });

  return {
    name: 'shambo-seo',
    buildStart() {
      if (indexable && !siteUrl) {
        this.warn('SITE_URL не задан: sitemap.xml, canonical и og:image без адреса сайта не создаются. Укажите SITE_URL=https://ваш-домен в .env.');
      }
    },
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [];
      if (demo) tags.push(meta({ name: 'robots', content: 'noindex, nofollow' }));
      if (yandexVerification) tags.push(meta({ name: 'yandex-verification', content: yandexVerification }));
      if (googleVerification) tags.push(meta({ name: 'google-site-verification', content: googleVerification }));
      if (indexable && siteUrl) {
        const url = `${siteUrl}${base}`;
        const image = `${url}og-image.png`;
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },
          meta({ property: 'og:url', content: url }),
          meta({ property: 'og:site_name', content: 'Откачка шамбо' }),
          meta({ property: 'og:image', content: image }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({ property: 'og:image:alt', content: SITE_TITLE }),
          meta({ name: 'twitter:card', content: 'summary_large_image' }),
          meta({ name: 'twitter:title', content: SITE_TITLE }),
          meta({ name: 'twitter:description', content: SITE_DESCRIPTION }),
          meta({ name: 'twitter:image', content: image }),
        );
      }
      if (indexable) {
        tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(structuredData(siteUrl ? `${siteUrl}${base}` : '')), injectTo: 'head' });
      }
      return tags;
    },
    generateBundle() {
      const robots = !indexable
        ? 'User-agent: *\nDisallow: /\n'
        : `User-agent: *\nAllow: /\nDisallow: /api/\n${siteUrl ? `\nSitemap: ${siteUrl}${base}sitemap.xml\n` : ''}`;
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });

      if (indexable && siteUrl) {
        const today = new Date().toISOString().slice(0, 10);
        // Политика и согласие в карту сайта не включаем: в поиске они не нужны
        const pages = [{ loc: `${siteUrl}${base}`, priority: '1.0' }];
        const urls = pages
          .map((p) => `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`)
          .join('\n');
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
      }
    },
  };
}
