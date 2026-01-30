import styled from '@emotion/styled';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const StyledLayout = styled.div`
  background: ${({ theme }) => theme.background.noisy};
  display: flex;
  flex-direction: column;
  height: 100dvh;
  position: relative;
  scrollbar-width: 4px;
  width: 100%;
`;

export const BlankLayout = () => {
  const location = useLocation();

  useEffect(() => {
    // Rendering with pathname
  }, [location.pathname]);

  return (
    <>
      {/* 移除 body background，改由 BaseThemeProvider 統一管理 workspace 背景 */}
      <StyledLayout>
        <Outlet />
      </StyledLayout>
    </>
  );
};
