import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const useScrollTableToPosition = () => {
  const { scrollWrapperHTMLElement } = useScrollWrapperHTMLElement();

  const scrollTableToPosition = useCallback(
    ({
      horizontalScrollInPx,
      verticalScrollInPx,
    }: {
      verticalScrollInPx?: number;
      horizontalScrollInPx?: number;
    }) => {
      if (isDefined(verticalScrollInPx)) {
        scrollWrapperHTMLElement?.scrollTo({
          top: verticalScrollInPx,
        });
      }

      if (isDefined(horizontalScrollInPx)) {
        scrollWrapperHTMLElement?.scrollTo({
          left: horizontalScrollInPx,
        });
      }
    },
    [scrollWrapperHTMLElement],
  );

  return { scrollTableToPosition };
};
