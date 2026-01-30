import { t } from '@lingui/core/macro';

import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { IconShare } from 'twenty-ui/display';
import { IconButton } from 'twenty-ui/input';

import { ShareLinkModal } from './ShareLinkModal';

interface ShareButtonProps {
  resourceType: 'COMPANY' | 'PERSON' | 'SALES_QUOTE' | 'DASHBOARD_CHART';
  resourceId: string;
  resourceName: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  resourceType,
  resourceId,
  resourceName,
  className,
}) => {
  const { openModal } = useModal();

  // Generate unique modal ID based on resource
  const modalId = `share-link-modal-${resourceType}-${resourceId}`;

  const handleClick = () => {
    openModal(modalId);
  };

  return (
    <>
      <IconButton
        Icon={IconShare}
        size="small"
        variant="secondary"
        onClick={handleClick}
        className={className}
        data-testid="share-button"
        ariaLabel={t`Share ${resourceName}`}
      />

      <ShareLinkModal
        modalId={modalId}
        resourceType={resourceType}
        resourceId={resourceId}
        resourceName={resourceName}
      />
    </>
  );
};
