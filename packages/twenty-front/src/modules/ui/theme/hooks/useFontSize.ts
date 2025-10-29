import { useCallback, useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { persistedFontSizeState } from '@/ui/theme/states/persistedFontSizeState';

export const useFontSize = () => {
  const [fontSize, setPersistedFontSize] = useRecoilState(
    persistedFontSizeState,
  );

  // 初始化時應用全局 zoom（縮放所有內容：文字、圖標、間距、佈局）
  useEffect(() => {
    document.documentElement.style.zoom = fontSize.toString();
  }, [fontSize]);

  const setFontSize = useCallback(
    (value: number) => {
      // 更新 Recoil state（會自動保存到 localStorage）
      setPersistedFontSize(value);

      // 立即應用全局 zoom - 縮放整個頁面（像瀏覽器 Ctrl+/Ctrl-）
      document.documentElement.style.zoom = value.toString();
    },
    [setPersistedFontSize],
  );

  const resetFontSize = useCallback(() => {
    setFontSize(1.0);
  }, [setFontSize]);

  return {
    fontSize,
    setFontSize,
    resetFontSize,
  };
};
