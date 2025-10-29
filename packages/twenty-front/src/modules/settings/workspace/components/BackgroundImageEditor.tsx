import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { Modal } from '@/ui/layout/modal/components/Modal';
import { Button } from 'twenty-ui/input';
import {
  DEFAULT_BACKGROUND_SETTINGS,
  type BackgroundSettings,
} from '../hooks/useWorkspaceBackground';

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
  margin: 0;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledPreviewArea = styled.div<{
  backgroundImage: string;
  opacity: number;
  scale: number;
  positionX: number;
  positionY: number;
  size: string;
  repeat: string;
}>`
  width: 100%;
  height: 180px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.background.secondary};
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('${({ backgroundImage }) => backgroundImage}');
    background-size: ${({ scale, size }) =>
      size === 'cover' || size === 'contain'
        ? size
        : size === 'auto'
          ? `${scale * 100}%`
          : size};
    background-position: ${({ positionX, positionY }) =>
      `${positionX}% ${positionY}%`};
    background-repeat: ${({ repeat }) => repeat};
    opacity: ${({ opacity }) => opacity};
    transition: all 0.2s ease;
  }
`;

const StyledControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledLabel = styled.label`
  min-width: 100px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.primary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.background.tertiary};
  outline: none;
  appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.blue};
    cursor: pointer;
    transition: transform 0.1s ease;

    &:hover {
      transform: scale(1.2);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.blue};
    cursor: pointer;
    border: none;
  }
`;

const StyledValue = styled.span`
  min-width: 60px;
  text-align: right;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.secondary};
  font-family: ${({ theme }) => theme.font.family};
`;

const StyledSelectRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledSelect = styled.select`
  flex: 1;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  cursor: pointer;
  outline: none;

  &:hover {
    border-color: ${({ theme }) => theme.border.color.strong};
  }

  &:focus {
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

type BackgroundImageEditorProps = {
  imageUrl: string;
  initialSettings?: Partial<BackgroundSettings>;
  onSave: (settings: BackgroundSettings) => void;
  onCancel: () => void;
};

export const BackgroundImageEditor = ({
  imageUrl,
  initialSettings,
  onSave,
  onCancel,
}: BackgroundImageEditorProps) => {
  const { t } = useLingui();
  const [settings, setSettings] = useState<BackgroundSettings>({
    opacity: initialSettings?.opacity ?? DEFAULT_BACKGROUND_SETTINGS.opacity,
    scale: initialSettings?.scale ?? DEFAULT_BACKGROUND_SETTINGS.scale,
    position: initialSettings?.position ?? DEFAULT_BACKGROUND_SETTINGS.position,
    size: initialSettings?.size ?? DEFAULT_BACKGROUND_SETTINGS.size,
    repeat: initialSettings?.repeat ?? DEFAULT_BACKGROUND_SETTINGS.repeat,
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Modal
      modalId="background-image-editor"
      size="medium"
      padding="large"
      isClosable={true}
      onClose={onCancel}
    >
      <StyledModalContent>
        <StyledTitle>{t`Edit Background Image`}</StyledTitle>

        {/* 預覽區域 */}
        <StyledPreviewArea
          backgroundImage={imageUrl}
          opacity={settings.opacity}
          scale={settings.scale}
          positionX={settings.position.x}
          positionY={settings.position.y}
          size={settings.size}
          repeat={settings.repeat}
        />

        {/* 控制面板 */}
        <StyledControlsContainer>
          {/* 透明度滑桿 */}
          <StyledSliderRow>
            <StyledLabel>{t`Opacity`}</StyledLabel>
            <StyledSlider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.opacity}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  opacity: parseFloat(e.target.value),
                })
              }
            />
            <StyledValue>{Math.round(settings.opacity * 100)}%</StyledValue>
          </StyledSliderRow>

          {/* 縮放滑桿 */}
          <StyledSliderRow>
            <StyledLabel>{t`Scale`}</StyledLabel>
            <StyledSlider
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.scale}
              onChange={(e) =>
                setSettings({ ...settings, scale: parseFloat(e.target.value) })
              }
            />
            <StyledValue>{Math.round(settings.scale * 100)}%</StyledValue>
          </StyledSliderRow>

          {/* 水平位置 */}
          <StyledSliderRow>
            <StyledLabel>{t`Horizontal Position`}</StyledLabel>
            <StyledSlider
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.position.x}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  position: {
                    ...settings.position,
                    x: parseInt(e.target.value),
                  },
                })
              }
            />
            <StyledValue>{settings.position.x}%</StyledValue>
          </StyledSliderRow>

          {/* 垂直位置 */}
          <StyledSliderRow>
            <StyledLabel>{t`Vertical Position`}</StyledLabel>
            <StyledSlider
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.position.y}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  position: {
                    ...settings.position,
                    y: parseInt(e.target.value),
                  },
                })
              }
            />
            <StyledValue>{settings.position.y}%</StyledValue>
          </StyledSliderRow>

          {/* 填充方式選擇器 */}
          <StyledSelectRow>
            <StyledLabel>{t`Fill Mode`}</StyledLabel>
            <StyledSelect
              value={settings.size}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  size: e.target.value as BackgroundSettings['size'],
                })
              }
            >
              <option value="cover">{t`Cover (Recommended)`}</option>
              <option value="contain">{t`Contain`}</option>
              <option value="auto">{t`Original Size`}</option>
            </StyledSelect>
          </StyledSelectRow>

          {/* 重複模式選擇器 */}
          <StyledSelectRow>
            <StyledLabel>{t`Repeat`}</StyledLabel>
            <StyledSelect
              value={settings.repeat}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  repeat: e.target.value as BackgroundSettings['repeat'],
                })
              }
            >
              <option value="no-repeat">{t`No Repeat`}</option>
              <option value="repeat">{t`Repeat`}</option>
              <option value="repeat-x">{t`Repeat Horizontally`}</option>
              <option value="repeat-y">{t`Repeat Vertically`}</option>
            </StyledSelect>
          </StyledSelectRow>
        </StyledControlsContainer>

        {/* 操作按鈕 */}
        <StyledButtonRow>
          <Button variant="secondary" title={t`Cancel`} onClick={onCancel} />
          <Button
            variant="primary"
            title={t`Save and Apply`}
            onClick={handleSave}
          />
        </StyledButtonRow>
      </StyledModalContent>
    </Modal>
  );
};
