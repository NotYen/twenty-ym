import {
  useRecoilCallback,
  type CallbackInterface,
  type Snapshot,
} from 'recoil';

import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getRecordFromRecordNode } from '@/object-record/cache/utils/getRecordFromRecordNode';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import {
  type FieldCurrencyValue,
  type FieldMetadata,
  type FieldMorphRelationMetadata,
  type FieldRelationMetadata,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldAddress } from '@/object-record/record-field/ui/types/guards/isFieldAddress';
import { isFieldAddressValue } from '@/object-record/record-field/ui/types/guards/isFieldAddressValue';
import { isFieldArray } from '@/object-record/record-field/ui/types/guards/isFieldArray';
import { isFieldArrayValue } from '@/object-record/record-field/ui/types/guards/isFieldArrayValue';
import { isFieldBoolean } from '@/object-record/record-field/ui/types/guards/isFieldBoolean';
import { isFieldBooleanValue } from '@/object-record/record-field/ui/types/guards/isFieldBooleanValue';
import { isFieldCurrency } from '@/object-record/record-field/ui/types/guards/isFieldCurrency';
import { isFieldCurrencyValue } from '@/object-record/record-field/ui/types/guards/isFieldCurrencyValue';
import { isFieldDate } from '@/object-record/record-field/ui/types/guards/isFieldDate';
import { isFieldDateTime } from '@/object-record/record-field/ui/types/guards/isFieldDateTime';
import { isFieldDateTimeValue } from '@/object-record/record-field/ui/types/guards/isFieldDateTimeValue';
import { isFieldDateValue } from '@/object-record/record-field/ui/types/guards/isFieldDateValue';
import { isFieldEmails } from '@/object-record/record-field/ui/types/guards/isFieldEmails';
import { isFieldEmailsValue } from '@/object-record/record-field/ui/types/guards/isFieldEmailsValue';
import { isFieldFullName } from '@/object-record/record-field/ui/types/guards/isFieldFullName';
import { isFieldFullNameValue } from '@/object-record/record-field/ui/types/guards/isFieldFullNameValue';
import { isFieldLinks } from '@/object-record/record-field/ui/types/guards/isFieldLinks';
import { isFieldLinksValue } from '@/object-record/record-field/ui/types/guards/isFieldLinksValue';
import { isFieldMorphRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldMorphRelationManyToOne';
import { isFieldMultiSelect } from '@/object-record/record-field/ui/types/guards/isFieldMultiSelect';
import { isFieldMultiSelectValue } from '@/object-record/record-field/ui/types/guards/isFieldMultiSelectValue';
import { isFieldNumber } from '@/object-record/record-field/ui/types/guards/isFieldNumber';
import { isFieldNumberValue } from '@/object-record/record-field/ui/types/guards/isFieldNumberValue';
import { isFieldPhones } from '@/object-record/record-field/ui/types/guards/isFieldPhones';
import { isFieldPhonesValue } from '@/object-record/record-field/ui/types/guards/isFieldPhonesValue';
import { isFieldRating } from '@/object-record/record-field/ui/types/guards/isFieldRating';
import { isFieldRatingValue } from '@/object-record/record-field/ui/types/guards/isFieldRatingValue';
import { isFieldRawJson } from '@/object-record/record-field/ui/types/guards/isFieldRawJson';
import { isFieldRawJsonValue } from '@/object-record/record-field/ui/types/guards/isFieldRawJsonValue';
import { isFieldRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldRelationManyToOne';
import { isFieldRelationManyToOneValue } from '@/object-record/record-field/ui/types/guards/isFieldRelationManyToOneValue';
import { isFieldRichText } from '@/object-record/record-field/ui/types/guards/isFieldRichText';
import { isFieldRichTextV2 } from '@/object-record/record-field/ui/types/guards/isFieldRichTextV2';
import { isFieldRichTextValue } from '@/object-record/record-field/ui/types/guards/isFieldRichTextValue';
import { isFieldRichTextV2Value } from '@/object-record/record-field/ui/types/guards/isFieldRichTextValueV2';
import { isFieldSelect } from '@/object-record/record-field/ui/types/guards/isFieldSelect';
import { isFieldSelectValue } from '@/object-record/record-field/ui/types/guards/isFieldSelectValue';
import { isFieldText } from '@/object-record/record-field/ui/types/guards/isFieldText';
import { isFieldTextValue } from '@/object-record/record-field/ui/types/guards/isFieldTextValue';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getForeignKeyNameFromRelationFieldName } from '@/object-record/utils/getForeignKeyNameFromRelationFieldName';
import { isNonEmptyString, isNull } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';

export const usePersistField = ({
  objectMetadataItemId,
}: {
  objectMetadataItemId: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId,
  });

  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: objectMetadataItem?.nameSingular ?? '',
  });

  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const persistField = useRecoilCallback(
    ({ set, snapshot }) =>
      async ({
        recordId,
        fieldDefinition,
        valueToPersist,
      }: {
        recordId: string;
        fieldDefinition: FieldDefinition<FieldMetadata>;
        valueToPersist: unknown;
      }) => {
        const fieldIsRelationManyToOne =
          isFieldRelationManyToOne(
            fieldDefinition as FieldDefinition<FieldRelationMetadata>,
          ) && isFieldRelationManyToOneValue(valueToPersist);

        const fieldIsMorphRelationManyToOne =
          isFieldMorphRelationManyToOne(
            fieldDefinition as FieldDefinition<FieldMorphRelationMetadata>,
          ) && isFieldRelationManyToOneValue(valueToPersist);

        const fieldIsText =
          isFieldText(fieldDefinition) && isFieldTextValue(valueToPersist);

        const fieldIsEmails =
          isFieldEmails(fieldDefinition) && isFieldEmailsValue(valueToPersist);

        const fieldIsDateTime =
          isFieldDateTime(fieldDefinition) &&
          isFieldDateTimeValue(valueToPersist);

        const fieldIsDate =
          isFieldDate(fieldDefinition) && isFieldDateValue(valueToPersist);

        const fieldIsLinks =
          isFieldLinks(fieldDefinition) && isFieldLinksValue(valueToPersist);

        const fieldIsBoolean =
          isFieldBoolean(fieldDefinition) &&
          isFieldBooleanValue(valueToPersist);

        const fieldIsRating =
          isFieldRating(fieldDefinition) && isFieldRatingValue(valueToPersist);

        const fieldIsNumber =
          isFieldNumber(fieldDefinition) && isFieldNumberValue(valueToPersist);

        const fieldIsCurrency =
          isFieldCurrency(fieldDefinition) &&
          isFieldCurrencyValue(valueToPersist);

        const fieldIsFullName =
          isFieldFullName(fieldDefinition) &&
          isFieldFullNameValue(valueToPersist);

        const fieldIsPhones =
          isFieldPhones(fieldDefinition) && isFieldPhonesValue(valueToPersist);

        const fieldIsSelect =
          isFieldSelect(fieldDefinition) && isFieldSelectValue(valueToPersist);

        const fieldIsMultiSelect =
          isFieldMultiSelect(fieldDefinition) &&
          isFieldMultiSelectValue(valueToPersist);

        const fieldIsAddress =
          isFieldAddress(fieldDefinition) &&
          isFieldAddressValue(valueToPersist);

        const fieldIsRawJson =
          isFieldRawJson(fieldDefinition) &&
          isFieldRawJsonValue(valueToPersist);

        const fieldIsRichText =
          isFieldRichText(fieldDefinition) &&
          isFieldRichTextValue(valueToPersist);

        const fieldIsRichTextV2 =
          isFieldRichTextV2(fieldDefinition) &&
          isFieldRichTextV2Value(valueToPersist);

        const fieldIsArray =
          isFieldArray(fieldDefinition) && isFieldArrayValue(valueToPersist);

        const isValuePersistable =
          fieldIsMorphRelationManyToOne ||
          fieldIsRelationManyToOne ||
          fieldIsText ||
          fieldIsBoolean ||
          fieldIsEmails ||
          fieldIsRating ||
          fieldIsNumber ||
          fieldIsDateTime ||
          fieldIsDate ||
          fieldIsPhones ||
          fieldIsLinks ||
          fieldIsCurrency ||
          fieldIsFullName ||
          fieldIsSelect ||
          fieldIsMultiSelect ||
          fieldIsAddress ||
          fieldIsRawJson ||
          fieldIsArray ||
          fieldIsRichText ||
          fieldIsRichTextV2;

        if (isValuePersistable) {
          const fieldName = fieldDefinition.metadata.fieldName;

          const relationSyncConfig = getRelationFieldSyncConfig({
            fieldDefinition,
            objectMetadataItem,
            valueToPersist,
            currentRelationValue: snapshot
              .getLoadable(recordStoreFamilySelector({ recordId, fieldName }))
              .getValue(),
          });
          const salesQuoteTaxSyncPayload = getSalesQuoteTaxSyncPayload({
            fieldName,
            objectMetadataItem,
            recordId,
            snapshot,
            valueToPersist,
          });

          const additionalUpdatePayload: Record<string, unknown> = {};

          if (isDefined(relationSyncConfig)) {
            additionalUpdatePayload[relationSyncConfig.chartFieldName] =
              relationSyncConfig.initialDisplayName;
          }

          if (isDefined(salesQuoteTaxSyncPayload?.updatePayload)) {
            Object.assign(
              additionalUpdatePayload,
              salesQuoteTaxSyncPayload.updatePayload,
            );
          }

          const hasAdditionalUpdatePayload =
            Object.keys(additionalUpdatePayload).length > 0;

          const currentValue: any = snapshot
            .getLoadable(recordStoreFamilySelector({ recordId, fieldName }))
            .getValue();

          if (fieldIsRelationManyToOne) {
            if (valueToPersist?.id === currentValue?.id) {
              return;
            }

            const relationId = isNull(valueToPersist)
              ? null
              : (valueToPersist?.id as string | null);

            const updatePayload = {
              [getForeignKeyNameFromRelationFieldName(fieldName)]: relationId,
              ...(hasAdditionalUpdatePayload ? additionalUpdatePayload : {}),
            };

            const newRecord = await updateOneRecord?.({
              idToUpdate: recordId,
              updateOneRecordInput: updatePayload,
            });

            upsertRecordsInStore([
              getRecordFromRecordNode({
                recordNode: newRecord,
              }),
            ]);

            await syncRelationDisplayNameAfterUpdate({
              fieldName,
              newRecord,
              recordId,
              relationSyncConfig,
              set,
              updateOneRecord,
            });
            if (isDefined(salesQuoteTaxSyncPayload?.storeUpdates)) {
              applyStoreUpdates({
                recordId,
                set,
                storeUpdates: salesQuoteTaxSyncPayload.storeUpdates,
              });
            }

            return;
          }

          if (fieldIsMorphRelationManyToOne) {
            if (valueToPersist?.id === currentValue?.id) {
              return;
            }

            const newRecord = await updateOneRecord?.({
              idToUpdate: recordId,
              updateOneRecordInput: {
                [getForeignKeyNameFromRelationFieldName(fieldName)]:
                  valueToPersist?.id ?? null,
              },
            });

            upsertRecordsInStore([
              getRecordFromRecordNode({
                recordNode: newRecord,
              }),
            ]);
            return;
          }

          if (isDeeplyEqual(valueToPersist, currentValue)) {
            return;
          }

          updateOneRecord?.({
            idToUpdate: recordId,
            updateOneRecordInput: {
              [fieldName]: valueToPersist,
              ...(hasAdditionalUpdatePayload ? additionalUpdatePayload : {}),
            },
          });
          set(
            recordStoreFamilySelector({ recordId, fieldName }),
            valueToPersist,
          );
          if (isDefined(salesQuoteTaxSyncPayload?.storeUpdates)) {
            applyStoreUpdates({
              recordId,
              set,
              storeUpdates: salesQuoteTaxSyncPayload.storeUpdates,
            });
          }
        } else {
          throw new Error(
            `Invalid value to persist: ${JSON.stringify(
              valueToPersist,
            )} for type : ${
              fieldDefinition.type
            }, type may not be implemented in usePersistField.`,
          );
        }
      },
    [objectMetadataItem, updateOneRecord, upsertRecordsInStore],
  );

  return persistField;
};

const RESPONSIBLE_LABEL_KEYWORDS = ['負責', 'responsible'];
const CHART_LABEL_KEYWORDS = ['圖表', 'chart'];
const SALES_QUOTE_TOTAL_FIELD_NAME = 'zongJi';
const SALES_QUOTE_TAX_RATE_FIELD_NAME = 'shuiLu';
const SALES_QUOTE_TAX_AMOUNT_FIELD_NAME = 'shuiJin';

type UpdateOneRecordFn = ReturnType<
  typeof useUpdateOneRecord
>['updateOneRecord'];

type RelationFieldSyncConfig = {
  chartFieldName: string;
  initialDisplayName: string | null;
};

type SalesQuoteTaxSyncPayload = {
  updatePayload?: Record<string, unknown>;
  storeUpdates?: Record<string, unknown>;
};

const getRelationFieldSyncConfig = ({
  fieldDefinition,
  objectMetadataItem,
  valueToPersist,
  currentRelationValue,
}: {
  fieldDefinition: FieldDefinition<FieldMetadata>;
  objectMetadataItem: ObjectMetadataItem | undefined;
  valueToPersist: unknown;
  currentRelationValue: unknown;
}): RelationFieldSyncConfig | undefined => {
  if (!isDefined(objectMetadataItem)) {
    return undefined;
  }

  if (objectMetadataItem.nameSingular !== CoreObjectNameSingular.Opportunity) {
    return undefined;
  }

  if (!isRelationToWorkspaceMember(fieldDefinition)) {
    return undefined;
  }

  if (
    !doesLabelIncludeKeywords(fieldDefinition.label, RESPONSIBLE_LABEL_KEYWORDS)
  ) {
    return undefined;
  }

  const chartFieldName = getOpportunityChartDisplayFieldName(
    objectMetadataItem,
    fieldDefinition.label,
    fieldDefinition.metadata.fieldName,
  );

  if (!isDefined(chartFieldName)) {
    return undefined;
  }

  const displayNameFromValue =
    extractDisplayNameFromRelationValue(valueToPersist);

  const hasExplicitDisplayNameFromValue =
    isNull(valueToPersist) || isDefined(displayNameFromValue);

  const initialDisplayName = hasExplicitDisplayNameFromValue
    ? (displayNameFromValue ?? null)
    : (extractDisplayNameFromRelationValue(currentRelationValue) ?? null);

  return {
    chartFieldName,
    initialDisplayName,
  };
};

const isRelationToWorkspaceMember = (
  fieldDefinition: FieldDefinition<FieldMetadata>,
) => {
  if (!('relationObjectMetadataNameSingular' in fieldDefinition.metadata)) {
    return false;
  }

  return (
    fieldDefinition.metadata.relationObjectMetadataNameSingular ===
    CoreObjectNameSingular.WorkspaceMember
  );
};

const doesLabelIncludeKeywords = (label: string, keywords: string[]) => {
  const normalizedLabel = label?.toLowerCase() ?? '';
  return keywords.some((keyword) =>
    normalizedLabel.includes(keyword.toLowerCase()),
  );
};

const getOpportunityChartDisplayFieldName = (
  objectMetadataItem: ObjectMetadataItem,
  relationFieldLabel: string,
  relationFieldName: string,
) => {
  const normalizedRelationLabel = normalizeText(relationFieldLabel);
  const normalizedRelationName = normalizeText(relationFieldName);
  const matchedField = objectMetadataItem.fields.find((field) => {
    if (field.type !== FieldMetadataType.TEXT) {
      return false;
    }

    const normalizedLabel = (field.label ?? '').toLowerCase();
    const normalizedName = field.name?.toLowerCase() ?? '';

    const relationLabelMatches =
      normalizedRelationLabel.length > 0 &&
      (normalizedLabel.startsWith(normalizedRelationLabel) ||
        normalizedName.startsWith(normalizedRelationLabel));

    const relationNameMatches =
      normalizedRelationName.length > 0 &&
      (normalizedLabel.startsWith(normalizedRelationName) ||
        normalizedName.startsWith(normalizedRelationName));

    if (
      (relationLabelMatches || relationNameMatches) &&
      normalizedLabel !== normalizedRelationLabel
    ) {
      return true;
    }

    const includesChart = CHART_LABEL_KEYWORDS.some((keyword) => {
      const lowered = keyword.toLowerCase();
      return (
        normalizedLabel.includes(lowered) || normalizedName.includes(lowered)
      );
    });

    const includesResponsiblePrefix = RESPONSIBLE_LABEL_KEYWORDS.some(
      (keyword) =>
        normalizedLabel.includes(keyword.toLowerCase()) ||
        normalizedName.includes(keyword.toLowerCase()),
    );

    return includesChart && includesResponsiblePrefix;
  });

  return matchedField?.name;
};

const extractDisplayNameFromRelationValue = (value: unknown): string | null => {
  if (isNull(value) || !isDefined(value)) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const relationRecord = value as Record<string, unknown>;

  const directDisplayName = relationRecord.displayName;
  if (isNonEmptyString(directDisplayName)) {
    return directDisplayName.trim();
  }

  const directName = relationRecord.name;
  if (isNonEmptyString(directName)) {
    return (directName as string).trim();
  }

  if (
    typeof directName === 'object' &&
    directName !== null &&
    ('firstName' in (directName as Record<string, unknown>) ||
      'lastName' in (directName as Record<string, unknown>))
  ) {
    const composite = directName as Record<string, unknown>;
    const composed = composeName(composite.firstName, composite.lastName);
    if (isNonEmptyString(composed)) {
      return composed;
    }
  }

  const composed = composeName(
    relationRecord.firstName,
    relationRecord.lastName,
  );

  return isNonEmptyString(composed) ? composed : null;
};

const composeName = (firstName: unknown, lastName: unknown) => {
  const parts: string[] = [];

  if (isNonEmptyString(firstName)) {
    parts.push((firstName as string).trim());
  }

  if (isNonEmptyString(lastName)) {
    parts.push((lastName as string).trim());
  }

  const composed = parts.join(' ').trim();

  return composed.length > 0 ? composed : null;
};

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? '';

const getSalesQuoteTaxSyncPayload = ({
  fieldName,
  objectMetadataItem,
  recordId,
  snapshot,
  valueToPersist,
}: {
  fieldName: string;
  objectMetadataItem: ObjectMetadataItem | undefined;
  recordId: string;
  snapshot: Snapshot;
  valueToPersist: unknown;
}): SalesQuoteTaxSyncPayload | undefined => {
  if (!isDefined(objectMetadataItem)) {
    return undefined;
  }

  if (objectMetadataItem.nameSingular !== CoreObjectNameSingular.SalesQuote) {
    return undefined;
  }

  const isTotalField = fieldName === SALES_QUOTE_TOTAL_FIELD_NAME;
  const isTaxRateField = fieldName === SALES_QUOTE_TAX_RATE_FIELD_NAME;

  if (!isTotalField && !isTaxRateField) {
    return undefined;
  }

  const totalFromValue =
    isTotalField && isFieldCurrencyValue(valueToPersist)
      ? valueToPersist
      : null;
  const taxRateFromValue =
    isTaxRateField && typeof valueToPersist === 'number'
      ? valueToPersist
      : null;

  const resolvedTotal =
    totalFromValue ??
    getRecordFieldValueFromSnapshot<FieldCurrencyValue | null>({
      snapshot,
      recordId,
      fieldName: SALES_QUOTE_TOTAL_FIELD_NAME,
    });
  const resolvedTaxRate =
    taxRateFromValue ??
    getRecordFieldValueFromSnapshot<number | null>({
      snapshot,
      recordId,
      fieldName: SALES_QUOTE_TAX_RATE_FIELD_NAME,
    });

  const currentTaxValue =
    getRecordFieldValueFromSnapshot<FieldCurrencyValue | null>({
      snapshot,
      recordId,
      fieldName: SALES_QUOTE_TAX_AMOUNT_FIELD_NAME,
    });

  if (
    !isFieldCurrencyValue(resolvedTotal) ||
    !isDefined(resolvedTotal.amountMicros) ||
    !isDefined(resolvedTaxRate)
  ) {
    if (currentTaxValue === null) {
      return undefined;
    }

    return {
      updatePayload: {
        [SALES_QUOTE_TAX_AMOUNT_FIELD_NAME]: null,
      },
      storeUpdates: {
        [SALES_QUOTE_TAX_AMOUNT_FIELD_NAME]: null,
      },
    };
  }

  const calculatedTaxAmountMicros = Math.round(
    resolvedTotal.amountMicros * (Number(resolvedTaxRate) || 0),
  );

  if (
    isDefined(currentTaxValue?.amountMicros) &&
    currentTaxValue.amountMicros === calculatedTaxAmountMicros &&
    currentTaxValue.currencyCode === resolvedTotal.currencyCode
  ) {
    return undefined;
  }

  const taxFieldValue: FieldCurrencyValue = {
    amountMicros: calculatedTaxAmountMicros,
    currencyCode: resolvedTotal.currencyCode,
  };

  return {
    updatePayload: {
      [SALES_QUOTE_TAX_AMOUNT_FIELD_NAME]: taxFieldValue,
    },
    storeUpdates: {
      [SALES_QUOTE_TAX_AMOUNT_FIELD_NAME]: taxFieldValue,
    },
  };
};

const applyStoreUpdates = ({
  recordId,
  set,
  storeUpdates,
}: {
  recordId: string;
  set: CallbackInterface['set'];
  storeUpdates: Record<string, unknown>;
}) => {
  Object.entries(storeUpdates).forEach(([field, value]) => {
    set(
      recordStoreFamilySelector({ recordId, fieldName: field }),
      value as unknown,
    );
  });
};

const syncRelationDisplayNameAfterUpdate = async ({
  fieldName,
  newRecord,
  recordId,
  relationSyncConfig,
  set,
  updateOneRecord,
}: {
  fieldName: string;
  newRecord: ObjectRecord | undefined;
  recordId: string;
  relationSyncConfig: RelationFieldSyncConfig | undefined;
  set: CallbackInterface['set'];
  updateOneRecord?: UpdateOneRecordFn;
}) => {
  if (!isDefined(relationSyncConfig)) {
    return;
  }

  const derivedDisplayName = extractDisplayNameFromRelationValue(
    newRecord?.[fieldName],
  );
  const normalizedDisplayName = isDefined(derivedDisplayName)
    ? derivedDisplayName
    : null;

  if (
    normalizedDisplayName !== relationSyncConfig.initialDisplayName &&
    isDefined(updateOneRecord)
  ) {
    await updateOneRecord({
      idToUpdate: recordId,
      updateOneRecordInput: {
        [relationSyncConfig.chartFieldName]: normalizedDisplayName,
      },
    });
  }

  set(
    recordStoreFamilySelector({
      recordId,
      fieldName: relationSyncConfig.chartFieldName,
    }),
    normalizedDisplayName,
  );
};

const getRecordFieldValueFromSnapshot = <T>({
  recordId,
  fieldName,
  snapshot,
}: {
  recordId: string;
  fieldName: string;
  snapshot: Snapshot;
}): T | null => {
  const loadable = snapshot.getLoadable(
    recordStoreFamilySelector({ recordId, fieldName }),
  );

  if (loadable.state === 'hasValue') {
    return (loadable.contents as T) ?? null;
  }

  return null;
};
