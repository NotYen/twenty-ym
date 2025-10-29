import { type ApolloError } from '@apollo/client';
import { useCallback } from 'react';

import { triggerUpdateRecordOptimisticEffect } from '@/apollo/optimistic-effect/utils/triggerUpdateRecordOptimisticEffect';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useGetRecordFromCache } from '@/object-record/cache/hooks/useGetRecordFromCache';
import { getObjectTypename } from '@/object-record/cache/utils/getObjectTypename';
import { getRecordNodeFromRecord } from '@/object-record/cache/utils/getRecordNodeFromRecord';
import { updateRecordFromCache } from '@/object-record/cache/utils/updateRecordFromCache';
import { useDeleteOneRecordMutation } from '@/object-record/hooks/useDeleteOneRecordMutation';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useRefetchAggregateQueries } from '@/object-record/hooks/useRefetchAggregateQueries';
import { useRegisterObjectOperation } from '@/object-record/hooks/useRegisterObjectOperation';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getDeleteOneRecordMutationResponseField } from '@/object-record/utils/getDeleteOneRecordMutationResponseField';
import { isNull } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

type useDeleteOneRecordProps = {
  objectNameSingular: string;
};

export const useDeleteOneRecord = ({
  objectNameSingular,
}: useDeleteOneRecordProps) => {
  const { registerObjectOperation } = useRegisterObjectOperation();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();
  const apolloCoreClient = useApolloCoreClient();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const getRecordFromCache = useGetRecordFromCache({
    objectNameSingular,
  });

  const { deleteOneRecordMutation } = useDeleteOneRecordMutation({
    objectNameSingular,
  });

  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { refetchAggregateQueries } = useRefetchAggregateQueries({
    objectMetadataNamePlural: objectMetadataItem.namePlural,
  });

  const mutationResponseField =
    getDeleteOneRecordMutationResponseField(objectNameSingular);

  const deleteOneRecord = useCallback(
    async (idToDelete: string) => {
      console.log('=== useDeleteOneRecord Debug ===');
      console.log('1. 开始删除记录, ID:', idToDelete);
      console.log('2. objectNameSingular:', objectNameSingular);

      const cachedRecord = getRecordFromCache(
        idToDelete,
        apolloCoreClient.cache,
      );
      console.log('3. cachedRecord:', cachedRecord);

      const cachedRecordNode = getRecordNodeFromRecord<ObjectRecord>({
        record: cachedRecord,
        objectMetadataItem,
        objectMetadataItems,
        computeReferences: false,
      });
      console.log('4. cachedRecordNode:', cachedRecordNode);

      const currentTimestamp = new Date().toISOString();
      const computedOptimisticRecord = {
        ...cachedRecord,
        id: idToDelete,
        deletedAt: currentTimestamp,
        __typename: getObjectTypename(objectMetadataItem.nameSingular),
      };
      const optimisticRecordNode = getRecordNodeFromRecord<ObjectRecord>({
        record: computedOptimisticRecord,
        objectMetadataItem,
        objectMetadataItems,
        computeReferences: false,
      });

      const shouldHandleOptimisticCache =
        !isNull(cachedRecord) &&
        isDefined(optimisticRecordNode) &&
        isDefined(cachedRecordNode);

      if (shouldHandleOptimisticCache) {
        const recordGqlFields = {
          deletedAt: true,
        };
        updateRecordFromCache({
          objectMetadataItems,
          objectMetadataItem,
          cache: apolloCoreClient.cache,
          record: computedOptimisticRecord,
          recordGqlFields,
          objectPermissionsByObjectMetadataId,
        });

        triggerUpdateRecordOptimisticEffect({
          cache: apolloCoreClient.cache,
          objectMetadataItem,
          currentRecord: cachedRecordNode,
          updatedRecord: optimisticRecordNode,
          objectMetadataItems,
          objectPermissionsByObjectMetadataId,
          upsertRecordsInStore,
        });
      }

      console.log('5. 发送 GraphQL delete mutation...');
      const deletedRecord = await apolloCoreClient
        .mutate({
          mutation: deleteOneRecordMutation,
          variables: {
            idToDelete: idToDelete,
          },
          update: (cache, { data }) => {
            console.log('6. Mutation update callback, data:', data);
            const record = data?.[mutationResponseField];
            if (!isDefined(record) || !shouldHandleOptimisticCache) {
              console.log(
                '7. 跳过 cache 更新, record:',
                record,
                'shouldHandle:',
                shouldHandleOptimisticCache,
              );
              return;
            }

            console.log('8. 触发 optimistic effect...');
            triggerUpdateRecordOptimisticEffect({
              cache,
              objectMetadataItem,
              currentRecord: optimisticRecordNode,
              updatedRecord: record,
              objectMetadataItems,
              objectPermissionsByObjectMetadataId,
              upsertRecordsInStore,
            });
          },
        })
        .catch((error: ApolloError) => {
          console.error('9. Delete mutation 失败:', error);
          console.error('   - Message:', error.message);
          console.error('   - GraphQL Errors:', error.graphQLErrors);
          if (!shouldHandleOptimisticCache) {
            throw error;
          }

          const recordGqlFields = {
            deletedAt: true,
          };
          updateRecordFromCache({
            objectMetadataItems,
            objectMetadataItem,
            cache: apolloCoreClient.cache,
            record: {
              ...cachedRecord,
              deletedAt: null,
            },
            recordGqlFields,
            objectPermissionsByObjectMetadataId,
          });

          triggerUpdateRecordOptimisticEffect({
            cache: apolloCoreClient.cache,
            objectMetadataItem,
            currentRecord: optimisticRecordNode,
            updatedRecord: cachedRecordNode,
            objectMetadataItems,
            objectPermissionsByObjectMetadataId,
            upsertRecordsInStore,
          });

          throw error;
        });

      console.log('10. Refetching aggregate queries...');
      await refetchAggregateQueries();

      console.log('11. 注册删除操作...');
      registerObjectOperation(objectNameSingular, {
        type: 'delete-one',
      });

      console.log(
        '12. 删除完成！返回结果:',
        deletedRecord.data?.[mutationResponseField],
      );
      return deletedRecord.data?.[mutationResponseField] ?? null;
    },
    [
      getRecordFromCache,
      apolloCoreClient,
      objectMetadataItem,
      objectMetadataItems,
      deleteOneRecordMutation,
      refetchAggregateQueries,
      registerObjectOperation,
      objectNameSingular,
      mutationResponseField,
      objectPermissionsByObjectMetadataId,
      upsertRecordsInStore,
    ],
  );

  return {
    deleteOneRecord,
  };
};
