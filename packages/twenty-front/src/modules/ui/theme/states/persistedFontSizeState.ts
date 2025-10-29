import { atom } from 'recoil';

import { localStorageEffect } from '~/utils/recoil-effects';

export type FontSizeMultiplier = number;

export const persistedFontSizeState = atom<FontSizeMultiplier>({
  key: 'persistedFontSizeState',
  default: 1.0,
  effects: [localStorageEffect()],
});

