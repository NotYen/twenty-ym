import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useEffect, useMemo, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { logError } from '~/utils/logError';

const RESPONSIBLE_KEYWORDS = ['負責業務', 'responsible business'];
const CHART_DISPLAY_KEYWORDS = ['圖表', 'chart'];

type OpportunityResponsibleBusinessSyncEffectProps = {
  recordId: string;
};

export const OpportunityResponsibleBusinessSyncEffect = ({
  recordId,
}: OpportunityResponsibleBusinessSyncEffectProps) => {
  const { objectMetadataItem: opportunityMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const { objectMetadataItem: workspaceMemberMetadata } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    });

  const responsibleField = useMemo(() => {
    if (!isDefined(opportunityMetadata)) {
      return undefined;
    }

    return opportunityMetadata.fields.find((field) => {
      if (field.type !== FieldMetadataType.RELATION) {
        return false;
      }

      const targetsWorkspaceMember =
        field.relation?.targetObjectMetadata.nameSingular ===
        CoreObjectNameSingular.WorkspaceMember;

      if (!targetsWorkspaceMember) {
        return false;
      }

      const label = (field.label ?? '').toLowerCase();

      return RESPONSIBLE_KEYWORDS.some((keyword) =>
        label.includes(keyword.toLowerCase()),
      );
    });
  }, [opportunityMetadata]);

  const chartDisplayField = useMemo(() => {
    if (!isDefined(opportunityMetadata)) {
      return undefined;
    }

    return opportunityMetadata.fields.find((field) => {
      if (field.type !== FieldMetadataType.TEXT) {
        return false;
      }

      const label = (field.label ?? '').toLowerCase();

      return CHART_DISPLAY_KEYWORDS.some((keyword) =>
        label.includes(keyword.toLowerCase()),
      );
    });
  }, [opportunityMetadata]);

  const responsibleFieldName = responsibleField?.name ?? '__missing__';
  const chartDisplayFieldName = chartDisplayField?.name ?? '__missing__';

  const responsibleRelationValue = useRecoilValue(
    recordStoreFamilySelector<ObjectRecord | null | undefined>({
      recordId,
      fieldName: responsibleFieldName,
    }),
  );

  const responsibleRelationIdValue = useRecoilValue(
    recordStoreFamilySelector<string | null | undefined>({
      recordId,
      fieldName: `${responsibleFieldName}Id`,
    }),
  );

  const chartDisplayValue = useRecoilValue(
    recordStoreFamilySelector<string | null | undefined>({
      recordId,
      fieldName: chartDisplayFieldName,
    }),
  );

  const setChartDisplayValue = useSetRecoilState(
    recordStoreFamilySelector<string | null | undefined>({
      recordId,
      fieldName: chartDisplayFieldName,
    }),
  );

  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const pendingValueRef = useRef<string | null>(null);

  const responsibleMemberId = useMemo(() => {
    if (!isDefined(responsibleRelationValue)) {
      if (isDefined(responsibleRelationIdValue)) {
        return responsibleRelationIdValue ?? undefined;
      }

      return undefined;
    }

    if (typeof responsibleRelationValue === 'string') {
      return responsibleRelationValue;
    }

    const relationRecord = responsibleRelationValue as ObjectRecord;

    if (isDefined(relationRecord?.id)) {
      return relationRecord.id as string;
    }

    const foreignKeyValue = relationRecord?.[`${responsibleFieldName}Id`];

    if (typeof foreignKeyValue === 'string') {
      return foreignKeyValue;
    }

    return undefined;
  }, [
    responsibleFieldName,
    responsibleRelationValue,
    responsibleRelationIdValue,
  ]);

  const { record: responsibleMemberRecord } = useFindOneRecord<ObjectRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    objectRecordId: responsibleMemberId,
    skip: !isDefined(responsibleMemberId),
  });

  const computedResponsibleName = useMemo(() => {
    if (!isDefined(workspaceMemberMetadata)) {
      return '';
    }

    const relationRecord = responsibleRelationValue as ObjectRecord | null;

    if (!isDefined(relationRecord) || relationRecord === null) {
      return '';
    }

    const identifierName = (
      getObjectRecordIdentifier({
        objectMetadataItem: workspaceMemberMetadata,
        record: relationRecord,
      }).name ?? ''
    ).trim();

    if (identifierName.length > 0) {
      return identifierName;
    }

    const relationName = (relationRecord.name as string | undefined) ?? '';
    if (relationName.length > 0) {
      return relationName;
    }

    const relationDisplayName =
      (relationRecord.displayName as string | undefined) ?? '';
    if (relationDisplayName.length > 0) {
      return relationDisplayName;
    }

    const compositeName = relationRecord.name as
      | { firstName?: string; lastName?: string }
      | undefined;

    const firstNameFromComposite = compositeName?.firstName ?? '';
    const lastNameFromComposite = compositeName?.lastName ?? '';

    if (firstNameFromComposite.length > 0 || lastNameFromComposite.length > 0) {
      return `${firstNameFromComposite} ${lastNameFromComposite}`.trim();
    }

    const firstName = (relationRecord.firstName as string | undefined) ?? '';
    const lastName = (relationRecord.lastName as string | undefined) ?? '';

    return `${firstName} ${lastName}`.trim();
  }, [responsibleRelationValue, workspaceMemberMetadata]);

  const responsibleNameFromQuery = useMemo(() => {
    if (!isDefined(responsibleMemberRecord)) {
      return '';
    }

    const identifierName = (
      getObjectRecordIdentifier({
        objectMetadataItem: workspaceMemberMetadata,
        record: responsibleMemberRecord,
      }).name ?? ''
    ).trim();

    if (identifierName.length > 0) {
      return identifierName;
    }

    const compositeName = responsibleMemberRecord.name as
      | { firstName?: string; lastName?: string }
      | undefined;

    const firstNameFromComposite = compositeName?.firstName ?? '';
    const lastNameFromComposite = compositeName?.lastName ?? '';

    if (firstNameFromComposite.length > 0 || lastNameFromComposite.length > 0) {
      return `${firstNameFromComposite} ${lastNameFromComposite}`.trim();
    }

    const firstName =
      (responsibleMemberRecord.firstName as string | undefined) ?? '';
    const lastName =
      (responsibleMemberRecord.lastName as string | undefined) ?? '';

    return `${firstName} ${lastName}`.trim();
  }, [responsibleMemberRecord, workspaceMemberMetadata]);

  useEffect(() => {
    const responsibleFieldAvailable = responsibleFieldName !== '__missing__';
    const chartFieldAvailable = chartDisplayFieldName !== '__missing__';

    if (!responsibleFieldAvailable || !chartFieldAvailable) {
      return;
    }

    if (!isDefined(responsibleMemberId)) {
      return;
    }

    const currentChartValue = (chartDisplayValue ?? '').trim();
    const derivedName = computedResponsibleName;
    const fallbackName = responsibleNameFromQuery;

    const targetValue =
      derivedName.length > 0
        ? derivedName
        : fallbackName.length > 0
          ? fallbackName
          : '';

    if (targetValue === currentChartValue) {
      pendingValueRef.current = null;
      return;
    }

    if (pendingValueRef.current === targetValue) {
      return;
    }

    pendingValueRef.current = targetValue;

    const normalizedValue = targetValue.length > 0 ? targetValue : null;

    setChartDisplayValue(normalizedValue);

    void updateOneRecord({
      idToUpdate: recordId,
      updateOneRecordInput: {
        [chartDisplayFieldName]: normalizedValue,
      },
      optimisticRecord: {
        [chartDisplayFieldName]: normalizedValue,
      },
    }).catch((error: Error) => {
      logError('Failed to sync responsible business display field');
      logError(error);
    });
  }, [
    chartDisplayFieldName,
    chartDisplayValue,
    computedResponsibleName,
    recordId,
    responsibleFieldName,
    responsibleNameFromQuery,
    responsibleMemberId,
    setChartDisplayValue,
    updateOneRecord,
  ]);

  return null;
};


