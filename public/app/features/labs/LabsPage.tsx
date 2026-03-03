import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, InlineSwitch, Spinner, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

interface FeatureToggleDTO {
  name: string;
  description: string;
  enabled: boolean;
  stage: string;
  frontendOnly?: boolean;
}

type StageFilter = 'all' | 'experimental' | 'preview' | 'generalAvailability' | 'deprecated';

const stageLabels: Record<string, string> = {
  experimental: 'Experimental',
  preview: 'Preview',
  generalAvailability: 'GA',
  deprecated: 'Deprecated',
};

const stageBadgeColor: Record<string, 'orange' | 'blue' | 'green' | 'red'> = {
  experimental: 'orange',
  preview: 'blue',
  generalAvailability: 'green',
  deprecated: 'red',
};

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const { loading, value: toggles } = useAsync(
    () => getBackendSrv().get<FeatureToggleDTO[]>('/api/admin/feature-toggles'),
    []
  );

  const filteredToggles = useMemo(() => {
    if (!toggles) {
      return [];
    }
    return toggles.filter((toggle) => {
      if (stageFilter !== 'all' && toggle.stage !== stageFilter) {
        return false;
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        return (
          toggle.name.toLowerCase().includes(lowerSearch) ||
          toggle.description.toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    });
  }, [toggles, search, stageFilter]);

  const handleToggle = (name: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setOverrides((prev) => ({ ...prev, [name]: newEnabled }));

    const featureToggles = config.featureToggles as Record<string, boolean>;
    if (newEnabled) {
      featureToggles[name] = true;
    } else {
      delete featureToggles[name];
    }
  };

  const isEnabled = (toggle: FeatureToggleDTO) => {
    if (toggle.name in overrides) {
      return overrides[toggle.name];
    }
    return toggle.enabled;
  };

  const enabledCount = toggles?.filter((t) => isEnabled(t)).length ?? 0;
  const totalCount = toggles?.length ?? 0;

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="">
          Feature flags control experimental and in-development functionality. Toggling a flag here applies the change
          to your current browser session only. Reload the page to reset changes. Backend-only flags require a server
          restart to take effect.
        </Alert>

        <div className={styles.statsRow}>
          <span className={styles.statsText}>
            {enabledCount} of {totalCount} feature flags enabled
          </span>
        </div>

        <div className={styles.controls}>
          <FilterInput placeholder="Search feature flags..." value={search} onChange={setSearch} />
          <div className={styles.stageFilters}>
            {(['all', 'experimental', 'preview', 'generalAvailability', 'deprecated'] as StageFilter[]).map((stage) => (
              <button
                key={stage}
                className={stageFilter === stage ? styles.stageButtonActive : styles.stageButton}
                onClick={() => setStageFilter(stage)}
              >
                {stage === 'all' ? 'All' : stageLabels[stage] || stage}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className={styles.loading}>
            <Spinner size="xl" />
          </div>
        )}

        {filteredToggles.length > 0 && (
          <div className={styles.list}>
            {filteredToggles.map((toggle) => {
              const enabled = isEnabled(toggle);
              const hasOverride = toggle.name in overrides;

              return (
                <div key={toggle.name} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{toggle.name}</span>
                      <div className={styles.badges}>
                        <Badge
                          text={stageLabels[toggle.stage] || toggle.stage}
                          color={stageBadgeColor[toggle.stage] || 'blue'}
                        />
                        {toggle.frontendOnly && <Badge text="Frontend" color="purple" />}
                        {hasOverride && <Badge text="Modified" color="orange" />}
                      </div>
                    </div>
                    <InlineSwitch
                      value={enabled}
                      onChange={() => handleToggle(toggle.name, enabled)}
                      showLabel={true}
                      label={enabled ? 'On' : 'Off'}
                    />
                  </div>
                  {toggle.description && <p className={styles.description}>{toggle.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredToggles.length === 0 && (
          <div className={styles.empty}>No feature flags match your search criteria.</div>
        )}
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    statsRow: css({
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(2),
    }),
    statsText: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    controls: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(3),
    }),
    stageFilters: css({
      display: 'flex',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
    }),
    stageButton: css({
      padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
      borderRadius: theme.shape.radius.pill,
      border: `1px solid ${theme.colors.border.medium}`,
      background: 'transparent',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      '&:hover': {
        background: theme.colors.action.hover,
      },
    }),
    stageButtonActive: css({
      padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
      borderRadius: theme.shape.radius.pill,
      border: `1px solid ${theme.colors.primary.border}`,
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    loading: css({
      display: 'flex',
      justifyContent: 'center',
      padding: theme.spacing(4),
    }),
    list: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    card: css({
      padding: theme.spacing(2),
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    cardHeader: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
    cardTitleRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
      minWidth: 0,
    }),
    cardTitle: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
    }),
    badges: css({
      display: 'flex',
      gap: theme.spacing(0.5),
    }),
    description: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      marginTop: theme.spacing(1),
      marginBottom: 0,
    }),
    empty: css({
      textAlign: 'center',
      padding: theme.spacing(4),
      color: theme.colors.text.secondary,
    }),
  };
}

export default LabsPage;
