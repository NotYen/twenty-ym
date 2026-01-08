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
import { SALES_QUOTE_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import {
    type FieldTypeAndNameMetadata,
    getTsVectorColumnExpressionFromFields,
} from 'src/engine/workspace-manager/workspace-sync-metadata/utils/get-ts-vector-column-expression.util';
import { AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { FavoriteWorkspaceEntity } from 'src/modules/favorite/standard-objects/favorite.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { SalesQuoteLineItemWorkspaceEntity } from './sales-quote-line-item.workspace-entity';

const NAME_FIELD_NAME = 'name';
const NUMBER_FIELD_NAME = 'baoJiaDanHao';

export const SEARCH_FIELDS_FOR_SALES_QUOTE: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
  { name: NUMBER_FIELD_NAME, type: FieldMetadataType.TEXT },
];

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.salesQuote,
  namePlural: 'salesQuotes',
  labelSingular: msg`報價單`,
  labelPlural: msg`報價單列表`,
  description: msg`A sales quote`,
  icon: STANDARD_OBJECT_ICONS.salesQuote,
  labelIdentifierStandardId: SALES_QUOTE_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsSearchable()
export class SalesQuoteWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`The quote name`,
    icon: 'IconFileDescription',
  })
  name: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaDanHao,
    type: FieldMetadataType.TEXT,
    label: msg`Quote Number`,
    description: msg`The quote number`,
    icon: 'IconHash',
  })
  baoJiaDanHao: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.mingCheng,
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`The quote title`,
    icon: 'IconH1',
  })
  mingCheng: string;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.company,
    type: RelationType.MANY_TO_ONE,
    label: msg`Company`,
    description: msg`Linked company`,
    icon: 'IconBuildingSkyscraper',
    inverseSideTarget: () => CompanyWorkspaceEntity,
    inverseSideFieldKey: 'salesQuotes',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  company: Relation<CompanyWorkspaceEntity> | null;

  @WorkspaceJoinColumn('company')
  companyId: string | null;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.contact,
    type: RelationType.MANY_TO_ONE,
    label: msg`Contact`,
    description: msg`Linked contact person`,
    icon: 'IconUser',
    inverseSideTarget: () => PersonWorkspaceEntity,
    inverseSideFieldKey: 'salesQuotes',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  contact: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceJoinColumn('contact')
  contactId: string | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaRiQi,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Issue Date`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  baoJiaRiQi: Date | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.jieZhiRiQi,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Valid Until`,
    icon: 'IconCalendarTime',
  })
  @WorkspaceIsNullable()
  jieZhiRiQi: Date | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.xiaoJi,
    type: FieldMetadataType.CURRENCY,
    label: msg`Subtotal`,
    icon: 'IconCoin',
  })
  @WorkspaceIsNullable()
  xiaoJi: CurrencyMetadata | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.shuiLu,
    type: FieldMetadataType.NUMBER,
    label: msg`Tax Rate`,
    description: msg`Tax rate as a decimal (e.g. 0.05 for 5%)`,
    icon: 'IconPercentage',
    settings: {
      decimals: 2,
    },
  })
  @WorkspaceIsNullable()
  shuiLu: number | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.shuiJin,
    type: FieldMetadataType.CURRENCY,
    label: msg`Tax Amount`,
    icon: 'IconReceiptTax',
  })
  @WorkspaceIsNullable()
  shuiJin: CurrencyMetadata | null;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.zongJi,
    type: FieldMetadataType.CURRENCY,
    label: msg`Total`,
    icon: 'IconSum',
  })
  zongJi: CurrencyMetadata;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.baoJiaDanZhuangTai,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    icon: 'IconStatusChange',
    options: [
      { value: 'DRAFT', label: 'Draft', color: 'gray', position: 0 },
      { value: 'SENT', label: 'Sent', color: 'blue', position: 1 },
      { value: 'ACCEPTED', label: 'Accepted', color: 'green', position: 2 },
      { value: 'REJECTED', label: 'Rejected', color: 'red', position: 3 },
      { value: 'EXPIRED', label: 'Expired', color: 'orange', position: 4 },
    ],
  })
  @WorkspaceIsNullable()
  baoJiaDanZhuangTai: string;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.jiaoYiTiaoJian,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Terms`,
    icon: 'IconFileDescription',
  })
  @WorkspaceIsNullable()
  jiaoYiTiaoJian: any;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.salesQuoteLineItems,
    type: RelationType.ONE_TO_MANY,
    label: msg`Line Items`,
    icon: 'IconList',
    inverseSideTarget: () => SalesQuoteLineItemWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsSystem()
  salesQuoteLineItems: Relation<SalesQuoteLineItemWorkspaceEntity[]>;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  @WorkspaceIsFieldUIReadOnly()
  createdBy: ActorMetadata;

  @WorkspaceField({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.searchVector,
    type: FieldMetadataType.TS_VECTOR,
    label: SEARCH_VECTOR_FIELD.label,
    description: SEARCH_VECTOR_FIELD.description,
    icon: 'IconUser',
    generatedType: 'STORED',
    asExpression: getTsVectorColumnExpressionFromFields(
      SEARCH_FIELDS_FOR_SALES_QUOTE,
    ),
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  @WorkspaceFieldIndex({ indexType: IndexType.GIN })
  searchVector: string;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.timelineActivities,
    type: RelationType.ONE_TO_MANY,
    label: msg`Timeline Activities`,
    description: msg`Timeline Activities linked to the sales quote`,
    icon: 'IconTimelineEvent',
    inverseSideTarget: () => TimelineActivityWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  timelineActivities: Relation<TimelineActivityWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.attachments,
    type: RelationType.ONE_TO_MANY,
    label: msg`Attachments`,
    description: msg`Attachments linked to the sales quote`,
    icon: 'IconFileImport',
    inverseSideTarget: () => AttachmentWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  attachments: Relation<AttachmentWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.favorites,
    type: RelationType.ONE_TO_MANY,
    label: msg`Favorites`,
    description: msg`Favorites linked to the sales quote`,
    icon: 'IconHeart',
    inverseSideTarget: () => FavoriteWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsNullable()
  @WorkspaceIsSystem()
  favorites: Relation<FavoriteWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.noteTargets,
    type: RelationType.ONE_TO_MANY,
    label: msg`Notes`,
    description: msg`Notes tied to the sales quote`,
    icon: 'IconNotes',
    inverseSideTarget: () => NoteTargetWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsFieldUIReadOnly()
  noteTargets: Relation<NoteTargetWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: SALES_QUOTE_STANDARD_FIELD_IDS.taskTargets,
    type: RelationType.ONE_TO_MANY,
    label: msg`Tasks`,
    description: msg`Tasks tied to the sales quote`,
    icon: 'IconCheckbox',
    inverseSideTarget: () => TaskTargetWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsFieldUIReadOnly()
  taskTargets: Relation<TaskTargetWorkspaceEntity[]>;
}
