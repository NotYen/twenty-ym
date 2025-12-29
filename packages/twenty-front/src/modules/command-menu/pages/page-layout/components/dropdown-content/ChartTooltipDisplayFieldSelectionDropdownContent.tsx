import { usePageLayoutIdFromContextStoreTargetedRecord } from '@/command-menu/pages/page-layout/hooks/usePageLayoutFromContextStoreTargetedRecord';
import { useUpdateCurrentWidgetConfig } from '@/command-menu/pages/page-layout/hooks/useUpdateCurrentWidgetConfig';
import { useWidgetInEditMode } from '@/command-menu/pages/page-layout/hooks/useWidgetInEditMode';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownComponentInstanceContext } from '@/ui/layout/dropdown/contexts/DropdownComponentInstanceContext';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { selectedItemIdComponentState } from '@/ui/layout/selectable-list/states/selectedItemIdComponentState';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { MenuItemSelect } from 'twenty-ui/navigation';
import { type PieChartConfiguration } from '~/generated/graphql';

const DEFAULT_FIELD_ID = '__default__';

export const ChartTooltipDisplayFieldSelectionDropdownContent = () => {
  const { pageLayoutId } = usePageLayoutIdFromContextStoreTargetedRecord();
  const { widgetInEditMode } = useWidgetInEditMode(pageLayoutId);
  const { updateCurrentWidgetConfig } =
    useUpdateCurrentWidgetConfig(pageLayoutId);
  const { objectMetadataItems } = useObjectMetadataItems();

  const dropdownId = useAvailableComponentInstanceIdOrThrow(
    DropdownComponentInstanceContext,
  );

  const selectedItemId = useRecoilComponentValue(
    selectedItemIdComponentState,
    dropdownId,
  );

  const { closeDropdown } = useCloseDropdown();

  const configuration = widgetInEditMode?.configuration as
    | PieChartConfiguration
    | undefined;

  if (configuration?.__typename !== 'PieChartConfiguration') {
    throw new Error('Invalid configuration type');
  }

  // Get the object metadata for this widget
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.id === widgetInEditMode?.objectMetadataId,
  );

  // Get displayable fields (non-system, active fields)
  const displayableFields =
    objectMetadataItem?.fields.filter(
      (field) => !field.isSystem && field.isActive,
    ) ?? [];

  const handleFieldSelect = (fieldId: string | null) => {
    updateCurrentWidgetConfig({
      configToUpdate: {
        tooltipDisplayFieldMetadataId: fieldId,
      },
    });
    closeDropdown();
  };

  const currentFieldId = configuration?.tooltipDisplayFieldMetadataId;
  const selectableItemIds = [
    DEFAULT_FIELD_ID,
    ...displayableFields.map((f) => f.id),
  ];

  return (
    <DropdownMenuItemsContainer>
      <SelectableList
        selectableListInstanceId={dropdownId}
        focusId={dropdownId}
        selectableItemIdArray={selectableItemIds}
      >
        <SelectableListItem
          itemId={DEFAULT_FIELD_ID}
          onEnter={() => handleFieldSelect(null)}
        >
          <MenuItemSelect
            text={t`Default (Name)`}
            onClick={() => handleFieldSelect(null)}
            selected={!isDefined(currentFieldId)}
            focused={selectedItemId === DEFAULT_FIELD_ID}
          />
        </SelectableListItem>
        {displayableFields.map((field) => (
          <SelectableListItem
            key={field.id}
            itemId={field.id}
            onEnter={() => handleFieldSelect(field.id)}
          >
            <MenuItemSelect
              text={field.label}
              onClick={() => handleFieldSelect(field.id)}
              selected={currentFieldId === field.id}
              focused={selectedItemId === field.id}
            />
          </SelectableListItem>
        ))}
      </SelectableList>
    </DropdownMenuItemsContainer>
  );
};
