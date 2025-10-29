import styled from '@emotion/styled';

import { Select } from '@/ui/input/components/Select';
import { useFontSize } from '@/ui/theme/hooks/useFontSize';
import { useLingui } from '@lingui/react/macro';
import { Button } from 'twenty-ui/input';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledButtonContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export const FontSizePicker = () => {
  const { t } = useLingui();
  const { fontSize, setFontSize, resetFontSize } = useFontSize();

  const fontSizeOptions: Array<{
    label: string;
    value: number;
  }> = [
    {
      label: t`Extra Small (87.5%)`,
      value: 0.875,
    },
    {
      label: t`Small (100%)`,
      value: 1.0,
    },
    {
      label: t`Medium (112.5%)`,
      value: 1.125,
    },
    {
      label: t`Large (125%)`,
      value: 1.25,
    },
    {
      label: t`Extra Large (150%)`,
      value: 1.5,
    },
  ];

  return (
    <StyledContainer>
      <Select
        dropdownId="font-size"
        dropdownWidthAuto
        fullWidth
        value={fontSize}
        options={fontSizeOptions}
        onChange={(value) => setFontSize(value as number)}
      />
      <StyledButtonContainer>
        <Button
          variant="secondary"
          title={t`Reset to Default`}
          onClick={resetFontSize}
        />
      </StyledButtonContainer>
    </StyledContainer>
  );
};

