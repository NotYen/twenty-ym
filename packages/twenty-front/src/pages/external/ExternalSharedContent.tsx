import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconLoader, IconLock } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { ExternalContentRenderer } from '~/modules/share-link/components/ExternalContentRenderer';
import { useGetSharedContent } from '~/modules/share-link/hooks/useGetSharedContent';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.background.primary};
`;

const StyledHeader = styled.header`
  padding: ${({ theme }) => theme.spacing(4)};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.medium};
  background: ${({ theme }) => theme.background.secondary};
`;

const StyledLogo = styled.div`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledContent = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing(8)};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const StyledLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const StyledErrorTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledErrorMessage = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.secondary};
  max-width: 500px;
`;

const StyledContentTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const StyledFooter = styled.footer`
  padding: ${({ theme }) => theme.spacing(4)};
  border-top: 1px solid ${({ theme }) => theme.border.color.medium};
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

/**
 * 外部分享內容頁面
 * 實現需求 3.1, 3.7
 */
export const ExternalSharedContent = () => {
  const { token } = useParams<{ token: string}>();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { content, loading, error } = useGetSharedContent(token || '', authToken);

  useEffect(() => {
    console.log('[ExternalSharedContent] Component state:', {
      token: token?.substring(0, 10) + '...',
      loading,
      hasError: !!error,
      errorMessage: error,
      hasContent: !!content,
      contentType: content?.resourceType,
    });
  }, [token, loading, error, content]);

  // 檢查是否需要認證
  const isAuthRequired = error?.includes('Authentication required');

  if (!token) {
    return (
      <StyledContainer>
        <StyledHeader>
          <StyledLogo>Y-CRM</StyledLogo>
        </StyledHeader>
        <StyledContent>
          <StyledErrorContainer>
            <StyledErrorTitle>{t`Invalid share link`}</StyledErrorTitle>
            <StyledErrorMessage>
              {t`The share link you're trying to access is invalid.`}
            </StyledErrorMessage>
          </StyledErrorContainer>
        </StyledContent>
        <StyledFooter>{t`Powered by Y-CRM`}</StyledFooter>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledLogo>Y-CRM</StyledLogo>
      </StyledHeader>

      <StyledContent>
        {loading && (
          <StyledLoadingContainer>
            <IconLoader size={32} />
            <div>{t`Loading shared content...`}</div>
          </StyledLoadingContainer>
        )}

        {!loading && isAuthRequired && (
          <StyledErrorContainer>
            <IconLock size={48} style={{ marginBottom: '16px' }} />
            <StyledErrorTitle>{t`Authentication Required`}</StyledErrorTitle>
            <StyledErrorMessage>
              {t`This shared content requires authentication to access. Please sign in to your Y-CRM account to continue.`}
            </StyledErrorMessage>
            <Button
              variant="primary"
              title={t`Sign In to Continue`}
              onClick={() => {
                // 導向登入頁面，並帶上 redirect URL
                window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
              }}
            />
          </StyledErrorContainer>
        )}

        {!loading && error && !isAuthRequired && (
          <StyledErrorContainer>
            <StyledErrorTitle>{t`Unable to load content`}</StyledErrorTitle>
            <StyledErrorMessage>{error}</StyledErrorMessage>
          </StyledErrorContainer>
        )}

        {!loading && !error && content && (
          <>
            <StyledContentTitle>{content.title}</StyledContentTitle>
            <ExternalContentRenderer content={content} />
          </>
        )}
      </StyledContent>

      <StyledFooter>{t`Powered by Y-CRM`}</StyledFooter>
    </StyledContainer>
  );
};
