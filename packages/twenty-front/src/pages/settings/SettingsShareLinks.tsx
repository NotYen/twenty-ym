import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsShareLinksTable } from '@/share-link/components/SettingsShareLinksTable';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import styled from '@emotion/styled';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const SettingsShareLinks = () => {
  const { t } = useLingui();

  return (
    <SubMenuTopBarContainer
      title={t`Share Links`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: <Trans>Share Links</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <StyledContainer>
          <Section>
            <H2Title
              title={t`Share Links`}
              description={t`Manage external share links for your data records and charts.`}
            />
            <SettingsShareLinksTable />
          </Section>
        </StyledContainer>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
