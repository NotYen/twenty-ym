import { useAgentChatContextOrThrow } from '@/ai/hooks/useAgentChatContextOrThrow';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { t } from '@lingui/core/macro';
import { Button } from 'twenty-ui/input';

export const SendMessageButton = ({
  records,
}: {
  records?: ObjectRecord[];
}) => {
  const { handleSendMessage, isLoading, input } = useAgentChatContextOrThrow();

  return (
    <Button
      onClick={() => handleSendMessage(records)}
      disabled={!input || isLoading}
      variant="primary"
      accent="blue"
      size="small"
      title={t`Send`}
    />
  );
};
