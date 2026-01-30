import { t } from '@lingui/core/macro';

export enum OtherTriggerDefaultLabel {
  LAUNCH_MANUALLY = 'Launch manually',
  ON_A_SCHEDULE = 'On a schedule',
  WEBHOOK = 'Webhook',
}

export const getOtherTriggerLabel = (
  label: OtherTriggerDefaultLabel,
): string => {
  switch (label) {
    case OtherTriggerDefaultLabel.LAUNCH_MANUALLY:
      return t`Launch manually`;
    case OtherTriggerDefaultLabel.ON_A_SCHEDULE:
      return t`On a schedule`;
    case OtherTriggerDefaultLabel.WEBHOOK:
      return t`Webhook`;
  }
};
