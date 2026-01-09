import { AdvancedFilterLogicalOperatorDropdown } from '@/object-record/advanced-filter/components/AdvancedFilterLogicalOperatorDropdown';
import { type RecordFilterGroup } from '@/object-record/record-filter-group/types/RecordFilterGroup';

import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { capitalize } from 'twenty-shared/utils';

const StyledText = styled.div`
  height: ${({ theme }) => theme.spacing(8)};
  display: flex;
  align-items: center;

  padding-left: ${({ theme }) => theme.spacing(2.25)};
`;

const StyledContainer = styled.div`
  align-items: start;
  display: flex;
  min-width: ${({ theme }) => theme.spacing(20)};
  color: ${({ theme }) => theme.font.color.tertiary};
`;

type AdvancedFilterLogicalOperatorCellProps = {
  index: number;
  recordFilterGroup: RecordFilterGroup;
};

export const AdvancedFilterLogicalOperatorCell = ({
  index,
  recordFilterGroup,
}: AdvancedFilterLogicalOperatorCellProps) => {
  const { t } = useLingui();

  const getLogicalOperatorLabel = () => {
    const operator = recordFilterGroup.logicalOperator.toLowerCase();
    return operator === 'and' ? t`And` : t`Or`;
  };

  return (
    <StyledContainer>
      {index === 0 ? (
        <StyledText>{t`Where`}</StyledText>
      ) : index === 1 ? (
        <AdvancedFilterLogicalOperatorDropdown
          recordFilterGroup={recordFilterGroup}
        />
      ) : (
        <StyledText>{getLogicalOperatorLabel()}</StyledText>
      )}
    </StyledContainer>
  );
};
