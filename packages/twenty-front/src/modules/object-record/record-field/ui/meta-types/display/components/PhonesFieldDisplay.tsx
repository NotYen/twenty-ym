import { useFieldFocus } from '@/object-record/record-field/ui/hooks/useFieldFocus';
import { usePhonesFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/usePhonesFieldDisplay';
import { PhonesDisplay } from '@/ui/field/display/components/PhonesDisplay';
import { useLingui } from '@lingui/react/macro';
import React from 'react';
import { useIcons } from 'twenty-ui/display';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

export const PhonesFieldDisplay = () => {
  const { fieldValue } = usePhonesFieldDisplay();

  const { isFocused } = useFieldFocus();

  const { copyToClipboard } = useCopyToClipboard();

  const { getIcon } = useIcons();

  const { t } = useLingui();

  const IconCircleCheck = getIcon('IconCircleCheck');

  const handleClick = async (
    phoneNumber: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();

    await copyToClipboard(phoneNumber, t`Phone number copied to clipboard`, {
      icon: <IconCircleCheck size={16} color="green" />,
    });
  };

  return (
    <PhonesDisplay
      value={fieldValue}
      isFocused={isFocused}
      onPhoneNumberClick={handleClick}
    />
  );
};
