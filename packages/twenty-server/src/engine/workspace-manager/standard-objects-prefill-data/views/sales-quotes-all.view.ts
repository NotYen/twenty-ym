import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';

import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { DEFAULT_VIEW_FIELD_SIZE } from 'src/engine/workspace-manager/standard-objects-prefill-data/views/constants/DEFAULT_VIEW_FIELD_SIZE';
import {
    BASE_OBJECT_STANDARD_FIELD_IDS,
    SALES_QUOTE_STANDARD_FIELD_IDS,
} from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';

export const salesQuotesAllView = (
  objectMetadataItems: ObjectMetadataEntity[],
  useCoreNaming = false,
): ReturnType<typeof createSalesQuoteView> | null => {
  const salesQuoteObjectMetadata = objectMetadataItems.find(
    (object) => object.standardId === STANDARD_OBJECT_IDS.salesQuote,
  );

  if (!salesQuoteObjectMetadata) {
    // 優雅地跳過，不拋出錯誤，避免阻塞其他 views 的創建
    console.warn('[salesQuotesAllView] SalesQuote object metadata not found, skipping view creation');
    return null;
  }

  return createSalesQuoteView(salesQuoteObjectMetadata, useCoreNaming);
};

const createSalesQuoteView = (
  salesQuoteObjectMetadata: ObjectMetadataEntity,
  useCoreNaming: boolean,
) => {

  return {
    name: useCoreNaming ? msg`All {objectLabelPlural}` : 'All Sales Quotes',
    objectMetadataId: salesQuoteObjectMetadata.id ?? '',
    type: 'table',
    key: 'INDEX',
    position: 0,
    icon: 'IconList',
    kanbanFieldMetadataId: '',
    filters: [],
    fields: [
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.mingCheng,
          )?.id ?? '',
        position: 0,
        isVisible: true,
        size: DEFAULT_VIEW_FIELD_SIZE,
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
            (field) => field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.company,
          )?.id ?? '',
        position: 2,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) => field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.contact,
          )?.id ?? '',
        position: 3,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaRiQi,
          )?.id ?? '',
        position: 4,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.jieZhiRiQi,
          )?.id ?? '',
        position: 5,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) => field.standardId === SALES_QUOTE_STANDARD_FIELD_IDS.zongJi,
          )?.id ?? '',
        position: 6,
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
        position: 7,
        isVisible: true,
        size: 150,
      },
      {
        fieldMetadataId:
          salesQuoteObjectMetadata.fields.find(
            (field) =>
              field.standardId === BASE_OBJECT_STANDARD_FIELD_IDS.createdAt,
          )?.id ?? '',
        position: 8,
        isVisible: true,
        size: 150,
      },
    ],
  };
}
