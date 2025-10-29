import { ThemeProvider } from '@emotion/react';
import { createContext, useEffect } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { persistedFontSizeState } from '@/ui/theme/states/persistedFontSizeState';
import { useRecoilState, useRecoilValue } from 'recoil';
import { getImageAbsoluteURI } from 'twenty-shared/utils';
import { type ColorScheme } from 'twenty-ui/input';
import { THEME_DARK, THEME_LIGHT, ThemeContextProvider } from 'twenty-ui/theme';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { logError } from '~/utils/logError';

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
  const currentWorkspace = useRecoilValue(currentWorkspaceState);

  document.documentElement.className =
    persistedColorScheme === 'Dark' ? 'dark' : 'light';

  const theme = persistedColorScheme === 'Dark' ? THEME_DARK : THEME_LIGHT;

  // 初始化全局 zoom（縮放所有內容：文字、圖標、間距、佈局）
  useEffect(() => {
    document.documentElement.style.zoom = persistedFontSize.toString();
  }, [persistedFontSize]);

  // 應用 workspace 背景圖片（參考官方 DefaultLayout 的 Global 模式）
  useEffect(() => {
    const backgroundImage = currentWorkspace?.backgroundImage;
    const settings = currentWorkspace?.backgroundImageSettings;

    if (
      backgroundImage !== null &&
      backgroundImage !== undefined &&
      typeof backgroundImage === 'string'
    ) {
      // 將相對路徑轉換為絕對 URL（參考 ImageInput 組件）
      const absoluteBackgroundImageUrl = getImageAbsoluteURI({
        imageUrl: backgroundImage,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      });

      const opacity =
        settings && typeof settings.opacity === 'number'
          ? settings.opacity
          : 0.3;
      const scale =
        settings && typeof settings.scale === 'number' ? settings.scale : 1.0;
      const positionX =
        settings && typeof settings.position?.x === 'number'
          ? settings.position.x
          : 50;
      const positionY =
        settings && typeof settings.position?.y === 'number'
          ? settings.position.y
          : 50;
      const size =
        settings && typeof settings.size === 'string' ? settings.size : 'cover';
      const repeat =
        settings && typeof settings.repeat === 'string'
          ? settings.repeat
          : 'no-repeat';

      // 計算實際的 background-size
      let backgroundSize: string;
      if (size === 'cover' || size === 'contain') {
        backgroundSize = size;
      } else if (size === 'auto') {
        backgroundSize = `${scale * 100}%`;
      } else {
        backgroundSize = size;
      }

      // 使用 ::before 偽元素方式（符合 CSS 最佳實踐）
      // 注入全局 CSS 規則，優先級最高且不影響現有架構
      let styleElement = document.getElementById(
        'workspace-background-style',
      ) as HTMLStyleElement;

      if (styleElement === null) {
        styleElement = document.createElement('style');
        styleElement.id = 'workspace-background-style';
        document.head.appendChild(styleElement);
      }

      // 在 body::before 設置背景圖片（最佳實踐）
      styleElement.textContent = `
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          pointer-events: none;
          background-image: url('${absoluteBackgroundImageUrl}');
          background-size: ${backgroundSize};
          background-position: ${positionX}% ${positionY}%;
          background-repeat: ${repeat};
          background-attachment: fixed;
          opacity: ${opacity};
          will-change: opacity, background-position;
        }
      `;

      // 預加載圖片以提升性能
      const img = new Image();
      img.src = absoluteBackgroundImageUrl;
      img.onerror = () =>
        logError(
          `[BaseThemeProvider] Failed to preload background image: ${absoluteBackgroundImageUrl}`,
        );
    } else {
      // 移除全局 CSS 樣式
      const styleElement = document.getElementById(
        'workspace-background-style',
      );
      if (styleElement !== null) {
        styleElement.remove();
      }
    }

    // 清理函數
    return () => {
      // 不需要清理，因為背景是全局設置
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentWorkspace?.backgroundImage,
    currentWorkspace?.backgroundImageSettings,
  ]);

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider theme={theme}>
        <ThemeContextProvider theme={theme}>{children}</ThemeContextProvider>
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
