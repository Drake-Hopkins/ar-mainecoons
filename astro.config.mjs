import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://armainecoons.com',

  integrations: [
    tailwind(),

    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !page.includes('/404'),
    }),

    robotsTxt({
      policy: [
        { userAgent: '*', allow: '/' },
      ],
    }),
  ],
});
