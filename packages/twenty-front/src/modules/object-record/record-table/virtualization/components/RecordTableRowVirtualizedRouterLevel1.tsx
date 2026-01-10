import { RecordTableRowVirtualizedRouterLevel2 } from '@/object-record/record-table/virtualization/components/RecordTableRowVirtualizedRouterLevel2';
import { RecordTableRowVirtualizedSkeleton } from '@/object-record/record-table/virtualization/components/RecordTableRowVirtualizedSkeleton';

type RecordTableRowVirtualizedRouterLevel1Props = {
  realIndex: number;
  lowDetailsActivated: boolean;
};

export const RecordTableRowVirtualizedRouterLevel1 = ({
  realIndex,
  lowDetailsActivated,
}: RecordTableRowVirtualizedRouterLevel1Props) => {
  if (lowDetailsActivated) {
    return <RecordTableRowVirtualizedSkeleton />;
  }

  return <RecordTableRowVirtualizedRouterLevel2 realIndex={realIndex} />;
};
