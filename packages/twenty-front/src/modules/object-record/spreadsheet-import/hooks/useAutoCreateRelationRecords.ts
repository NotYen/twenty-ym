import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { isCompositeFieldType } from '@/object-record/object-filter-dropdown/utils/isCompositeFieldType';
import {
  type ImportedStructuredRow,
  type SpreadsheetImportFields,
} from '@/spreadsheet-import/types';
import { gql } from '@apollo/client';
import { isNonEmptyString } from '@sniptt/guards';
import { useCallback } from 'react';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

type RelationValueInfo = {
  uniqueFieldName: string;
  uniqueFieldValue: string | Record<string, string>;
  valueKey: string;
};

type RelationObjectInfo = {
  targetObjectMetadataItem: ObjectMetadataItem;
  values: RelationValueInfo[];
};

type UseAutoCreateRelationRecordsProps = {
  objectMetadataItem: ObjectMetadataItem;
};

/**
 * Hook to automatically create missing relation records during spreadsheet import.
 *
 * This enables users to import records (e.g., Person) with relation fields (e.g., Company)
 * where the related records don't exist yet. The hook will:
 * 1. Extract all unique relation values from the import data
 * 2. Check which records already exist
 * 3. Create the missing records
 *
 * This only affects spreadsheet import and doesn't change any existing behavior.
 */
export const useAutoCreateRelationRecords = ({
  objectMetadataItem,
}: UseAutoCreateRelationRecordsProps) => {
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();

  /**
   * Extract all unique relation values grouped by target object
   */
  const extractRelationValues = useCallback(
    (
      importedRows: ImportedStructuredRow[],
      fieldMetadataItems: FieldMetadataItem[],
      spreadsheetImportFields: SpreadsheetImportFields,
    ): Map<string, RelationObjectInfo> => {
      const relationsByObject = new Map<string, RelationObjectInfo>();

      // Find all MANY_TO_ONE relation fields
      const relationFields = fieldMetadataItems.filter(
        (field) =>
          field.type === FieldMetadataType.RELATION &&
          field.relation?.type === RelationType.MANY_TO_ONE,
      );

      for (const relationField of relationFields) {
        const targetObjectMetadataItem = objectMetadataItems.find(
          (item) => item.id === relationField.relation?.targetObjectMetadata.id,
        );

        if (!isDefined(targetObjectMetadataItem)) continue;

        // Find spreadsheet import fields for this relation
        const relationConnectFields = spreadsheetImportFields.filter(
          (field) =>
            field.fieldMetadataItemId === relationField.id &&
            field.isRelationConnectField,
        );

        if (relationConnectFields.length === 0) continue;

        // Collect unique values
        const uniqueValuesMap = new Map<string, RelationValueInfo>();

        for (const row of importedRows) {
          // Group fields by uniqueFieldMetadataItem for composite fields
          const fieldsByUniqueField = new Map<
            string,
            typeof relationConnectFields
          >();

          for (const connectField of relationConnectFields) {
            const uniqueFieldId = connectField.uniqueFieldMetadataItem?.id;
            if (!uniqueFieldId) continue;

            const existing = fieldsByUniqueField.get(uniqueFieldId) || [];
            fieldsByUniqueField.set(uniqueFieldId, [...existing, connectField]);
          }

          for (const [, fields] of fieldsByUniqueField) {
            const firstField = fields[0];
            const uniqueFieldMetadataItem = firstField.uniqueFieldMetadataItem;
            if (!isDefined(uniqueFieldMetadataItem)) continue;

            if (
              isCompositeFieldType(uniqueFieldMetadataItem.type) &&
              fields.length > 0
            ) {
              // Composite field: collect all sub-field values
              const compositeValue: Record<string, string> = {};
              let hasValue = false;

              for (const field of fields) {
                const value = row[field.key];
                if (
                  isDefined(value) &&
                  isNonEmptyString(value) &&
                  isDefined(field.compositeSubFieldKey)
                ) {
                  compositeValue[field.compositeSubFieldKey] = value;
                  hasValue = true;
                }
              }

              if (hasValue) {
                const valueKey = `${uniqueFieldMetadataItem.name}:${JSON.stringify(compositeValue)}`;
                if (!uniqueValuesMap.has(valueKey)) {
                  uniqueValuesMap.set(valueKey, {
                    uniqueFieldName: uniqueFieldMetadataItem.name,
                    uniqueFieldValue: compositeValue,
                    valueKey,
                  });
                }
              }
            } else {
              // Simple field
              const value = row[firstField.key];
              if (isDefined(value) && isNonEmptyString(value)) {
                const valueKey = `${uniqueFieldMetadataItem.name}:${value}`;
                if (!uniqueValuesMap.has(valueKey)) {
                  uniqueValuesMap.set(valueKey, {
                    uniqueFieldName: uniqueFieldMetadataItem.name,
                    uniqueFieldValue: value,
                    valueKey,
                  });
                }
              }
            }
          }
        }

        if (uniqueValuesMap.size > 0) {
          const objectKey = targetObjectMetadataItem.nameSingular;
          const existing = relationsByObject.get(objectKey);

          if (existing) {
            // Merge values, avoiding duplicates
            const existingKeys = new Set(
              existing.values.map((v) => v.valueKey),
            );
            const newValues = Array.from(uniqueValuesMap.values()).filter(
              (v) => !existingKeys.has(v.valueKey),
            );
            existing.values.push(...newValues);
          } else {
            relationsByObject.set(objectKey, {
              targetObjectMetadataItem,
              values: Array.from(uniqueValuesMap.values()),
            });
          }
        }
      }

      return relationsByObject;
    },
    [objectMetadataItems],
  );

  /**
   * Find which records already exist
   */
  const findExistingRecordKeys = useCallback(
    async (
      targetObjectMetadataItem: ObjectMetadataItem,
      values: RelationValueInfo[],
    ): Promise<Set<string>> => {
      const existingKeys = new Set<string>();

      if (values.length === 0) return existingKeys;

      // Group values by uniqueFieldName
      const valuesByField = new Map<string, RelationValueInfo[]>();
      for (const value of values) {
        const existing = valuesByField.get(value.uniqueFieldName) || [];
        valuesByField.set(value.uniqueFieldName, [...existing, value]);
      }

      for (const [uniqueFieldName, fieldValues] of valuesByField) {
        try {
          // Build OR filter
          const orFilters = fieldValues.map((v) => {
            if (typeof v.uniqueFieldValue === 'string') {
              return { [uniqueFieldName]: { eq: v.uniqueFieldValue } };
            } else {
              // Composite field filter
              const filter: Record<string, any> = {};
              for (const [subKey, subValue] of Object.entries(
                v.uniqueFieldValue,
              )) {
                filter[uniqueFieldName] = {
                  ...filter[uniqueFieldName],
                  [subKey]: { eq: subValue },
                };
              }
              return filter;
            }
          });

          const query = buildFindManyQuery(
            targetObjectMetadataItem,
            uniqueFieldName,
          );

          const { data } = await apolloCoreClient.query({
            query,
            variables: {
              filter: { or: orFilters },
              limit: fieldValues.length,
            },
            fetchPolicy: 'network-only',
          });

          const records =
            data?.[targetObjectMetadataItem.namePlural]?.edges || [];

          for (const edge of records) {
            const record = edge.node;
            const fieldValue = record[uniqueFieldName];

            if (typeof fieldValue === 'string') {
              existingKeys.add(`${uniqueFieldName}:${fieldValue}`);
            } else if (typeof fieldValue === 'object' && fieldValue !== null) {
              // For composite fields, normalize the key
              existingKeys.add(
                `${uniqueFieldName}:${JSON.stringify(fieldValue)}`,
              );
            }
          }
        } catch (error) {
          console.error(
            `Error checking existing ${targetObjectMetadataItem.nameSingular} records:`,
            error,
          );
        }
      }

      return existingKeys;
    },
    [apolloCoreClient],
  );

  /**
   * Create missing relation records
   */
  const createMissingRecords = useCallback(
    async (
      targetObjectMetadataItem: ObjectMetadataItem,
      missingValues: RelationValueInfo[],
    ): Promise<void> => {
      if (missingValues.length === 0) return;

      // Build records to create
      const recordsToCreate = missingValues.map((value) => {
        if (typeof value.uniqueFieldValue === 'string') {
          return { [value.uniqueFieldName]: value.uniqueFieldValue };
        } else {
          return { [value.uniqueFieldName]: value.uniqueFieldValue };
        }
      });

      try {
        // Use Apollo client directly to create records
        const mutation = buildCreateManyMutation(targetObjectMetadataItem);

        await apolloCoreClient.mutate({
          mutation,
          variables: {
            data: recordsToCreate,
          },
        });

        console.log(
          `Created ${recordsToCreate.length} ${targetObjectMetadataItem.nameSingular} records`,
        );
      } catch (error: any) {
        // Provide detailed error message for users
        const objectLabel =
          targetObjectMetadataItem.labelSingular ||
          targetObjectMetadataItem.nameSingular;
        const duplicateValues = missingValues
          .map((v) =>
            typeof v.uniqueFieldValue === 'string'
              ? v.uniqueFieldValue
              : JSON.stringify(v.uniqueFieldValue),
          )
          .slice(0, 5); // Show first 5 values

        // Check if it's a unique constraint violation
        const errorMessage = error?.message || '';
        const isDuplicateError =
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unique') ||
          errorMessage.includes('already exists');

        if (isDuplicateError) {
          const detailedError = new Error(
            `無法自動創建 ${objectLabel} 記錄：資料庫中已存在重複的記錄。\n\n` +
              `嘗試創建的值: ${duplicateValues.join(', ')}${missingValues.length > 5 ? ` 等 ${missingValues.length} 筆` : ''}\n\n` +
              `可能的原因:\n` +
              `1. 資料庫中已有相同名稱的 ${objectLabel}，但使用了不同的唯一識別欄位\n` +
              `2. CSV 中有重複的 ${objectLabel} 名稱\n\n` +
              `解決方案:\n` +
              `1. 先在系統中手動創建這些 ${objectLabel}，然後再匯入\n` +
              `2. 檢查 CSV 中是否有重複的 ${objectLabel} 名稱\n` +
              `3. 使用 ${objectLabel} 的 ID 或其他唯一欄位來連接`,
          );
          throw detailedError;
        }

        // Generic error with context
        const genericError = new Error(
          `創建 ${objectLabel} 記錄時發生錯誤。\n\n` +
            `嘗試創建的值: ${duplicateValues.join(', ')}${missingValues.length > 5 ? ` 等 ${missingValues.length} 筆` : ''}\n\n` +
            `原始錯誤: ${errorMessage}`,
        );
        throw genericError;
      }
    },
    [apolloCoreClient],
  );

  /**
   * Main function: process imported rows and create missing relation records
   */
  const autoCreateMissingRelationRecords = useCallback(
    async (
      importedRows: ImportedStructuredRow[],
      fieldMetadataItems: FieldMetadataItem[],
      spreadsheetImportFields: SpreadsheetImportFields,
    ): Promise<void> => {
      // Step 1: Extract all relation values
      const relationsByObject = extractRelationValues(
        importedRows,
        fieldMetadataItems,
        spreadsheetImportFields,
      );

      if (relationsByObject.size === 0) {
        return;
      }

      // Step 2 & 3: For each target object, find existing and create missing
      for (const [objectName, info] of relationsByObject) {
        const existingKeys = await findExistingRecordKeys(
          info.targetObjectMetadataItem,
          info.values,
        );

        const missingValues = info.values.filter(
          (v) => !existingKeys.has(v.valueKey),
        );

        if (missingValues.length > 0) {
          console.log(
            `Creating ${missingValues.length} missing ${objectName} records...`,
          );
          await createMissingRecords(
            info.targetObjectMetadataItem,
            missingValues,
          );
        }
      }
    },
    [extractRelationValues, findExistingRecordKeys, createMissingRecords],
  );

  return {
    autoCreateMissingRelationRecords,
  };
};

/**
 * Build a findMany query for checking existing records
 */
const buildFindManyQuery = (
  objectMetadataItem: ObjectMetadataItem,
  uniqueFieldName: string,
) => {
  const field = objectMetadataItem.fields.find(
    (f) => f.name === uniqueFieldName,
  );

  let fieldSelection = uniqueFieldName;

  // Handle composite fields
  if (field && isCompositeFieldType(field.type)) {
    if (field.type === FieldMetadataType.LINKS) {
      fieldSelection = `${uniqueFieldName} { primaryLinkUrl primaryLinkLabel }`;
    } else if (field.type === FieldMetadataType.FULL_NAME) {
      fieldSelection = `${uniqueFieldName} { firstName lastName }`;
    } else if (field.type === FieldMetadataType.EMAILS) {
      fieldSelection = `${uniqueFieldName} { primaryEmail }`;
    }
    // Add other composite types as needed
  }

  return gql`
    query FindMany${capitalize(objectMetadataItem.namePlural)}ForImport($filter: ${capitalize(objectMetadataItem.nameSingular)}FilterInput, $limit: Int) {
      ${objectMetadataItem.namePlural}(filter: $filter, first: $limit) {
        edges {
          node {
            id
            ${fieldSelection}
          }
        }
      }
    }
  `;
};

/**
 * Build a createMany mutation
 */
const buildCreateManyMutation = (objectMetadataItem: ObjectMetadataItem) => {
  const capitalizedName = capitalize(objectMetadataItem.nameSingular);
  const capitalizedNamePlural = capitalize(objectMetadataItem.namePlural);

  return gql`
    mutation CreateMany${capitalizedNamePlural}ForImport($data: [${capitalizedName}CreateInput!]!) {
      create${capitalizedNamePlural}(data: $data) {
        id
      }
    }
  `;
};
