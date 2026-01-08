import { useCallback, useContext, useMemo } from 'react';
import { useRecoilCallback, useRecoilState } from 'recoil';

import { BLOCK_SCHEMA } from '@/activities/blocks/constants/Schema';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { modifyRecordFromCache } from '@/object-record/cache/utils/modifyRecordFromCache';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { type FieldRichTextV2Metadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { BlockEditor } from '@/ui/input/editor/components/BlockEditor';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { isArray, isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';

export const GenericRichTextFieldInput = () => {
  const { fieldDefinition, recordId, isRecordFieldReadOnly } =
    useContext(FieldContext);

  const fieldName = fieldDefinition.metadata.fieldName;
  const objectMetadataNameSingular = (
    fieldDefinition as { metadata: FieldRichTextV2Metadata }
  ).metadata.objectMetadataNameSingular;

  const [recordInStore] = useRecoilState(recordStoreFamilyState(recordId));
  const cache = useApolloCoreClient().cache;

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: objectMetadataNameSingular ?? '',
  });

  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: objectMetadataNameSingular ?? '',
  });

  const fieldValue = recordInStore?.[fieldName] as
    | { blocknote?: string; markdown?: string }
    | undefined;

  const persistBodyDebounced = useDebouncedCallback(
    async (blocknote: string) => {
      if (isRecordFieldReadOnly) return;

      await updateOneRecord({
        idToUpdate: recordId,
        updateOneRecordInput: {
          [fieldName]: {
            blocknote,
            markdown: null,
          },
        },
      });
    },
    300,
  );

  const handlePersistBody = useCallback(
    (body: string) => {
      persistBodyDebounced(body);
    },
    [persistBodyDebounced],
  );

  const handleBodyChange = useRecoilCallback(
    ({ set }) =>
      (newStringifiedBody: string) => {
        set(recordStoreFamilyState(recordId), (oldRecord) => {
          return {
            ...oldRecord,
            id: recordId,
            [fieldName]: {
              blocknote: newStringifiedBody,
              markdown: null,
            },
          };
        });

        modifyRecordFromCache({
          recordId,
          fieldModifiers: {
            [fieldName]: () => ({
              blocknote: newStringifiedBody,
              markdown: null,
            }),
          },
          cache,
          objectMetadataItem,
        });

        handlePersistBody(newStringifiedBody);
      },
    [recordId, fieldName, cache, objectMetadataItem, handlePersistBody],
  );

  const handleBodyChangeDebounced = useDebouncedCallback(handleBodyChange, 500);

  const handleEditorChange = () => {
    const newStringifiedBody = JSON.stringify(editor.document) ?? '';
    handleBodyChangeDebounced(newStringifiedBody);
  };

  const initialBody = useMemo(() => {
    const blocknote = fieldValue?.blocknote;

    if (isNonEmptyString(blocknote) && blocknote !== '{}') {
      let parsedBody: PartialBlock[] | undefined = undefined;

      try {
        parsedBody = JSON.parse(blocknote);
      } catch {
        // eslint-disable-next-line no-console
        console.warn(
          `Failed to parse body for record ${recordId}, field ${fieldName}`,
        );
      }

      if (isArray(parsedBody) && parsedBody.length === 0) {
        return undefined;
      }

      return parsedBody;
    }

    return undefined;
  }, [fieldValue, recordId, fieldName]);

  const editor = useCreateBlockNote({
    initialContent: initialBody,
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
  });

  if (!isDefined(objectMetadataNameSingular)) {
    return null;
  }

  return (
    <BlockEditor
      onChange={handleEditorChange}
      editor={editor}
      readonly={isRecordFieldReadOnly}
    />
  );
};
