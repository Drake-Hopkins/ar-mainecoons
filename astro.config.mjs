import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://drake-hopkins.github.io/ar-mainecoons/',
  base: 'ar-mainecoons',
  integrations: [tailwind()]
});

