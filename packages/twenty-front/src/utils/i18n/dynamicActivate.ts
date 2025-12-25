import { i18n } from '@lingui/core';
import { APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
import { logDebug } from '~/utils/logDebug';

export const dynamicActivate = async (locale: keyof typeof APP_LOCALES) => {
  logDebug(`[i18n] dynamicActivate called with locale: ${locale}`);

  if (!Object.values(APP_LOCALES).includes(locale)) {
    logDebug(`[i18n] Invalid locale "${locale}", defaulting to "en"`);
    locale = SOURCE_LOCALE;
  }
  const { messages } = await import(`../../locales/generated/${locale}.ts`);
  i18n.load(locale, messages);
  i18n.activate(locale);

  logDebug(`[i18n] Activated locale: ${locale}, i18n.locale: ${i18n.locale}`);
};
