import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';

/**
 * Hook to translate tab titles for both PageLayout and RecordShow systems.
 * Uses lingui t function with English source text as keys.
 */
export const useTranslateTabTitle = () => {
  const { t } = useLingui();

  const translateTabTitle = useCallback(
    (title: string): string => {
      const translations: Record<string, string> = {
        Timeline: t`Timeline`,
        Tasks: t`Tasks`,
        Notes: t`Notes`,
        Note: t`Note`,
        Files: t`Files`,
        Emails: t`Emails`,
        Calendar: t`Calendar`,
        Home: t`Home`,
        Fields: t`Fields`,
        Relations: t`Relations`,
      };
      return translations[title] || title;
    },
    [t],
  );

  return { translateTabTitle };
};
