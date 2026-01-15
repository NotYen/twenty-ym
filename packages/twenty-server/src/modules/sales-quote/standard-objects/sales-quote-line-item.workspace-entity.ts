import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECT_IDS } from 'twenty-shared/metadata';
import { FieldMetadataType, RelationOnDeleteAction } from 'twenty-shared/types';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { SEARCH_VECTOR_FIELD } from 'src/engine/metadata-modules/constants/search-vector-field.constants';
import { ActorMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type';
import { CurrencyMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/currency.composite-type';
import { IndexType } from 'src/engine/metadata-modules/index-metadata/types/indexType.types';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceFieldIndex } from 'src/engine/twenty-orm/decorators/workspace-field-index.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsFieldUIReadOnly } from 'src/engine/twenty-orm/decorators/workspace-is-field-ui-readonly.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSearchable } from 'src/engine/twenty-orm/decorators/workspace-is-searchable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import {
  type FieldTypeAndNameMetadata,
  getTsVectorColumnExpressionFromFields,
} from 'src/engine/workspace-manager/workspace-sync-metadata/utils/get-ts-vector-column-expression.util';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

import { SalesQuoteWorkspaceEntity } from './sales-quote.workspace-entity';

const NAME_FIELD_NAME = 'name';

export const SEARCH_FIELDS_FOR_SALES_QUOTE_LINE_ITEM: FieldTypeAndNameMetadata[] =
  [{ name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT }];

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.salesQuoteLineItem,
  namePlural: 'salesQuoteLineItems',
  labelSingular: msg`報價單細項`,
  labelPlural: msg`報價單細項列表`,
  description: msg`An item in a sales quote`,
  icon: STANDARD_OBJECT_ICONS.salesQuoteLineItem,
  labelIdentifierStandardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsSearchable()
export class SalesQuoteLineItemWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`The line item name`,
    icon: 'IconFileDescription',
  })
  name: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.chanPinMingCheng,
    type: FieldMetadataType.TEXT,
    label: msg`Product Name`,
    icon: 'IconBox',
  })
  chanPinMingCheng: string;

  @WorkspaceField({
    standardId:
      SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.baoJiaDanXiXiangMiaoShu,
    type: FieldMetadataType.TEXT, // Description is often text or richtext? Frontend calls it description.
    label: msg`Description`,
    icon: 'IconFileDescription',
  })
  @WorkspaceIsNullable()
  baoJiaDanXiXiangMiaoShu: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.shuLiang,
    type: FieldMetadataType.NUMBER,
    label: msg`Quantity`,
    icon: 'IconNumbers',
    defaultValue: 1,
  })
  shuLiang: number;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.danJia,
    type: FieldMetadataType.CURRENCY,
    label: msg`Unit Price`,
    icon: 'IconTag',
  })
  danJia: CurrencyMetadata;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.zheKou,
    type: FieldMetadataType.NUMBER,
    label: msg`Discount`,
    description: msg`Discount percentage`,
    icon: 'IconPercentage',
  })
  @WorkspaceIsNullable()
  zheKou: number | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.jinE,
    type: FieldMetadataType.CURRENCY,
    label: msg`Amount`,
    icon: 'IconCoin',
  })
  jinE: CurrencyMetadata;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.salesQuote,
    type: RelationType.MANY_TO_ONE,
    label: msg`Sales Quote`,
    icon: STANDARD_OBJECT_ICONS.salesQuote,
    inverseSideTarget: () => SalesQuoteWorkspaceEntity,
    inverseSideFieldKey: 'salesQuoteLineItems',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  salesQuote: Relation<SalesQuoteWorkspaceEntity>;

  @WorkspaceJoinColumn('salesQuote')
  salesQuoteId: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  @WorkspaceIsFieldUIReadOnly()
  createdBy: ActorMetadata;

  @WorkspaceField({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.searchVector,
    type: FieldMetadataType.TS_VECTOR,
    label: SEARCH_VECTOR_FIELD.label,
    description: SEARCH_VECTOR_FIELD.description,
    icon: 'IconUser',
    generatedType: 'STORED',
    asExpression: getTsVectorColumnExpressionFromFields(
      SEARCH_FIELDS_FOR_SALES_QUOTE_LINE_ITEM,
    ),
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  @WorkspaceFieldIndex({ indexType: IndexType.GIN })
  searchVector: string;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.timelineActivities,
    type: RelationType.ONE_TO_MANY,
    label: msg`Timeline Activities`,
    description: msg`Timeline Activities linked to the sales quote line item`,
    icon: 'IconTimelineEvent',
    inverseSideTarget: () => TimelineActivityWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  timelineActivities: Relation<TimelineActivityWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_LINE_ITEM_STANDARD_FIELD_IDS.noteTargets,
    type: RelationType.ONE_TO_MANY,
    label: msg`Notes`,
    description: msg`Notes tied to the sales quote line item`,
    icon: 'IconNotes',
    inverseSideTarget: () => NoteTargetWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsFieldUIReadOnly()
  noteTargets: Relation<NoteTargetWorkspaceEntity[]>;
}
