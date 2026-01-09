import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from '~/generated-metadata/graphql';

export type AdvancedFilterPlaceholderTranslations = {
  enterValueFor: (label: string) => string;
  enterNumber: string;
  enterDate: string;
  selectActor: string;
  select: (name: string) => string;
  enterValue: string;
};

// TODO: Refactor with composite filters
export const getAdvancedFilterInputPlaceholderText = (
  fieldMetadataItem: FieldMetadataItem,
  translations: AdvancedFilterPlaceholderTranslations,
) => {
  switch (fieldMetadataItem.type) {
    case FieldMetadataType.TEXT:
    case FieldMetadataType.ADDRESS:
    case FieldMetadataType.LINKS:
    case FieldMetadataType.EMAILS:
    case FieldMetadataType.NUMERIC:
    case FieldMetadataType.RATING:
    case FieldMetadataType.PHONES:
    case FieldMetadataType.ARRAY:
    case FieldMetadataType.FULL_NAME:
      return translations.enterValueFor(fieldMetadataItem.label);
    case FieldMetadataType.NUMBER:
      return translations.enterNumber;
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME:
      return translations.enterDate;
    case FieldMetadataType.ACTOR:
      return translations.selectActor;
    case FieldMetadataType.RELATION:
      return translations.select(
        fieldMetadataItem.relation?.targetObjectMetadata.nameSingular ?? '',
      );
    case FieldMetadataType.SELECT:
    case FieldMetadataType.MULTI_SELECT:
      return translations.select(fieldMetadataItem.label);

    default:
      return translations.enterValue;
  }
};
