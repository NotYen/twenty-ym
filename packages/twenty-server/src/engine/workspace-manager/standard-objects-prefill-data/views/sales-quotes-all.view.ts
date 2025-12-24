import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';

import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { SALES_QUOTE_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';

export const salesQuotesAllView = (
  objectMetadataItems: ObjectMetadataEntity[],
  useCoreNaming = false,
) => {
  const salesQuoteObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.salesQuote,
  );

  if (!salesQuoteObjectMetadata) {
    throw new Error('SalesQuote object metadata not found');
  }

  return {
    name: useCoreNaming ? msg`All {objectLabelPlural}` : 'All Sales Quotes',
    objectMetadataId: salesQuoteObjectMetadata.id,
    type: 'table',
    key: 'INDEX',
    position: 0,
    icon: 'IconList',
    kanbanFieldMetadataId: '',
    filters: [],
    fields: [
      // name 必須在 position 0，因為它是 labelIdentifierField
      // 這樣可以避免重複顯示的問題
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.name,
          )?.id ?? '',
        position: 0,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaDanHao,
          )?.id ?? '',
        position: 1,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.company,
          )?.id ?? '',
        position: 2,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaRiQi,
          )?.id ?? '',
        position: 3,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId ===
              SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaDanZhuangTai,
          )?.id ?? '',
        position: 4,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.zongJi,
          )?.id ?? '',
        position: 5,
        isVisible: true,
        size: 150,
      },
    ],
  };
};
