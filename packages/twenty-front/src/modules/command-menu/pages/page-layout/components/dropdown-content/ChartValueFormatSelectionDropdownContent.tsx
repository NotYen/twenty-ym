import { usePageLayoutIdFromContextStoreTargetedRecord } from '@/command-menu/pages/page-layout/hooks/usePageLayoutFromContextStoreTargetedRecord';
import { useUpdateCurrentWidgetConfig } from '@/command-menu/pages/page-layout/hooks/useUpdateCurrentWidgetConfig';
import { useWidgetInEditMode } from '@/command-menu/pages/page-layout/hooks/useWidgetInEditMode';
import {
  getValueFormatLabel,
  VALUE_FORMAT_OPTIONS,
  type ValueDisplayType,
} from '@/command-menu/pages/page-layout/utils/getValueFormatLabel';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownComponentInstanceContext } from '@/ui/layout/dropdown/contexts/DropdownComponentInstanceContext';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { selectedItemIdComponentState } from '@/ui/layout/selectable-list/states/selectedItemIdComponentState';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { MenuItemSelect } from 'twenty-ui/navigation';
import { type PieChartConfiguration } from '~/generated/graphql';

export const ChartValueFormatSelectionDropdownContent = () => {
  const { pageLayoutId } = usePageLayoutIdFromContextStoreTargetedRecord();
  const { widgetInEditMode } = useWidgetInEditMode(pageLayoutId);
  const { updateCurrentWidgetConfig } =
    useUpdateCurrentWidgetConfig(pageLayoutId);

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

  const handleFormatSelect = (format: ValueDisplayType) => {
    updateCurrentWidgetConfig({
      configToUpdate: {
        valueDisplayType: format,
      },
    });
    closeDropdown();
  };

  const currentFormat = configuration?.valueDisplayType ?? 'shortNumber';

  return (
    <DropdownMenuItemsContainer>
      <SelectableList
        selectableListInstanceId={dropdownId}
        focusId={dropdownId}
        selectableItemIdArray={VALUE_FORMAT_OPTIONS}
      >
        {VALUE_FORMAT_OPTIONS.map((option) => (
          <SelectableListItem
            key={option}
            itemId={option}
            onEnter={() => handleFormatSelect(option)}
          >
            <MenuItemSelect
              text={getValueFormatLabel(option)}
              selected={currentFormat === option}
              focused={selectedItemId === option}
              onClick={() => handleFormatSelect(option)}
            />
          </SelectableListItem>
        ))}
      </SelectableList>
    </DropdownMenuItemsContainer>
  );
};
