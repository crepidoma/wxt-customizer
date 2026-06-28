import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module', '@crepidoma/wxt-sized-icons'],
  manifest: {
    default_locale: 'en',
    permissions: ['storage'],
  },
  sizedIcons: {
    baseIconPath: './public/wxt.svg',
  },
});
