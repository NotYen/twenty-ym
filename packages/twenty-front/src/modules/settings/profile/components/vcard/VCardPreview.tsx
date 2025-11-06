import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { IconDownload, IconMail, IconPhone, IconBuildingSkyscraper } from 'twenty-ui/display';
import { Avatar } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

import { type VCardData } from '@/settings/profile/components/vcard/types/VCardData';
import { useVCardGenerator } from '@/settings/profile/components/vcard/hooks/useVCardGenerator';

type VCardPreviewProps = {
  data: VCardData;
};

// 主容器（完全使用 vcard-personal-portfolio 的原始 CSS 變數和值）
const StyledPreviewContainer = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: 20px;
  padding: 15px;
  box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
  z-index: 1;
  transition: 0.5s ease-in-out;

  &:hover {
    transform: translateY(-3px);
  }
`;

// 頭像容器（vcard-personal-portfolio 的 .avatar-box）
const StyledAvatarBox = styled.div`
  background: ${({ theme }) => `linear-gradient(
    to bottom right,
    ${theme.background.transparent.medium} 3%,
    ${theme.background.transparent.light} 97%
  )`};
  border-radius: 20px;
  margin: 0 auto 15px;
  width: fit-content;
`;

// 姓名（vcard-personal-portfolio 的 .name）
const StyledName = styled.h2`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.25px;
  margin-bottom: 10px;
  text-align: center;
`;

// 職稱（vcard-personal-portfolio 的 .title）
const StyledTitle = styled.p`
  color: ${({ theme }) => theme.font.color.tertiary};
  background: ${({ theme }) => theme.background.transparent.medium};
  font-size: 13px;
  font-weight: 300;
  padding: 5px 12px;
  border-radius: 8px;
  margin: 0 auto 16px;
  width: fit-content;
  text-align: center;
`;

// 分隔線（vcard-personal-portfolio 的 .separator）
const StyledSeparator = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.border.color.medium};
  margin: 16px 0;
`;

// 聯絡列表（vcard-personal-portfolio 的 .contacts-list）
const StyledContactsList = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

// 聯絡項目（vcard-personal-portfolio 的 .contact-item）
const StyledContactItem = styled.li<{ clickable?: boolean }>`
  min-width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  transition: 0.25s ease;

  &:hover {
    ${({ clickable }) => clickable && 'transform: translateX(3px);'}
  }
`;

// 圖標容器（vcard-personal-portfolio 的 .icon-box）
const StyledIconBox = styled.div`
  position: relative;
  background: ${({ theme }) => `linear-gradient(
    to bottom right,
    ${theme.border.color.medium} 0%,
    ${theme.background.transparent.lighter} 50%
  )`};
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: ${({ theme }) => theme.color.blue};
  box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
  z-index: 1;
  flex-shrink: 0;

  &::before {
    content: "";
    position: absolute;
    inset: 1px;
    background: ${({ theme }) => `linear-gradient(
      to bottom right,
      ${theme.background.transparent.light} 0%,
      ${theme.background.transparent.lighter} 100%
    )`};
    border-radius: inherit;
    z-index: -1;
  }
`;

// 聯絡資訊容器（vcard-personal-portfolio 的 .contact-info）
const StyledContactInfo = styled.div`
  max-width: calc(100% - 46px);
  width: calc(100% - 46px);
`;

// 聯絡標題（vcard-personal-portfolio 的 .contact-title）
const StyledContactTitle = styled.p`
  color: ${({ theme }) => theme.font.color.tertiary};
  opacity: 0.7;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
`;

// 聯絡連結（vcard-personal-portfolio 的 .contact-link）
const StyledContactLink = styled.a`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: 13px;
  text-decoration: none;
  transition: 0.25s ease;

  &:hover {
    color: ${({ theme }) => theme.color.blue};
  }
`;

// 下載按鈕容器
const StyledButtonWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
`;

// vCard 預覽組件（遵循 vcard-personal-portfolio 的完整結構）
export const VCardPreview = ({ data }: VCardPreviewProps) => {
  const { t } = useLingui();
  const { generateVCard, downloadVCard } = useVCardGenerator();

  // 處理下載事件
  const handleDownload = () => {
    const vcardString = generateVCard(data);
    const fileName = `${data.firstName}_${data.lastName}`.replace(/\s+/g, '_');
    downloadVCard(vcardString, fileName);
  };

  // 處理電話點擊
  const handlePhoneClick = () => {
    if (data.phone) {
      window.location.href = `tel:${data.phone}`;
    }
  };

  // 處理 Email 點擊
  const handleEmailClick = () => {
    if (data.email) {
      window.location.href = `mailto:${data.email}`;
    }
  };

  // 組合顯示名稱
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  return (
    <StyledPreviewContainer>
      {/* 頭像 */}
      <StyledAvatarBox>
        <Avatar
          avatarUrl={data.avatarUrl}
          placeholder={fullName}
          size="xl"
          type="rounded"
        />
      </StyledAvatarBox>

      {/* 姓名 */}
      <StyledName>{fullName}</StyledName>

      {/* 職稱 */}
      {data.jobTitle && <StyledTitle>{data.jobTitle}</StyledTitle>}

      {/* 分隔線 */}
      <StyledSeparator />

      {/* 聯絡列表 */}
      <StyledContactsList>
        {/* 公司 */}
        {data.company && (
          <StyledContactItem>
            <StyledIconBox>
              <IconBuildingSkyscraper size={16} />
            </StyledIconBox>
            <StyledContactInfo>
              <StyledContactTitle>{t`Company`}</StyledContactTitle>
              <StyledContactLink as="div">{data.company}</StyledContactLink>
            </StyledContactInfo>
          </StyledContactItem>
        )}

        {/* 電話 */}
        {data.phone && (
          <StyledContactItem clickable onClick={handlePhoneClick}>
            <StyledIconBox>
              <IconPhone size={16} />
            </StyledIconBox>
            <StyledContactInfo>
              <StyledContactTitle>{t`Phone`}</StyledContactTitle>
              <StyledContactLink href={`tel:${data.phone}`}>
                {data.phone}
              </StyledContactLink>
            </StyledContactInfo>
          </StyledContactItem>
        )}

        {/* Email */}
        {data.email && (
          <StyledContactItem clickable onClick={handleEmailClick}>
            <StyledIconBox>
              <IconMail size={16} />
            </StyledIconBox>
            <StyledContactInfo>
              <StyledContactTitle>{t`Email`}</StyledContactTitle>
              <StyledContactLink href={`mailto:${data.email}`}>
                {data.email}
              </StyledContactLink>
            </StyledContactInfo>
          </StyledContactItem>
        )}
      </StyledContactsList>

      {/* 下載按鈕 */}
      <StyledButtonWrapper>
        <Button
          Icon={IconDownload}
          title={t`Download vCard`}
          variant="primary"
          size="small"
          onClick={handleDownload}
          fullWidth
        />
      </StyledButtonWrapper>
    </StyledPreviewContainer>
  );
};
