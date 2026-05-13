import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { t } from '@grafana/i18n';
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Input,
  Stack,
  TextLink,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useAppNotification } from 'app/core/copy/appNotification';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { LabsToggleGroup } from './LabsToggleGroup';
import { LabsFormValues } from './LabsToggleRow';
import { useGetFeatureMgmtQuery, useUpdateFeatureMgmtMutation } from './featureMgmtApi';
import { FeatureToggleRowDTO, FeatureToggleStage } from './types';

const STAGE_ORDER: FeatureToggleStage[] = [
  'experimental',
  'privatePreview',
  'preview',
  'GA',
  'deprecated',
  'unknown',
];

function groupByStage(rows: FeatureToggleRowDTO[]): Record<FeatureToggleStage, FeatureToggleRowDTO[]> {
  const out: Record<FeatureToggleStage, FeatureToggleRowDTO[]> = {
    experimental: [],
    privatePreview: [],
    preview: [],
    GA: [],
    deprecated: [],
    unknown: [],
  };
  for (const r of rows) {
    const stage = r.stage in out ? r.stage : 'unknown';
    out[stage].push(r);
  }
  return out;
}

export default function LabsPage() {
  const notifyApp = useAppNotification();
  const { data, isLoading, error } = useGetFeatureMgmtQuery();
  const [updateFeatureMgmt, { isLoading: saving }] = useUpdateFeatureMgmtMutation();
  const [query, setQuery] = useState('');
  const canWrite = contextSrv.hasPermission(AccessControlAction.ActionFeatureManagementWrite);

  const methods = useForm<LabsFormValues>({ defaultValues: {} });
  const { reset, handleSubmit, formState, control } = methods;

  useEffect(() => {
    if (!data?.toggles) {
      return;
    }
    const next: LabsFormValues = {};
    for (const toggle of data.toggles) {
      next[toggle.name] = toggle.afterRestart;
    }
    reset(next);
  }, [data, reset]);

  const filtered = useMemo(() => {
    if (!data?.toggles) {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return data.toggles;
    }
    return data.toggles.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.owner && t.owner.toLowerCase().includes(q))
    );
  }, [data, query]);

  const grouped = useMemo(() => groupByStage(filtered), [filtered]);

  const onSubmit = useCallback(
    async (values: LabsFormValues) => {
      if (!data?.toggles) {
        return;
      }
      const updates: Array<{ name: string; enabled: boolean }> = [];
      const removeOverrides: string[] = [];
      for (const toggle of data.toggles) {
        if (toggle.readOnly || toggle.unavailable) {
          continue;
        }
        const want = values[toggle.name];
        if (want === toggle.inheritedAfterRestart) {
          if (toggle.hasOverride) {
            removeOverrides.push(toggle.name);
          }
        } else {
          updates.push({ name: toggle.name, enabled: want });
        }
      }
      try {
        const next = await updateFeatureMgmt({
          updates: updates.length ? updates : undefined,
          removeOverrides: removeOverrides.length ? removeOverrides : undefined,
        }).unwrap();
        notifyApp.success(t('labs.save-success', 'Feature toggle overrides saved'));
        const nextValues: LabsFormValues = {};
        for (const toggle of next.toggles) {
          nextValues[toggle.name] = toggle.afterRestart;
        }
        reset(nextValues);
      } catch (e) {
        notifyApp.error(t('labs.save-error', 'Failed to save feature toggles'));
      }
    },
    [data, notifyApp, reset, updateFeatureMgmt]
  );

  const resetAllOverrides = useCallback(async () => {
    if (!data?.toggles) {
      return;
    }
    const removeOverrides = data.toggles.filter((t) => t.hasOverride && !t.readOnly && !t.unavailable).map((t) => t.name);
    if (!removeOverrides.length) {
      return;
    }
    try {
      const next = await updateFeatureMgmt({ removeOverrides }).unwrap();
      notifyApp.success(t('labs.reset-success', 'Overrides cleared'));
      const nextValues: LabsFormValues = {};
      for (const toggle of next.toggles) {
        nextValues[toggle.name] = toggle.afterRestart;
      }
      reset(nextValues);
    } catch (e) {
      notifyApp.error(t('labs.reset-error', 'Failed to clear overrides'));
    }
  }, [data, notifyApp, reset, updateFeatureMgmt]);

  const hasRemovableOverrides = Boolean(
    data?.toggles?.some((t) => t.hasOverride && !t.readOnly && !t.unavailable)
  );

  return (
    <Page
      navId="labs"
      subTitle={t('labs.subtitle', 'Manage feature toggles for this Grafana instance. Changes apply after a restart.')}
    >
      <Page.Contents>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack direction="column" gap={2}>
              {data?.restartRequired ? (
                <Alert
                  severity="warning"
                  title={t('labs.restart-required-title', 'Restart required')}
                >
                  {t(
                    'labs.restart-required-body',
                    'Some saved overrides do not match the running process. Restart Grafana to apply changes.'
                  )}
                </Alert>
              ) : null}

              {error ? (
                <Alert severity="error" title={t('labs.load-error', 'Failed to load feature toggles')} />
              ) : null}

              <Stack direction="row" gap={2} wrap="wrap" alignItems="flex-end" justifyContent="space-between">
                <Field
                  noMargin
                  label={t('labs.search', 'Search')}
                  description={t('labs.search-desc', 'Filter by name, description, or owner')}
                >
                  <Input
                    width={50}
                    placeholder={t('labs.search-placeholder', 'Filter…')}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                  />
                </Field>
                <Stack direction="row" gap={1}>
                  <Button
                    type="button"
                    fill="outline"
                    variant="secondary"
                    disabled={!canWrite || !hasRemovableOverrides || saving}
                    onClick={resetAllOverrides}
                  >
                    {t('labs.reset-overrides', 'Reset saved overrides')}
                  </Button>
                  <Button type="submit" disabled={!canWrite || !formState.isDirty || saving}>
                    {t('labs.save', 'Save changes')}
                  </Button>
                </Stack>
              </Stack>

              {isLoading ? (
                <>{t('labs.loading', 'Loading…')}</>
              ) : error ? null : filtered.length === 0 ? (
                <EmptyState variant="not-found" message={t('labs.empty', 'No feature toggles match your filter')} />
              ) : (
                <Stack direction="column" gap={3}>
                  {STAGE_ORDER.map((stage) => (
                    <LabsToggleGroup
                      key={stage}
                      stage={stage}
                      toggles={grouped[stage]}
                      control={control}
                      canWrite={canWrite}
                    />
                  ))}
                </Stack>
              )}

              <TextLink
                href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/"
                external
              >
                {t('labs.docs-link', 'Feature toggles documentation')}
              </TextLink>
            </Stack>
          </form>
        </FormProvider>
      </Page.Contents>
    </Page>
  );
}
