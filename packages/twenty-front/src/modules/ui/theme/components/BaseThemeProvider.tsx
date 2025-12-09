import { ThemeProvider } from '@emotion/react';
import { createContext, useEffect } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { persistedFontSizeState } from '@/ui/theme/states/persistedFontSizeState';
import { useRecoilState, useRecoilValue } from 'recoil';
import { getImageAbsoluteURI } from 'twenty-shared/utils';
import { type ColorScheme } from 'twenty-ui/input';
import { THEME_DARK, THEME_LIGHT, ThemeContextProvider } from 'twenty-ui/theme';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { logDebug } from '~/utils/logDebug';

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
  const systemColorScheme = useSystemColorScheme();

  const effectiveColorScheme =
    persistedColorScheme === 'System'
      ? systemColorScheme
      : persistedColorScheme;

  document.documentElement.className =
    effectiveColorScheme === 'Dark' ? 'dark' : 'light';

  const theme = effectiveColorScheme === 'Dark' ? THEME_DARK : THEME_LIGHT;

  // 初始化全局 zoom（縮放所有內容：文字、圖標、間距、佈局）
  useEffect(() => {
    document.documentElement.style.zoom = persistedFontSize.toString();
  }, [persistedFontSize]);

  // 應用 workspace 背景圖片（參考官方 DefaultLayout 的 Global 模式）
  useEffect(() => {
    const backgroundImage = currentWorkspace?.backgroundImage;
    const settings = currentWorkspace?.backgroundImageSettings;

    logDebug('[🎨 BaseThemeProvider] useEffect 觸發', {
      backgroundImage,
      settings,
      currentWorkspaceId: currentWorkspace?.id,
    });

    if (
      backgroundImage !== null &&
      backgroundImage !== undefined &&
      typeof backgroundImage === 'string'
    ) {
      logDebug('[🎨 BaseThemeProvider] ✅ 背景圖片存在，準備應用...');
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

      document.body.dataset.workspaceBackground = 'true';
      const panelGlassBackground =
        theme.background.transparent.light ?? 'rgba(255, 255, 255, 0.88)';
      const panelGlassBorder = theme.border.color.medium;

      // 在 body::before 設置背景圖片（最佳實踐）
      // 同時給 body 設置基礎背景色，確保內容可見
      styleElement.textContent = `
        body {
          background-color: ${theme.background.noisy} !important;
          position: relative;
        }

        body::before {
          content: '' !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 0 !important;
          pointer-events: none !important;
          background-image: url('${absoluteBackgroundImageUrl}') !important;
          background-size: ${backgroundSize} !important;
          background-position: ${positionX}% ${positionY}% !important;
          background-repeat: ${repeat} !important;
          background-attachment: fixed !important;
          opacity: ${opacity} !important;
          will-change: opacity, background-position !important;
        }

        /* 確保所有主要內容容器在背景之上 */
        body > #root {
          position: relative !important;
          z-index: 1 !important;
          background: transparent !important;
        }

        body[data-workspace-background='true'] [data-component='page-body'] {
          background: transparent !important;
        }

        body[data-workspace-background='true'] [data-component='page-panel'] {
          background: ${panelGlassBackground} !important;
          border-color: ${panelGlassBorder} !important;
          backdrop-filter: blur(6px);
        }
      `;

      logDebug(
        '[🎨 BaseThemeProvider] ✅ CSS 已注入，absoluteBackgroundImageUrl:',
        absoluteBackgroundImageUrl,
      );
      logDebug('[🎨 BaseThemeProvider] 📐 背景設置:', {
        opacity,
        scale,
        backgroundSize,
        position: `${positionX}% ${positionY}%`,
        repeat,
      });
    } else {
      logDebug('[🎨 BaseThemeProvider] ❌ 背景圖片不存在或格式錯誤，移除 CSS');
      // 移除全局 CSS 樣式
      const styleElement = document.getElementById(
        'workspace-background-style',
      );
      if (styleElement !== null) {
        styleElement.remove();
      }
      delete document.body.dataset.workspaceBackground;
    }

    // 清理函數
    return () => {
      // 不需要清理，因為背景是全局設置
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentWorkspace?.id, // 加上 workspace id，確保 workspace 載入時觸發
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
