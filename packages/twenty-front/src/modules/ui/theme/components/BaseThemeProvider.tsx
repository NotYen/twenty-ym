import { ThemeProvider } from '@emotion/react';
import { createContext, useEffect } from 'react';

import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { persistedFontSizeState } from '@/ui/theme/states/persistedFontSizeState';
import { useRecoilState, useRecoilValue } from 'recoil';
import { type ColorScheme } from 'twenty-ui/input';
import { THEME_DARK, THEME_LIGHT, ThemeContextProvider } from 'twenty-ui/theme';

type BaseThemeProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const ThemeSchemeContext = createContext<(theme: ColorScheme) => void>(
  () => {},
);

export const BaseThemeProvider = ({ children }: BaseThemeProviderProps) => {
  const [persistedColorScheme, setPersistedColorScheme] = useRecoilState(
    persistedColorSchemeState,
  );
  const persistedFontSize = useRecoilValue(persistedFontSizeState);

  document.documentElement.className =
    persistedColorScheme === 'Dark' ? 'dark' : 'light';

  const theme = persistedColorScheme === 'Dark' ? THEME_DARK : THEME_LIGHT;

  // 初始化全局 zoom（縮放所有內容：文字、圖標、間距、佈局）
  useEffect(() => {
    document.documentElement.style.zoom = persistedFontSize.toString();
  }, [persistedFontSize]);

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider theme={theme}>
        <ThemeContextProvider theme={theme}>{children}</ThemeContextProvider>
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
