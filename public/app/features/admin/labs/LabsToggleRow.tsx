import { css } from '@emotion/css';
import { useId } from 'react';
import { Controller, Control } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { InlineSwitch, Stack, Text, useStyles2 } from '@grafana/ui';

import { FeatureToggleRowDTO } from './types';

export interface LabsFormValues {
  [flagName: string]: boolean;
}

const getRowStyles = (theme: GrafanaTheme2) => ({
  row: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  }),
});

export interface LabsToggleRowProps {
  control: Control<LabsFormValues>;
  toggle: FeatureToggleRowDTO;
  canWrite: boolean;
}

export function LabsToggleRow({ control, toggle, canWrite }: LabsToggleRowProps) {
  const descId = useId();
  const styles = useStyles2(getRowStyles);
  const disabled = toggle.readOnly || toggle.unavailable || !canWrite;

  return (
    <div className={styles.row}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="column" gap={0.5}>
          <Text element="h3" variant="bodySmall" weight="bold">
            {toggle.name}
          </Text>
          {toggle.description ? (
            <Text variant="bodySmall" color="secondary" id={descId}>
              {toggle.description}
            </Text>
          ) : null}
          <Text variant="bodySmall" color="secondary">
            {[
              toggle.owner,
              toggle.stage,
              toggle.requiresRestart ? t('labs.meta.requires-restart', 'requires restart') : '',
              toggle.requiresDevMode ? t('labs.meta.dev-mode-only', 'dev mode only') : '',
              toggle.readOnly ? t('labs.meta.set-in-config', 'set in config file') : '',
              toggle.unavailable && toggle.unavailableReason ? toggle.unavailableReason : '',
            ]
              .filter(Boolean)
              .join(t('labs.meta.separator', ' · '))}
          </Text>
        </Stack>
        <Controller
          name={toggle.name}
          control={control}
          render={({ field: { value, onChange, ref, onBlur, name } }) => (
            <InlineSwitch
              value={value ?? false}
              onChange={(e) => onChange(e.currentTarget.checked)}
              ref={ref}
              onBlur={onBlur}
              id={name}
              disabled={disabled}
              showLabel={false}
              aria-label={toggle.name}
              aria-describedby={toggle.description ? descId : undefined}
            />
          )}
        />
      </Stack>
    </div>
  );
}
