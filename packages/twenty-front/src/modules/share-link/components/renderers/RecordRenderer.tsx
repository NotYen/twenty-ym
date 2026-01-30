import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';

const StyledContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(6)};
`;

const StyledTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const StyledFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledFieldLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.tertiary};
  text-transform: uppercase;
`;

const StyledFieldValue = styled.div`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.primary};
  word-break: break-word;
`;

interface RecordRendererProps {
  data: any;
  objectMetadata: any;
}

/**
 * 通用的記錄渲染器
 * 支援所有標準對象和自定義對象
 */
export const RecordRenderer = ({ data, objectMetadata }: RecordRendererProps) => {
  if (!data || !objectMetadata) {
    return (
      <StyledContainer>
        <div>{t`Unable to load record data`}</div>
      </StyledContainer>
    );
  }

  // 獲取記錄標題
  const getRecordTitle = () => {
    if (data.name) return data.name;
    if (data.firstName || data.lastName) {
      return `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }
    if (data.baoJiaDanHao) return data.baoJiaDanHao;
    if (data.mingCheng) return data.mingCheng;
    return objectMetadata.labelSingular || 'Record';
  };

  // 格式化欄位值
  const formatFieldValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (fieldType) {
      case 'DATE':
      case 'DATE_TIME':
        return new Date(value).toLocaleString('zh-TW');
      case 'BOOLEAN':
        return value ? t`Yes` : t`No`;
      case 'NUMBER':
      case 'NUMERIC':
        return value.toLocaleString();
      case 'RELATION':
        if (typeof value === 'object') {
          return value.name || value.firstName || value.id || '-';
        }
        return String(value);
      default:
        return String(value);
    }
  };

  // 過濾並排序欄位
  const getDisplayFields = () => {
    if (!objectMetadata.fields) return [];

    return objectMetadata.fields
      .filter((field: any) => {
        // 跳過系統欄位
        if (['id', '__typename', 'createdAt', 'updatedAt', 'deletedAt'].includes(field.name)) {
          return false;
        }
        // 跳過沒有值的欄位
        if (data[field.name] === null || data[field.name] === undefined) {
          return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        // 優先顯示重要欄位
        const priorityFields = ['name', 'firstName', 'lastName', 'email', 'phone'];
        const aIndex = priorityFields.indexOf(a.name);
        const bIndex = priorityFields.indexOf(b.name);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        return a.label.localeCompare(b.label);
      });
  };

  const displayFields = getDisplayFields();

  return (
    <StyledContainer>
      <StyledTitle>{getRecordTitle()}</StyledTitle>
      <StyledFieldsGrid>
        {displayFields.map((field: any) => (
          <StyledField key={field.name}>
            <StyledFieldLabel>{field.label}</StyledFieldLabel>
            <StyledFieldValue>
              {formatFieldValue(data[field.name], field.type)}
            </StyledFieldValue>
          </StyledField>
        ))}
      </StyledFieldsGrid>
    </StyledContainer>
  );
};
