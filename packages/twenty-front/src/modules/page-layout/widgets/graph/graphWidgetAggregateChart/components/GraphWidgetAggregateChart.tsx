import { GraphWidgetFloatingTooltip } from '@/page-layout/widgets/graph/components/GraphWidgetFloatingTooltip';
import { formatNumberChartTrend } from '@/page-layout/widgets/graph/graphWidgetAggregateChart/utils/formatNumberChartTrend';
import { useGraphWidgetTooltipFloating } from '@/page-layout/widgets/graph/hooks/useGraphWidgetTooltipFloating';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useCallback, useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
    H1Title,
    H1TitleFontColor,
    IconTrendingDown,
    IconTrendingUp,
} from 'twenty-ui/display';

type ChartRecord = {
  id: string;
  displayValue: string;
};

type GraphWidgetAggregateChartProps = {
  value: string | number;
  trendPercentage?: number;
  records?: ChartRecord[];
  totalRecordCount?: number;
};

const StyledTrendPercentageValue = styled.span`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  margin-right: ${({ theme }) => theme.spacing(2)};
`;

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
`;

const StyledTrendIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledH1Title = styled(H1Title)`
  font-size: ${({ theme }) => theme.font.size.xxl};
  margin: 0;
`;

export const GraphWidgetAggregateChart = ({
  value,
  trendPercentage,
  records,
  totalRecordCount,
}: GraphWidgetAggregateChartProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const formattedPercentage = isDefined(trendPercentage)
    ? formatNumberChartTrend(trendPercentage)
    : undefined;

  const { floatingStyles, refs, isPositioned } = useGraphWidgetTooltipFloating({
    containerRef,
  });

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      refs.setReference({
        getBoundingClientRect: () => event.currentTarget.getBoundingClientRect(),
      });
    },
    [refs],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const hasRecords = isDefined(records) && records.length > 0;

  return (
    <StyledContainer
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StyledH1Title title={value} fontColor={H1TitleFontColor.Primary} />
      {isDefined(trendPercentage) && (
        <StyledTrendIconContainer>
          <StyledTrendPercentageValue>
            {formattedPercentage}%
          </StyledTrendPercentageValue>
          {trendPercentage >= 0 ? (
            <IconTrendingUp
              color={theme.color.turquoise8}
              size={theme.icon.size.md}
            />
          ) : (
            <IconTrendingDown
              color={theme.color.red8}
              size={theme.icon.size.md}
            />
          )}
        </StyledTrendIconContainer>
      )}
      {isHovered && hasRecords && (
        <GraphWidgetFloatingTooltip
          floatingStyles={floatingStyles}
          refs={refs}
          isPositioned={isPositioned}
          items={[
            {
              label: String(value),
              value: totalRecordCount ?? records.length,
              color: theme.color.blue,
            },
          ]}
          records={records}
          totalRecordCount={totalRecordCount}
        />
      )}
    </StyledContainer>
  );
};
