import { type VirtualElement } from '@floating-ui/react';
import { isDefined } from 'twenty-shared/utils';

export const getTooltipReferenceFromBarChartElementAnchor = (
  anchorElement: Element,
  containerId: string,
): {
  reference: VirtualElement;
  boundary: Element;
} => {
  const containerElement = document.getElementById(containerId);

  if (!isDefined(containerElement)) {
    throw new Error(`Chart container not found: ${containerId}`);
  }

  const rect = anchorElement.getBoundingClientRect();

  return {
    reference: {
      getBoundingClientRect: () => rect,
    },
    boundary: containerElement,
  };
};
