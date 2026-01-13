import { fromNavigator, fromStorage, fromUrl } from '@lingui/detect-locale';
import { APP_LOCALES } from 'twenty-shared/translations';
import { isDefined, isValidLocale, normalizeLocale } from 'twenty-shared/utils';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logDebug } from '~/utils/logDebug';

export const initialI18nActivate = () => {
  const urlLocale = fromUrl('locale');
  const storageLocale = fromStorage('locale');
  const navigatorLocale = fromNavigator();

  logDebug('[i18n] initialI18nActivate:', {
    urlLocale,
    storageLocale,
    navigatorLocale,
  });

  let locale: keyof typeof APP_LOCALES = APP_LOCALES.en;

  const normalizedUrlLocale = isDefined(urlLocale)
    ? normalizeLocale(urlLocale)
    : null;
  const normalizedStorageLocale = isDefined(storageLocale)
    ? normalizeLocale(storageLocale)
    : null;
  const normalizedNavigatorLocale = isDefined(navigatorLocale)
    ? normalizeLocale(navigatorLocale)
    : null;

  if (isDefined(normalizedUrlLocale) && isValidLocale(normalizedUrlLocale)) {
    locale = normalizedUrlLocale;
    try {
      localStorage.setItem('locale', normalizedUrlLocale);
    } catch (error) {
      logDebug('[i18n] Failed to save locale to localStorage:', error);
    }
  } else if (
    isDefined(normalizedStorageLocale) &&
    isValidLocale(normalizedStorageLocale)
  ) {
    locale = normalizedStorageLocale;
  } else if (
    isDefined(normalizedNavigatorLocale) &&
    isValidLocale(normalizedNavigatorLocale)
  ) {
    locale = normalizedNavigatorLocale;
  }

  dynamicActivate(locale);
};
