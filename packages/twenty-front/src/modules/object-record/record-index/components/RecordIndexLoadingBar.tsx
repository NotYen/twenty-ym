import { isRecordTableInitialLoadingComponentState } from '@/object-record/record-table/states/isRecordTableInitialLoadingComponentState';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';

const StyledLoadingBarContainer = styled.div`
  flex-shrink: 0;
  height: 2px;
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const StyledLoadingBar = styled(motion.div)<{ barColor: string }>`
  height: 100%;
  background-color: ${({ barColor }) => barColor};
  position: absolute;
  left: 0;
  top: 0;
`;

type RecordIndexLoadingBarProps = {
  recordTableId: string;
};

export const RecordIndexLoadingBar = ({
  recordTableId,
}: RecordIndexLoadingBarProps) => {
  const theme = useTheme();

  const isRecordTableInitialLoading = useRecoilComponentValue(
    isRecordTableInitialLoadingComponentState,
    recordTableId,
  );

  return (
    <AnimatePresence>
      {isRecordTableInitialLoading && (
        <StyledLoadingBarContainer>
          <StyledLoadingBar
            barColor={theme.color.blue}
            initial={{ width: '0%', x: '0%' }}
            animate={{
              width: ['0%', '40%', '70%', '85%'],
              x: ['0%', '0%', '0%', '0%'],
            }}
            exit={{ width: '100%', opacity: 0 }}
            transition={{
              duration: 2,
              ease: 'easeOut',
              times: [0, 0.3, 0.6, 1],
            }}
          />
        </StyledLoadingBarContainer>
      )}
    </AnimatePresence>
  );
};
