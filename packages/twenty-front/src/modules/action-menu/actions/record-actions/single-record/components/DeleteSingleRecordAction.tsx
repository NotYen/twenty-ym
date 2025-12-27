import { ActionModal } from '@/action-menu/actions/components/ActionModal';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useFindManyRecordsSelectedInContextStore } from '@/context-store/hooks/useFindManyRecordsSelectedInContextStore';
import { useDeleteFavorite } from '@/favorites/hooks/useDeleteFavorite';
import { useFavorites } from '@/favorites/hooks/useFavorites';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useRecordIndexIdFromCurrentContextStore } from '@/object-record/record-index/hooks/useRecordIndexIdFromCurrentContextStore';
import { useResetTableRowSelection } from '@/object-record/record-table/hooks/internal/useResetTableRowSelection';
import { msg, t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';

export const DeleteSingleRecordAction = () => {
  const { recordIndexId, objectMetadataItem } =
    useRecordIndexIdFromCurrentContextStore();

  const recordId = useSelectedRecordIdOrThrow();

  const { resetTableRowSelection } = useResetTableRowSelection(recordIndexId);

  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const { sortedFavorites: favorites } = useFavorites();
  const { deleteFavorite } = useDeleteFavorite();

  const { i18n } = useLingui();

  // 取得選中記錄的名稱
  const { records: selectedRecords } = useFindManyRecordsSelectedInContextStore(
    {
      limit: 1,
    },
  );

  const getRecordName = (): string => {
    if (selectedRecords.length === 0) {
      return '';
    }
    const record = selectedRecords[0];
    const identifier = getObjectRecordIdentifier({
      objectMetadataItem,
      record,
    });
    return identifier.name.trim() || t`Untitled`;
  };

  const recordName = getRecordName();

  const handleDeleteClick = async () => {
    resetTableRowSelection();

    const foundFavorite = favorites?.find(
      (favorite) => favorite.recordId === recordId,
    );

    if (isDefined(foundFavorite)) {
      deleteFavorite(foundFavorite.id);
    }

    await deleteOneRecord(recordId);
  };

  const subtitle = recordName
    ? t`Are you sure you want to delete "${recordName}"?`
    : t`Are you sure you want to delete this record?`;

  return (
    <ActionModal
      title={i18n._(msg`Delete`)}
      subtitle={subtitle}
      onConfirmClick={handleDeleteClick}
      confirmButtonText={i18n._(msg`Confirm Delete`)}
    />
  );
};
