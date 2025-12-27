import { useObjectRecordSearchRecords } from '@/object-record/hooks/useObjectRecordSearchRecords';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const DEBOUNCE_DELAY = 150;
const MAX_SUGGESTIONS = 5;

export type DuplicateSuggestionRecord = {
  recordId: string;
  objectNameSingular: string;
  label: string;
};

type UseDuplicateNameSuggestionProps = {
  objectNameSingular: string;
  searchValue: string;
  excludeRecordId?: string;
  enabled?: boolean;
};

export const useDuplicateNameSuggestion = ({
  objectNameSingular,
  searchValue,
  excludeRecordId,
  enabled = true,
}: UseDuplicateNameSuggestionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [previousSearchValue, setPreviousSearchValue] = useState(searchValue);

  const debouncedSetSearchValue = useDebouncedCallback((value: string) => {
    setDebouncedSearchValue(value);
  }, DEBOUNCE_DELAY);

  useEffect(() => {
    if (previousSearchValue !== searchValue) {
      setPreviousSearchValue(searchValue);
      debouncedSetSearchValue(searchValue);
    }
  }, [searchValue, previousSearchValue, debouncedSetSearchValue]);

  const shouldSearch =
    enabled === true &&
    debouncedSearchValue.length > 0 &&
    objectNameSingular.length > 0;

  // 使用正確的 ObjectRecordFilterInput 格式排除當前記錄
  const excludeFilter = excludeRecordId
    ? { not: { id: { eq: excludeRecordId } } }
    : undefined;

  const { searchRecords, loading } = useObjectRecordSearchRecords({
    objectNameSingulars: [objectNameSingular],
    searchInput: debouncedSearchValue,
    limit: MAX_SUGGESTIONS,
    skip: !shouldSearch,
    filter: excludeFilter,
    fetchPolicy: 'cache-first',
  });

  const suggestions: DuplicateSuggestionRecord[] = useMemo(() => {
    if (!shouldSearch || !searchRecords) {
      return [];
    }

    return searchRecords.map((record) => ({
      recordId: record.recordId,
      objectNameSingular: record.objectNameSingular,
      label: record.label ?? '',
    }));
  }, [searchRecords, shouldSearch]);

  useEffect(() => {
    const hasSuggestionsToShow = suggestions.length > 0;
    if (hasSuggestionsToShow && shouldSearch === true) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [suggestions.length, shouldSearch]);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openSuggestions = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  return {
    suggestions,
    loading,
    isOpen,
    closeSuggestions,
    openSuggestions,
    hasSuggestions: suggestions.length > 0,
  };
};
