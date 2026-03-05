import { css } from '@emotion/css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv, config } from '@grafana/runtime';
import { Alert, Badge, Button, FilterInput, Spinner, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import {
  FeatureToggleOverrides,
  readFeatureToggleOverrides,
  writeFeatureToggleOverrides,
} from './labsFeatureToggleOverrides';

interface AdminFeatureToggleDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  defaultEnabled: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
}

function getEffectiveValue(toggle: AdminFeatureToggleDTO, overrides: FeatureToggleOverrides): boolean {
  if (Object.prototype.hasOwnProperty.call(overrides, toggle.name)) {
    return overrides[toggle.name];
  }

  return toggle.enabled;
}

function setRuntimeFeatureToggle(name: string, enabled: boolean) {
  Object.assign(config.featureToggles, { [name]: enabled });
}

export default function LabsFeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState<FeatureToggleOverrides>(() => readFeatureToggleOverrides());
  const hasInitializedOverrides = useRef(false);

  const {
    loading,
    error,
    value: toggles,
  } = useAsync(() => getBackendSrv().get<AdminFeatureToggleDTO[]>('/api/admin/feature-toggles'), []);

  useEffect(() => {
    if (!toggles) {
      return;
    }

    for (const toggle of toggles) {
      setRuntimeFeatureToggle(toggle.name, getEffectiveValue(toggle, overrides));
    }
  }, [toggles, overrides]);

  useEffect(() => {
    if (!hasInitializedOverrides.current) {
      hasInitializedOverrides.current = true;
      return;
    }

    writeFeatureToggleOverrides(overrides);
  }, [overrides]);

  const filteredToggles = useMemo(() => {
    if (!toggles) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) => {
      return (
        toggle.name.toLowerCase().includes(normalizedQuery) ||
        toggle.description.toLowerCase().includes(normalizedQuery) ||
        toggle.stage.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [toggles, query]);

  const onToggle = (toggle: AdminFeatureToggleDTO) => {
    setOverrides((current) => {
      const nextValue = !getEffectiveValue(toggle, current);
      const updated = { ...current };

      if (nextValue === toggle.enabled) {
        delete updated[toggle.name];
      } else {
        updated[toggle.name] = nextValue;
      }

      return updated;
    });
  };

  const onResetOverrides = () => {
    setOverrides({});
  };

  return (
    <Page navId="labs-feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.labs-feature-toggles.info.title', 'Labs feature flag controls')}>
            {t(
              'admin.labs-feature-toggles.info.description',
              'These controls set browser overrides in local storage (grafana.featureToggles) for this Grafana admin user. Server-side feature toggles still depend on your backend configuration.'
            )}
          </Alert>

          <div className={styles.controlsRow}>
            <FilterInput
              value={query}
              onChange={setQuery}
              placeholder={t(
                'admin.labs-feature-toggles.filter.placeholder',
                'Filter by toggle name, description, or stage'
              )}
              escapeRegex={false}
            />
            <Button
              variant="secondary"
              fill="outline"
              onClick={onResetOverrides}
              disabled={Object.keys(overrides).length === 0}
            >
              {t('admin.labs-feature-toggles.reset-overrides', 'Reset overrides')}
            </Button>
            <Button variant="secondary" fill="outline" onClick={() => window.location.reload()}>
              {t('admin.labs-feature-toggles.reload-page', 'Reload page')}
            </Button>
          </div>

          {loading && (
            <div className={styles.centered}>
              <Spinner />
            </div>
          )}

          {error && (
            <Alert
              severity="error"
              title={t('admin.labs-feature-toggles.error.load-failed', 'Failed to load feature toggles')}
            />
          )}

          {!loading && !error && (
            <div className={styles.list}>
              {filteredToggles.map((toggle) => {
                const isOverridden = Object.prototype.hasOwnProperty.call(overrides, toggle.name);
                const enabled = getEffectiveValue(toggle, overrides);
                return (
                  <div className={styles.row} key={toggle.name}>
                    <div className={styles.rowMain}>
                      <Switch value={enabled} onChange={() => onToggle(toggle)} />
                      <div>
                        <Text element="h3" variant="h6">
                          {toggle.name}
                        </Text>
                        <Text color="secondary">{toggle.description}</Text>
                      </div>
                    </div>
                    <div className={styles.badges}>
                      <Badge color="blue" text={toggle.stage} />
                      <Badge
                        color={toggle.defaultEnabled ? 'green' : 'darkgrey'}
                        text={
                          toggle.defaultEnabled
                            ? t('admin.labs-feature-toggles.badge.default-on', 'default on')
                            : t('admin.labs-feature-toggles.badge.default-off', 'default off')
                        }
                      />
                      {toggle.frontendOnly && (
                        <Badge
                          color="purple"
                          text={t('admin.labs-feature-toggles.badge.frontend-only', 'frontend only')}
                        />
                      )}
                      {toggle.requiresRestart && (
                        <Badge
                          color="orange"
                          text={t('admin.labs-feature-toggles.badge.requires-restart', 'requires restart')}
                        />
                      )}
                      {toggle.requiresDevMode && (
                        <Badge color="orange" text={t('admin.labs-feature-toggles.badge.dev-mode-only', 'dev mode only')} />
                      )}
                      {isOverridden && (
                        <Badge color="green" text={t('admin.labs-feature-toggles.badge.override', 'override')} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controlsRow: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) auto auto',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  centered: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  row: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5),
  }),
  rowMain: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    flex: 1,
  }),
  badges: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    minWidth: theme.spacing(22),
  }),
});
