import { createState } from 'twenty-ui/utilities';

export const backendImageVersionState = createState<string | undefined>({
  key: 'backendImageVersion',
  defaultValue: undefined,
});

