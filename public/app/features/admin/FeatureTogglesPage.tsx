import { css } from '@emotion/css';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, ConfirmModal, Field, FilterInput, Select, Stack, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureToggle {
  name: string;
  description: string;
  stage: FeatureToggleStage;
  enabled: boolean;
  readOnly: boolean;
  requiresDevMode: boolean;
  requiresRestart: boolean;
  frontendOnly: boolean;
}

type FeatureToggleStage = 'experimental' | 'privatePreview' | 'preview' | 'GA' | 'deprecated' | 'unknown';

type BadgeColor = 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'darkgrey';

const STAGE_OPTIONS: Array<SelectableValue<FeatureToggleStage | 'all'>> = [
  { label: 'All stages', value: 'all' },
  { label: 'Experimental', value: 'experimental' },
  { label: 'Private preview', value: 'privatePreview' },
  { label: 'Preview', value: 'preview' },
  { label: 'GA', value: 'GA' },
  { label: 'Deprecated', value: 'deprecated' },
  { label: 'Unknown', value: 'unknown' },
];

function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const searchId = useId();
  const stageFilterId = useId();
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<FeatureToggleStage | 'all'>('all');
  const [pendingToggle, setPendingToggle] = useState<{ toggle: FeatureToggle; enabled: boolean }>();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { loading, value, error } = useAsync(
    () => getBackendSrv().get<FeatureToggle[]>('/api/admin/feature-toggles'),
    []
  );

  useEffect(() => {
    if (value) {
      setToggles(value);
    }
  }, [value]);

  useEffect(() => {
    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }, [error]);

  const [{ loading: updating, error: updateError }, updateToggle] = useAsyncFn(
    async (toggle: FeatureToggle, enabled: boolean) => {
      const updatedToggles = await getBackendSrv().put<FeatureToggle[]>('/api/admin/feature-toggles', {
        toggles: [{ name: toggle.name, enabled }],
      });

      setToggles(updatedToggles);
      setSuccessMessage(
        enabled
          ? t('admin.feature-toggles.enabled-success', 'Enabled {{name}}', { name: toggle.name })
          : t('admin.feature-toggles.disabled-success', 'Disabled {{name}}', { name: toggle.name })
      );
      setErrorMessage('');
    },
    []
  );

  useEffect(() => {
    if (updateError) {
      setErrorMessage(getErrorMessage(updateError));
    }
  }, [updateError]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredToggles = useMemo(
    () =>
      toggles.filter((toggle) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          toggle.name.toLowerCase().includes(normalizedQuery) ||
          toggle.description.toLowerCase().includes(normalizedQuery);
        const matchesStage = stageFilter === 'all' || toggle.stage === stageFilter;

        return matchesQuery && matchesStage;
      }),
    [normalizedQuery, stageFilter, toggles]
  );

  const enabledCount = toggles.filter((toggle) => toggle.enabled).length;
  const filteredEnabledCount = filteredToggles.filter((toggle) => toggle.enabled).length;
  const counterText =
    filteredToggles.length === toggles.length
      ? t('admin.feature-toggles.enabled-count', '{{enabled}} / {{total}} enabled', {
          enabled: enabledCount,
          total: toggles.length,
        })
      : t('admin.feature-toggles.filtered-enabled-count', '{{enabled}} / {{total}} enabled in filtered results', {
          enabled: filteredEnabledCount,
          total: filteredToggles.length,
        });

  return (
    <Page navId="feature-toggles">
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.feature-toggles.info-title', 'Runtime changes are temporary')}>
            <Trans i18nKey="admin.feature-toggles.info-body">
              Feature toggle changes made here take effect at runtime but do not persist across server restarts. For
              permanent changes, update the [feature_toggles] section in your Grafana configuration.
            </Trans>
          </Alert>

          {successMessage && <Alert severity="success" title={successMessage} onRemove={() => setSuccessMessage('')} />}
          {errorMessage && <Alert severity="error" title={errorMessage} onRemove={() => setErrorMessage('')} />}

          <div className={styles.toolbar}>
            <Field
              noMargin
              label={t('admin.feature-toggles.search-label', 'Search feature toggles')}
              htmlFor={searchId}
            >
              <FilterInput
                id={searchId}
                value={query}
                onChange={setQuery}
                placeholder={t('admin.feature-toggles.search-placeholder', 'Search by name or description')}
                escapeRegex={false}
              />
            </Field>
            <Field noMargin label={t('admin.feature-toggles.stage-filter-label', 'Stage')} htmlFor={stageFilterId}>
              <Select
                inputId={stageFilterId}
                options={STAGE_OPTIONS}
                value={stageFilter}
                onChange={(option) => setStageFilter(option.value ?? 'all')}
                width={24}
              />
            </Field>
            <div className={styles.counter} aria-live="polite">
              {counterText}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className="filter-table form-inline">
              <thead>
                <tr>
                  <th>{t('admin.feature-toggles.name-column', 'Name')}</th>
                  <th>{t('admin.feature-toggles.description-column', 'Description')}</th>
                  <th>{t('admin.feature-toggles.stage-column', 'Stage')}</th>
                  <th>{t('admin.feature-toggles.properties-column', 'Properties')}</th>
                  <th>{t('admin.feature-toggles.enabled-column', 'Enabled')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredToggles.map((toggle) => (
                  <tr key={toggle.name}>
                    <td>
                      <code>{toggle.name}</code>
                    </td>
                    <td>{toggle.description}</td>
                    <td>
                      <Badge text={getStageLabel(toggle.stage)} color={getStageColor(toggle.stage)} />
                    </td>
                    <td>
                      <FeatureToggleProperties toggle={toggle} />
                    </td>
                    <td>
                      <Switch
                        value={toggle.enabled}
                        disabled={toggle.readOnly || updating}
                        aria-label={t('admin.feature-toggles.toggle-aria-label', 'Toggle {{name}}', {
                          name: toggle.name,
                        })}
                        onChange={(event) => setPendingToggle({ toggle, enabled: event.currentTarget.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredToggles.length === 0 && (
            <p className={styles.empty}>
              <Trans i18nKey="admin.feature-toggles.no-results">No feature toggles match your filters.</Trans>
            </p>
          )}
        </Stack>

        {pendingToggle && (
          <ConfirmModal
            isOpen
            title={
              pendingToggle.enabled
                ? t('admin.feature-toggles.confirm-enable-title', 'Enable feature toggle')
                : t('admin.feature-toggles.confirm-disable-title', 'Disable feature toggle')
            }
            body={
              <div>
                <Trans i18nKey="admin.feature-toggles.confirm-body">
                  Are you sure you want to change the runtime state for
                </Trans>{' '}
                <code>{pendingToggle.toggle.name}</code>?
              </div>
            }
            confirmText={
              pendingToggle.enabled
                ? t('admin.feature-toggles.confirm-enable', 'Enable')
                : t('admin.feature-toggles.confirm-disable', 'Disable')
            }
            onDismiss={() => setPendingToggle(undefined)}
            onConfirm={() => {
              updateToggle(pendingToggle.toggle, pendingToggle.enabled);
              setPendingToggle(undefined);
            }}
          />
        )}
      </Page.Contents>
    </Page>
  );
}

function FeatureToggleProperties({ toggle }: { toggle: FeatureToggle }) {
  const badges: ReactNode[] = [];

  if (toggle.requiresRestart) {
    badges.push(
      <Badge key="restart" text={t('admin.feature-toggles.restart-required', 'Restart required')} color="red" />
    );
  }
  if (toggle.requiresDevMode) {
    badges.push(<Badge key="dev-mode" text={t('admin.feature-toggles.dev-only', 'Dev only')} color="orange" />);
  }
  if (toggle.frontendOnly) {
    badges.push(<Badge key="frontend" text={t('admin.feature-toggles.frontend-only', 'Frontend')} color="blue" />);
  }

  if (badges.length === 0) {
    return <span>{t('admin.feature-toggles.no-properties', 'None')}</span>;
  }

  return <span className={css({ display: 'flex', gap: 4, flexWrap: 'wrap' })}>{badges}</span>;
}

function getStageLabel(stage: FeatureToggleStage) {
  switch (stage) {
    case 'GA':
      return t('admin.feature-toggles.stage-ga', 'GA');
    case 'privatePreview':
      return t('admin.feature-toggles.stage-private-preview', 'Private preview');
    case 'preview':
      return t('admin.feature-toggles.stage-preview', 'Preview');
    case 'experimental':
      return t('admin.feature-toggles.stage-experimental', 'Experimental');
    case 'deprecated':
      return t('admin.feature-toggles.stage-deprecated', 'Deprecated');
    default:
      return t('admin.feature-toggles.stage-unknown', 'Unknown');
  }
}

function getStageColor(stage: FeatureToggleStage): BadgeColor {
  switch (stage) {
    case 'GA':
      return 'green';
    case 'privatePreview':
    case 'preview':
      return 'blue';
    case 'experimental':
      return 'orange';
    case 'deprecated':
      return 'red';
    default:
      return 'purple';
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return t('admin.feature-toggles.generic-error', 'Feature toggle operation failed');
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  }),
  counter: css({
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(1),
  }),
  tableWrapper: css({
    overflowX: 'auto',
  }),
  empty: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
});

export default FeatureTogglesPage;
