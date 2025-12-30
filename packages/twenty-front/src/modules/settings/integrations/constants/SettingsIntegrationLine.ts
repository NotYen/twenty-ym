import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { type SettingsIntegrationCategory } from '@/settings/integrations/types/SettingsIntegrationCategory';

export const SETTINGS_INTEGRATION_LINE_CATEGORY: SettingsIntegrationCategory = {
  key: 'native',
  title: 'Native Integrations',
  integrations: [
    {
      from: {
        key: 'twenty',
        image: '/images/integrations/twenty-logo.svg'
      },
      to: {
        key: 'line',
        image: '/images/integrations/line-logo.png'
      },
      type: 'Goto',
      text: 'Configure LINE Official Account integration',
      link: getSettingsPath(SettingsPath.IntegrationsLine),
      linkText: 'Configure',
    },
  ],
};
