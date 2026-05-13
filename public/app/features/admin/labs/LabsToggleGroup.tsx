import { Control } from 'react-hook-form';

import { Stack, Text } from '@grafana/ui';

import { LabsFormValues, LabsToggleRow } from './LabsToggleRow';
import { FeatureToggleRowDTO, FeatureToggleStage } from './types';

const STAGE_TITLE: Record<FeatureToggleStage, string> = {
  experimental: 'Experimental',
  privatePreview: 'Private preview',
  preview: 'Public preview',
  GA: 'General availability',
  deprecated: 'Deprecated',
  unknown: 'Unknown',
};

export interface LabsToggleGroupProps {
  stage: FeatureToggleStage;
  toggles: FeatureToggleRowDTO[];
  control: Control<LabsFormValues>;
  canWrite: boolean;
}

export function LabsToggleGroup({ stage, toggles, control, canWrite }: LabsToggleGroupProps) {
  if (toggles.length === 0) {
    return null;
  }

  return (
    <Stack direction="column" gap={1}>
      <Text element="h2" variant="h5">
        {STAGE_TITLE[stage]}
      </Text>
      <Stack direction="column" gap={0}>
        {toggles.map((t) => (
          <LabsToggleRow key={t.name} toggle={t} control={control} canWrite={canWrite} />
        ))}
      </Stack>
    </Stack>
  );
}
