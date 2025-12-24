import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';

import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';

export const salesQuoteLineItemsAllView = (
  objectMetadataItems: ObjectMetadataEntity[],
  useCoreNaming = false,
) => {
  const salesQuoteLineItemObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.salesQuoteLineItem,
  );

  if (!salesQuoteLineItemObjectMetadata) {
    throw new Error('SalesQuoteLineItem object metadata not found');
  }

  return {
    name: useCoreNaming
      ? msg`All {objectLabelPlural}`
      : 'All Sales Quote Line Items',
    objectMetadataId: salesQuoteLineItemObjectMetadata.id,
    type: 'table',
    key: 'INDEX',
    position: 0,
    icon: 'IconList',
    kanbanFieldMetadataId: '',
    filters: [],
    fields: [
      // name 必須在 position 0，因為它是 labelIdentifierField
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.name,
          )?.id ?? '',
        position: 0,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.shuLiang,
          )?.id ?? '',
        position: 1,
        isVisible: true,
        size: 100,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.danJia,
          )?.id ?? '',
        position: 2,
        isVisible: true,
        size: 120,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.zheKou,
          )?.id ?? '',
        position: 3,
        isVisible: true,
        size: 100,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.jinE,
          )?.id ?? '',
        position: 4,
        isVisible: true,
        size: 120,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.salesQuote,
          )?.id ?? '',
        position: 5,
        isVisible: true,
        size: 150,
      },
    ],
  };
};
