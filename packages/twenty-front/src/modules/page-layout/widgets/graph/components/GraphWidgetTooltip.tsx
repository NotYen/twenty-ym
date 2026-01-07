import { GRAPH_TOOLTIP_MAX_WIDTH_PX } from '@/page-layout/widgets/graph/components/constants/GraphTooltipMaxWidthPx';
import { GRAPH_TOOLTIP_MIN_WIDTH_PX } from '@/page-layout/widgets/graph/components/constants/GraphTooltipMinWidthPx';
import { GRAPH_TOOLTIP_SCROLL_MAX_HEIGHT_PX } from '@/page-layout/widgets/graph/components/constants/GraphTooltipScrollMaxHeightPx';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconArrowUpRight } from 'twenty-ui/display';

const StyledTooltip = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: min(${GRAPH_TOOLTIP_MAX_WIDTH_PX}px, calc(100vw - 40px));
  min-width: ${GRAPH_TOOLTIP_MIN_WIDTH_PX}px;
  pointer-events: auto;
`;

const StyledTooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledTooltipRow = styled.div<{ isHighlighted?: boolean }>`
  align-items: center;
  background: ${({ theme, isHighlighted }) =>
    isHighlighted ? theme.background.transparent.light : 'transparent'};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledTooltipRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  max-height: ${GRAPH_TOOLTIP_SCROLL_MAX_HEIGHT_PX}px;
  overflow-y: auto;
`;

const StyledDot = styled.div<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  flex-shrink: 0;
`;

const StyledTooltipLink = styled.div<{ isClickable: boolean }>`
  align-items: center;
  color: ${({ theme }) => theme.font.color.secondary};
  cursor: ${({ isClickable }) => (isClickable ? 'pointer' : 'default')};
  display: flex;
  justify-content: space-between;
  height: ${({ theme }) => theme.spacing(7)};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  padding-inline: ${({ theme }) => theme.spacing(3)};
  line-height: 140%;
`;

const StyledTooltipSeparator = styled.div`
  background-color: ${({ theme }) => theme.border.color.light};
  min-height: 1px;
  width: 100%;
`;

const StyledTooltipHeader = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  line-height: 140%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTooltipRowRightContent = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.secondary};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;
  width: 100%;
`;

const StyledTooltipLabel = styled.span<{ isHighlighted?: boolean }>`
  color: ${({ theme, isHighlighted }) =>
    isHighlighted ? theme.font.color.primary : theme.font.color.secondary};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ theme, isHighlighted }) =>
    isHighlighted ? theme.font.weight.semiBold : theme.font.weight.medium};
`;

const StyledTooltipValue = styled.span<{ isHighlighted?: boolean }>`
  color: ${({ theme, isHighlighted }) =>
    isHighlighted ? theme.font.color.secondary : theme.font.color.tertiary};
  flex-shrink: 0;
  font-weight: ${({ theme, isHighlighted }) =>
    isHighlighted ? theme.font.weight.semiBold : theme.font.weight.medium};
  white-space: nowrap;
`;

const StyledHorizontalSectionPadding = styled.div<{
  addTop?: boolean;
  addBottom?: boolean;
}>`
  padding-inline: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ addTop, theme }) => (addTop ? theme.spacing(1) : 0)};
  margin-bottom: ${({ addBottom, theme }) =>
    addBottom ? theme.spacing(1) : 0};
`;

const StyledRecordListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledRecordListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  max-height: ${GRAPH_TOOLTIP_SCROLL_MAX_HEIGHT_PX}px;
  overflow-y: auto;
`;

const StyledRecordListHeader = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledRecordListItem = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: ${({ theme }) => theme.spacing(5)};
  min-height: ${({ theme }) => theme.spacing(5)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 ${({ theme }) => theme.spacing(2)};
`;

export type GraphWidgetTooltipItem = {
  key: string;
  label: string;
  formattedValue: string;
  value: number;
  dotColor: string;
};

export type GraphWidgetTooltipRecord = {
  id: string;
  displayValue: string;
};

type GraphWidgetTooltipProps = {
  items: GraphWidgetTooltipItem[];
  indexLabel?: string;
  highlightedKey?: string;
  onGraphWidgetTooltipClick?: () => void;
  // New props for record list display
  records?: GraphWidgetTooltipRecord[];
  totalRecordCount?: number;
  recordsLoading?: boolean;
};

export const GraphWidgetTooltip = ({
  items,
  indexLabel,
  highlightedKey,
  onGraphWidgetTooltipClick,
  records,
  totalRecordCount,
  recordsLoading,
}: GraphWidgetTooltipProps) => {
  const theme = useTheme();
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const filteredItems = items.filter(
    (item) => item.value !== 0 && isNonEmptyString(item.formattedValue),
  );

  const shouldHighlight = filteredItems.length > 1;
  const hasGraphWidgetTooltipClick = isDefined(onGraphWidgetTooltipClick);
  const hasRecords = isDefined(records) && records.length > 0;
  // Don't show loading state to prevent flickering - just wait for data
  const showRecordsSection = hasRecords;

  // Auto-scroll to highlighted item when highlightedKey changes
  useEffect(() => {
    if (highlightedKey && itemRefs.current.has(highlightedKey)) {
      itemRefs.current.get(highlightedKey)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedKey]);

  return (
    <StyledTooltip>
      <StyledHorizontalSectionPadding
        addTop
        addBottom={!hasGraphWidgetTooltipClick && !showRecordsSection}
      >
        <StyledTooltipContent>
          {indexLabel && (
            <StyledTooltipHeader>{indexLabel}</StyledTooltipHeader>
          )}
          <StyledTooltipRowContainer>
            {filteredItems.map((item) => {
              const isHighlighted =
                shouldHighlight && highlightedKey === item.key;
              return (
                <StyledTooltipRow
                  key={item.key}
                  isHighlighted={isHighlighted}
                  ref={(el) => {
                    if (el) {
                      itemRefs.current.set(item.key, el);
                    } else {
                      itemRefs.current.delete(item.key);
                    }
                  }}
                >
                  <StyledDot color={item.dotColor} />
                  <StyledTooltipRowRightContent>
                    <StyledTooltipLabel isHighlighted={isHighlighted}>
                      {item.label}
                    </StyledTooltipLabel>
                    <StyledTooltipValue isHighlighted={isHighlighted}>
                      {item.formattedValue}
                    </StyledTooltipValue>
                  </StyledTooltipRowRightContent>
                </StyledTooltipRow>
              );
            })}
          </StyledTooltipRowContainer>
          {showRecordsSection && (
            <StyledRecordListSection>
              <StyledRecordListHeader>{t`Records`}:</StyledRecordListHeader>
              <StyledRecordListContainer>
                {records.map((record) => (
                  <StyledRecordListItem key={record.id}>
                    • {record.displayValue}
                  </StyledRecordListItem>
                ))}
              </StyledRecordListContainer>
            </StyledRecordListSection>
          )}
        </StyledTooltipContent>
      </StyledHorizontalSectionPadding>
      {hasGraphWidgetTooltipClick && (
        <>
          <StyledTooltipSeparator />
          <StyledHorizontalSectionPadding addBottom>
            <StyledTooltipLink onClick={onGraphWidgetTooltipClick} isClickable>
              <span>{t`Click to see data`}</span>
              <IconArrowUpRight size={theme.icon.size.sm} />
            </StyledTooltipLink>
          </StyledHorizontalSectionPadding>
        </>
      )}
    </StyledTooltip>
  );
};
