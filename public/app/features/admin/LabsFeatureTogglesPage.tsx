import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { store } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, Button, Input, Spinner, Stack, Switch, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import {
  FEATURE_TOGGLES_LOCAL_STORAGE_KEY,
  parseFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
} from './featureTogglesOverrides';
import { AdminFeatureToggle, getAdminFeatureToggles } from './state/apis';

const EMPTY_FLAGS: AdminFeatureToggle[] = [];

function getStoredOverrides(): Record<string, boolean> {
  const value = store.get(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
  return parseFeatureToggleOverrides(typeof value === 'string' ? value : null);
}

function saveOverrides(overrides: Record<string, boolean>) {
  const serialized = serializeFeatureToggleOverrides(overrides);
  if (serialized.length === 0) {
    store.delete(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
    return;
  }

  store.set(FEATURE_TOGGLES_LOCAL_STORAGE_KEY, serialized);
}

function setRuntimeFeatureToggle(name: string, value: boolean) {
  Object.assign(config.featureToggles, { [name]: value });
}

function setRuntimeFeatureTogglesFromSource(flags: AdminFeatureToggle[], overrides: Record<string, boolean>) {
  for (const flag of flags) {
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, flag.name);
    setRuntimeFeatureToggle(flag.name, hasOverride ? overrides[flag.name] : flag.enabled);
  }
}

function LabsFeatureTogglesPage() {
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() => getStoredOverrides());
  const { loading, error, value } = useAsync(getAdminFeatureToggles, []);

  const flags = value?.items ?? EMPTY_FLAGS;

  const visibleFlags = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return flags.filter((flag) => {
      if (!lowerSearch) {
        return true;
      }

      return (
        flag.name.toLowerCase().includes(lowerSearch) ||
        flag.description.toLowerCase().includes(lowerSearch) ||
        flag.stage.toLowerCase().includes(lowerSearch)
      );
    });
  }, [flags, search]);

  const handleToggle = (flag: AdminFeatureToggle, checked: boolean) => {
    setRuntimeFeatureToggle(flag.name, checked);

    const nextOverrides = { ...overrides };
    if (checked === flag.enabled) {
      delete nextOverrides[flag.name];
    } else {
      nextOverrides[flag.name] = checked;
    }

    saveOverrides(nextOverrides);
    setOverrides(nextOverrides);
  };

  const clearOverrides = () => {
    setRuntimeFeatureTogglesFromSource(flags, {});
    store.delete(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
    setOverrides({});
  };

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="">
          <Trans i18nKey="admin.labs.info">
            Labs feature flag toggles are browser overrides for this admin user. Use reload after changing values to
            ensure the entire UI re-evaluates feature-gated code paths.
          </Trans>
        </Alert>

        <Stack direction="row" justifyContent="space-between" wrap>
          <Input
            width={40}
            prefix={t('admin.labs.search-prefix', 'Search')}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder={t('admin.labs.search-placeholder', 'Filter by name, description, or stage')}
          />
          <Stack direction="row">
            <Button variant="secondary" onClick={clearOverrides} disabled={Object.keys(overrides).length === 0}>
              <Trans i18nKey="admin.labs.clear-browser-overrides">Clear browser overrides</Trans>
            </Button>
            <Button onClick={() => window.location.reload()}>
              <Trans i18nKey="admin.labs.reload-grafana">Reload Grafana</Trans>
            </Button>
          </Stack>
        </Stack>

        {loading && <Spinner />}
        {error && (
          <Alert severity="error" title="">
            <Trans i18nKey="admin.labs.load-error">Failed to load feature toggles.</Trans>
          </Alert>
        )}

        {!loading && !error && (
          <table className="filter-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{t('admin.labs.table.feature-flag', 'Feature flag')}</th>
                <th>{t('admin.labs.table.stage', 'Stage')}</th>
                <th>{t('admin.labs.table.details', 'Details')}</th>
                <th>{t('admin.labs.table.source', 'Source')}</th>
                <th>{t('admin.labs.table.enabled', 'Enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleFlags.map((flag) => {
                const hasOverride = Object.prototype.hasOwnProperty.call(overrides, flag.name);
                const effectiveValue = hasOverride ? overrides[flag.name] : flag.enabled;

                return (
                  <tr key={flag.name}>
                    <td style={{ minWidth: 280 }}>
                      <Text weight="bold">{flag.name}</Text>
                      <Text color="secondary">
                        {flag.description || t('admin.labs.no-description', 'No description available.')}
                      </Text>
                    </td>
                    <td>{flag.stage}</td>
                    <td>
                      {flag.frontendOnly
                        ? t('admin.labs.details.frontend-only', 'Frontend only')
                        : t('admin.labs.details.backend-and-frontend', 'Backend + frontend')}
                      {flag.requiresRestart ? t('admin.labs.details.requires-restart', ' • restart required for server-side changes') : ''}
                    </td>
                    <td>
                      {hasOverride
                        ? t('admin.labs.source.browser-override', 'Browser override')
                        : t('admin.labs.source.server-default', 'Server default')}
                    </td>
                    <td>
                      <Switch value={effectiveValue} onChange={(event) => handleToggle(flag, event.currentTarget.checked)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Page.Contents>
    </Page>
  );
}

export default LabsFeatureTogglesPage;
