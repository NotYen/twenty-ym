import { aiModelsState } from '@/client-config/states/aiModelsState';
import { useRecoilValue } from 'recoil';
import { type SelectOption } from 'twenty-ui/input';

export const useAiModelOptions = (): SelectOption<string>[] => {
  const aiModels = useRecoilValue(aiModelsState);

  const modelOptions = aiModels
    .map((model) => ({
      value: model.modelId,
      label: `${model.label} (${model.provider})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Always return at least one default option to prevent undefined errors
  if (modelOptions.length === 0) {
    return [
      {
        value: 'auto',
        label: 'Auto',
      },
    ];
  }

  return modelOptions;
};
