import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import {
    IconCopy,
    IconEye,
    IconEyeOff,
    IconTrash
} from 'twenty-ui/display';
import { IconButton } from 'twenty-ui/input';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import type { ShareLinkData } from '~/modules/share-link/types/ShareLink';
import { ConfirmationModal } from '~/modules/ui/layout/modal/components/ConfirmationModal';
import { TableCell } from '~/modules/ui/layout/table/components/TableCell';
import { TableRow } from '~/modules/ui/layout/table/components/TableRow';

const StyledShareLinksTableRow = styled(TableRow)`
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    width: 100%;
  }
`;

const StyledTruncatedCell = styled(TableCell)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledEllipsisLabel = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const StyledActionsCell = styled(TableCell)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: flex-end;
  align-items: center;
`;

type SettingsShareLinksTableRowProps = {
  shareLink: ShareLinkData;
  onToggleStatus: (token: string, isActive: boolean) => Promise<void>;
  onDelete: (token: string) => Promise<void>;
};

export const SettingsShareLinksTableRow = ({
  shareLink,
  onToggleStatus,
  onDelete,
}: SettingsShareLinksTableRowProps) => {
  const theme = useTheme();
  const { copyToClipboard } = useCopyToClipboard();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const gridColumns = '3fr 2fr 2fr 2fr 2fr 3fr';

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${shareLink.token}`;
    copyToClipboard(shareUrl, t`Share link copied to clipboard`);
  };

  const handleToggleStatus = async () => {
    setIsProcessing(true);
    try {
      await onToggleStatus(shareLink.token, !shareLink.isActive);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete(shareLink.token);
      setIsDeleteModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatResourceType = (type: string) => {
    switch (type) {
      case 'COMPANY':
        return t`Company`;
      case 'PERSON':
        return t`Person`;
      case 'SALES_QUOTE':
        return t`Sales Quote`;
      case 'DASHBOARD_CHART':
        return t`Dashboard Chart`;
      default:
        return type;
    }
  };

  const formatAccessMode = (mode: string) => {
    return mode === 'PUBLIC' ? t`Public` : t`Login Required`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const isExpired = shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date();

  return (
    <>
      <StyledShareLinksTableRow gridAutoColumns={gridColumns}>
        <StyledTruncatedCell color={theme.font.color.primary}>
          <StyledEllipsisLabel>
            {formatResourceType(shareLink.resourceType)}
          </StyledEllipsisLabel>
        </StyledTruncatedCell>

        <StyledTruncatedCell color={theme.font.color.tertiary}>
          <StyledEllipsisLabel>
            {formatAccessMode(shareLink.accessMode)}
          </StyledEllipsisLabel>
        </StyledTruncatedCell>

        <StyledTruncatedCell
          color={
            isExpired ? theme.font.color.danger : theme.font.color.tertiary
          }
        >
          <StyledEllipsisLabel>
            {formatDate(shareLink.expiresAt)}
          </StyledEllipsisLabel>
        </StyledTruncatedCell>

        <StyledTruncatedCell color={theme.font.color.tertiary}>
          <StyledEllipsisLabel>{shareLink.accessCount}</StyledEllipsisLabel>
        </StyledTruncatedCell>

        <StyledTruncatedCell color={theme.font.color.tertiary}>
          <StyledEllipsisLabel>
            {formatDate(shareLink.lastAccessedAt)}
          </StyledEllipsisLabel>
        </StyledTruncatedCell>

        <StyledActionsCell>
          <IconButton
            Icon={IconCopy}
            size="small"
            variant="tertiary"
            onClick={handleCopyLink}
            ariaLabel={t`Copy link`}
          />
          <IconButton
            Icon={shareLink.isActive ? IconEye : IconEyeOff}
            size="small"
            variant="tertiary"
            onClick={handleToggleStatus}
            disabled={isProcessing}
            ariaLabel={shareLink.isActive ? t`Disable` : t`Enable`}
          />
          <IconButton
            Icon={IconTrash}
            size="small"
            variant="tertiary"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isProcessing}
            ariaLabel={t`Delete`}
          />
        </StyledActionsCell>
      </StyledShareLinksTableRow>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title={t`Delete Share Link`}
        subtitle={t`Are you sure you want to delete this share link? This action cannot be undone.`}
        onConfirmClick={handleDelete}
        deleteButtonText={t`Delete`}
      />
    </>
  );
};
