import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useTheme } from '@emotion/react';
import { useLingui } from '@lingui/react/macro';

export const useCopyToClipboard = () => {
  const theme = useTheme();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { t } = useLingui();

  const unsecuredCopyToClipboard = (value: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Unable to copy to clipboard', err);
      throw err;
    }
    document.body.removeChild(textArea);
  };

  const copyToClipboard = async (
    valueAsString: string,
    message?: string,
    options?: { icon?: React.ReactNode },
  ) => {
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(valueAsString);
      } else {
        unsecuredCopyToClipboard(valueAsString);
      }

      enqueueSuccessSnackBar({
        message: message || t`Copied to clipboard`,
      });
    } catch {
      enqueueErrorSnackBar({
        message: t`Couldn't copy to clipboard`,
      });
    }
  };

  return { copyToClipboard };
};
