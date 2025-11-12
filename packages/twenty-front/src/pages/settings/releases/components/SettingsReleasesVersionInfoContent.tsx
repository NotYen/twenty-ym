import { backendImageVersionState } from '@/client-config/states/backendImageVersionState';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useRecoilValue } from 'recoil';
import { IconInfoCircle, IconServer } from 'twenty-ui/display';
import { FRONTEND_IMAGE_VERSION } from '~/config';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledNote = styled.p`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 18px;
  margin: 0;
`;

const StyledCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background-color: ${({ theme }) => theme.background.secondary};
  padding: ${({ theme }) => theme.spacing(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const StyledValue = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  word-break: break-all;
`;

export const SettingsReleasesVersionInfoContent = () => {
  const backendImageVersion = useRecoilValue(backendImageVersionState);
  const clientConfigStatus = useRecoilValue(clientConfigApiStatusState);

  const isBackendVersionLoading =
    !clientConfigStatus.isLoadedOnce && clientConfigStatus.isLoading;

  const renderVersion = ({
    version,
    loading,
  }: {
    version: string | undefined;
    loading?: boolean;
  }) => {
    if (loading) {
      return <StyledValue>{t`Loading...`}</StyledValue>;
    }

    return (
      <StyledValue>
        {version && version.trim().length > 0 ? version : t`Unknown`}
      </StyledValue>
    );
  };

  return (
    <StyledContainer>
      <StyledNote>
        {t`Use these values to confirm that your frontend and backend containers are running the expected Docker images.`}
      </StyledNote>
      <StyledCard>
        <StyledRow>
          <StyledLabelWrapper>
            <IconInfoCircle size={16} />
            {t`Frontend image version`}
          </StyledLabelWrapper>
          {renderVersion({ version: FRONTEND_IMAGE_VERSION })}
        </StyledRow>
        <StyledRow>
          <StyledLabelWrapper>
            <IconServer size={16} />
            {t`Backend image version`}
          </StyledLabelWrapper>
          {renderVersion({
            version: backendImageVersion ?? undefined,
            loading: isBackendVersionLoading,
          })}
        </StyledRow>
      </StyledCard>
    </StyledContainer>
  );
};

