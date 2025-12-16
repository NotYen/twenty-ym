import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';

import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { DEFAULT_VIEW_FIELD_SIZE } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/constants/DEFAULT_VIEW_FIELD_SIZE';
import {
    BASE_OBJECT_STANDARD_FIELD_IDS,
    SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS,
} from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';

export const salesQuoteLineItemsAllView = (
  objectMetadataItems: ObjectMetadataEntity[],
  useCoreNaming = false,
): ReturnType<typeof createView> | null => {
  const salesQuoteLineItemObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.salesQuoteLineItem,
  );

  if (!salesQuoteLineItemObjectMetadata) {
    console.warn('[salesQuoteLineItemsAllView] SalesQuoteLineItem object metadata not found, skipping view creation');
    return null;
  }

  return createView(salesQuoteLineItemObjectMetadata, useCoreNaming);
};

const createView = (
  salesQuoteLineItemObjectMetadata: ObjectMetadataEntity,
  useCoreNaming: boolean,
) => {
  return {
    name: useCoreNaming
      ? msg`All {objectLabelPlural}`
      : 'All Sales Quote Line Items',
    objectMetadataId: salesQuoteLineItemObjectMetadata.id ?? '',
    type: 'table',
    key: 'INDEX',
    position: 0,
    icon: 'IconList',
    kanbanFieldMetadataId: '',
    filters: [],
    fields: [
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.mingCheng,
          )?.id ?? '',
        position: 0,
        isVisible: true,
        size: DEFAULT_VIEW_FIELD_SIZE,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.salesQuote,
          )?.id ?? '',
        position: 1,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.product,
          )?.id ?? '',
        position: 2,
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
        position: 3,
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
        position: 4,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.xiaoJi,
          )?.id ?? '',
        position: 5,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteLineItemObjectMetadata.fields.find(
            (field) =>
              field.standardId === BASE_OBJECT_STANDARD_FIELD_IDS.createdAt,
          )?.id ?? '',
        position: 6,
        isVisible: true,
        size: 150,
      },
    ],
  };
};
