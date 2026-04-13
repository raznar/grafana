import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, Select, Stack, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureToggle {
  name: string;
  description: string;
  enabled: boolean;
  stage: string;
  requiresDevMode?: boolean;
  requiresRestart?: boolean;
  frontendOnly?: boolean;
}

const stageColors: Record<string, 'blue' | 'orange' | 'green' | 'purple' | 'red'> = {
  experimental: 'purple',
  privatePreview: 'blue',
  preview: 'orange',
  GA: 'green',
  deprecated: 'red',
};

function getStageLabel(stage: string): string {
  switch (stage) {
    case 'experimental':
      return t('admin.labs.stage.experimental', 'Experimental');
    case 'privatePreview':
      return t('admin.labs.stage.private-preview', 'Private Preview');
    case 'preview':
      return t('admin.labs.stage.preview', 'Public Preview');
    case 'GA':
      return t('admin.labs.stage.ga', 'GA');
    case 'deprecated':
      return t('admin.labs.stage.deprecated', 'Deprecated');
    default:
      return stage;
  }
}

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const { loading, value: featureToggles, error } = useAsync(
    () => getBackendSrv().get<FeatureToggle[]>('/api/admin/feature-toggles'),
    []
  );

  const filteredToggles = useMemo(() => {
    if (!featureToggles) {
      return [];
    }

    return featureToggles.filter((toggle) => {
      const matchesSearch =
        searchQuery === '' ||
        toggle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        toggle.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'all' || toggle.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [featureToggles, searchQuery, stageFilter]);

  const stageOptions = useMemo(() => {
    if (!featureToggles) {
      return [{ label: t('admin.labs.filter.all-stages', 'All stages'), value: 'all' }];
    }

    const uniqueStages = [...new Set(featureToggles.map((tog) => tog.stage))].sort();
    return [
      { label: t('admin.labs.filter.all-stages', 'All stages'), value: 'all' },
      ...uniqueStages.map((stage) => ({ label: getStageLabel(stage), value: stage })),
    ];
  }, [featureToggles]);

  const enabledCount = useMemo(() => {
    return filteredToggles.filter((tog) => tog.enabled).length;
  }, [filteredToggles]);

  return (
    <Page navId="cfg/labs">
      <Page.Contents>
        <Alert severity="info" title="">
          <Trans i18nKey="admin.labs.info-description">
            Feature toggles control experimental and preview features in Grafana. These settings are read-only and are
            defined in your Grafana configuration file (grafana.ini or custom.ini). To change feature toggles, update
            your configuration and restart Grafana.
          </Trans>
        </Alert>

        <div className={styles.filterRow}>
          <Stack gap={2}>
            <FilterInput
              placeholder={t('admin.labs.search-placeholder', 'Search feature toggles...')}
              value={searchQuery}
              onChange={setSearchQuery}
              width={40}
            />
            <Select
              options={stageOptions}
              value={stageFilter}
              onChange={(v) => setStageFilter(v.value ?? 'all')}
              width={20}
            />
          </Stack>
          <div className={styles.stats}>
            {filteredToggles.length > 0 && (
              <Trans i18nKey="admin.labs.stats" values={{ enabled: enabledCount, total: filteredToggles.length }}>
                {'{{ enabled }} of {{ total }} enabled'}
              </Trans>
            )}
          </div>
        </div>

        {loading && <FeatureTogglesTableSkeleton />}
        {error && (
          <Alert severity="error" title={t('admin.labs.error-title', 'Failed to load feature toggles')} />
        )}
        {!loading && !error && filteredToggles.length === 0 && (
          <Alert severity="info" title={t('admin.labs.no-results-title', 'No feature toggles found')}>
            <Trans i18nKey="admin.labs.no-results">Try adjusting your search or filter criteria.</Trans>
          </Alert>
        )}

        {!loading && !error && filteredToggles.length > 0 && (
          <table className="filter-table">
            <thead>
              <tr>
                <th>
                  <Trans i18nKey="admin.labs.column.feature">Feature</Trans>
                </th>
                <th>
                  <Trans i18nKey="admin.labs.column.stage">Stage</Trans>
                </th>
                <th>
                  <Trans i18nKey="admin.labs.column.status">Status</Trans>
                </th>
                <th>
                  <Trans i18nKey="admin.labs.column.properties">Properties</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredToggles.map((toggle) => (
                <tr key={toggle.name}>
                  <td>
                    <div className={styles.featureName}>{toggle.name}</div>
                    <div className={styles.featureDescription}>{toggle.description}</div>
                  </td>
                  <td>
                    <Badge
                      text={getStageLabel(toggle.stage)}
                      color={stageColors[toggle.stage] || 'blue'}
                    />
                  </td>
                  <td>
                    <Badge
                      text={toggle.enabled ? t('admin.labs.status.enabled', 'Enabled') : t('admin.labs.status.disabled', 'Disabled')}
                      color={toggle.enabled ? 'green' : 'red'}
                    />
                  </td>
                  <td>
                    <Stack gap={1} wrap="wrap">
                      {toggle.requiresRestart && <Badge text={t('admin.labs.property.requires-restart', 'Requires restart')} color="orange" />}
                      {toggle.requiresDevMode && <Badge text={t('admin.labs.property.dev-mode-only', 'Dev mode only')} color="purple" />}
                      {toggle.frontendOnly && <Badge text={t('admin.labs.property.frontend-only', 'Frontend only')} color="blue" />}
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Page.Contents>
    </Page>
  );
}

function FeatureTogglesTableSkeleton() {
  return (
    <table className="filter-table">
      <thead>
        <tr>
          <th>
            <Trans i18nKey="admin.labs.column.feature">Feature</Trans>
          </th>
          <th>
            <Trans i18nKey="admin.labs.column.stage">Stage</Trans>
          </th>
          <th>
            <Trans i18nKey="admin.labs.column.status">Status</Trans>
          </th>
          <th>
            <Trans i18nKey="admin.labs.column.properties">Properties</Trans>
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
          <tr key={i}>
            <td>
              <div className="skeleton" style={{ width: '200px', height: '16px', marginBottom: '4px' }} />
              <div className="skeleton" style={{ width: '300px', height: '14px' }} />
            </td>
            <td>
              <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </td>
            <td>
              <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            </td>
            <td>
              <div className="skeleton" style={{ width: '100px', height: '20px' }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  filterRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  }),
  stats: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  featureName: css({
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
  }),
  featureDescription: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.5),
  }),
});

export default LabsPage;
