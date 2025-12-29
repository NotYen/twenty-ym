import { defineConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-po';

const SOURCE_LOCALE = 'en';
const APP_LOCALES = {
  [SOURCE_LOCALE]: SOURCE_LOCALE,
  'pseudo-en': 'pseudo-en',
  'af-ZA': 'af-ZA',
  'ar-SA': 'ar-SA',
  'ca-ES': 'ca-ES',
  'cs-CZ': 'cs-CZ',
  'da-DK': 'da-DK',
  'de-DE': 'de-DE',
  'el-GR': 'el-GR',
  'es-ES': 'es-ES',
  'fi-FI': 'fi-FI',
  'fr-FR': 'fr-FR',
  'he-IL': 'he-IL',
  'hu-HU': 'hu-HU',
  'it-IT': 'it-IT',
  'ja-JP': 'ja-JP',
  'ko-KR': 'ko-KR',
  'nl-NL': 'nl-NL',
  'no-NO': 'no-NO',
  'pl-PL': 'pl-PL',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  'ro-RO': 'ro-RO',
  'ru-RU': 'ru-RU',
  'sr-Cyrl': 'sr-Cyrl',
  'sv-SE': 'sv-SE',
  'tr-TR': 'tr-TR',
  'uk-UA': 'uk-UA',
  'vi-VN': 'vi-VN',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
};

export default defineConfig({
  sourceLocale: SOURCE_LOCALE,
  locales: Object.values(APP_LOCALES),
  pseudoLocale: 'pseudo-en',
  fallbackLocales: {
    'pseudo-en': 'en',
    default: SOURCE_LOCALE,
  },
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['src'],
    },
  ],
  catalogsMergePath: '<rootDir>/src/locales/generated/{locale}',
  compileNamespace: 'ts',
  format: formatter({ lineNumbers: false, printLinguiId: true }),
});
