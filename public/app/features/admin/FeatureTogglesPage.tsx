import { css } from '@emotion/css';
import { useCallback, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  BadgeColor,
  ConfirmModal,
  FilterInput,
  InlineSwitch,
  LoadingPlaceholder,
  Select,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureToggle {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  readOnly: boolean;
  requiresDevMode: boolean;
  requiresRestart: boolean;
  frontendOnly: boolean;
}

const stageOptions = [
  { label: 'All stages', value: '' },
  { label: 'Experimental', value: 'experimental' },
  { label: 'Private Preview', value: 'privatePreview' },
  { label: 'Preview', value: 'preview' },
  { label: 'GA', value: 'GA' },
  { label: 'Deprecated', value: 'deprecated' },
  { label: 'Unknown', value: 'unknown' },
];

function stageBadgeColor(stage: string): BadgeColor {
  switch (stage) {
    case 'GA':
      return 'green';
    case 'preview':
    case 'privatePreview':
      return 'blue';
    case 'experimental':
      return 'orange';
    case 'deprecated':
      return 'red';
    default:
      return 'purple';
  }
}

function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [pendingToggle, setPendingToggle] = useState<{ name: string; enabled: boolean } | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  const {
    loading,
    value: toggles,
    error,
  } = useAsync(() => getBackendSrv().get<FeatureToggle[]>('/api/admin/feature-toggles'), []);

  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  const effectiveToggles = useMemo(() => {
    if (!toggles) {
      return [];
    }
    return toggles.map((t) => ({
      ...t,
      enabled: localToggles[t.name] !== undefined ? localToggles[t.name] : t.enabled,
    }));
  }, [toggles, localToggles]);

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return effectiveToggles.filter((t) => {
      if (stageFilter && t.stage !== stageFilter) {
        return false;
      }
      if (search && !t.name.toLowerCase().includes(lowerSearch) && !t.description.toLowerCase().includes(lowerSearch)) {
        return false;
      }
      return true;
    });
  }, [effectiveToggles, search, stageFilter]);

  const enabledCount = useMemo(() => filtered.filter((t) => t.enabled).length, [filtered]);
  const totalFiltered = filtered.length;
  const totalAll = effectiveToggles.length;

  const handleToggle = useCallback(async () => {
    if (!pendingToggle) {
      return;
    }
    try {
      await getBackendSrv().put('/api/admin/feature-toggles', {
        toggles: [{ name: pendingToggle.name, enabled: pendingToggle.enabled }],
      });
      setLocalToggles((prev) => ({ ...prev, [pendingToggle.name]: pendingToggle.enabled }));
      setAlertMessage({
        severity: 'success',
        text: `Feature toggle "${pendingToggle.name}" ${pendingToggle.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (err) {
      setAlertMessage({
        severity: 'error',
        text: `Failed to update "${pendingToggle.name}": ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setPendingToggle(null);
    }
  }, [pendingToggle]);

  return (
    <Page navId="feature-toggles">
      <Page.Contents>
        <Alert severity="info" title="Runtime changes">
          Changes made here take effect immediately but do not persist across server restarts. To make permanent changes,
          update the <code>[feature_toggles]</code> section in your Grafana configuration file.
        </Alert>

        {alertMessage && (
          <Alert severity={alertMessage.severity} title="" onRemove={() => setAlertMessage(null)}>
            {alertMessage.text}
          </Alert>
        )}

        {error && (
          <Alert severity="error" title="Failed to load feature toggles">
            {error.message}
          </Alert>
        )}

        {loading && <LoadingPlaceholder text="Loading feature toggles..." />}

        {toggles && (
          <>
            <div className={styles.controls}>
              <FilterInput
                placeholder="Search by name or description..."
                value={search}
                onChange={setSearch}
                className={styles.searchInput}
              />
              <Select
                options={stageOptions}
                value={stageFilter}
                onChange={(v) => setStageFilter(v.value ?? '')}
                className={styles.stageSelect}
                prefix="Stage"
              />
              <span className={styles.counter}>
                {enabledCount} / {search || stageFilter ? `${totalFiltered} filtered` : totalAll} enabled
              </span>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Properties</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((toggle) => (
                  <tr key={toggle.name}>
                    <td>
                      <code>{toggle.name}</code>
                    </td>
                    <td className={styles.descriptionCell}>{toggle.description}</td>
                    <td>
                      <Badge text={toggle.stage} color={stageBadgeColor(toggle.stage)} />
                    </td>
                    <td>
                      <div className={styles.badges}>
                        {toggle.requiresRestart && <Badge text="Restart required" color="red" icon="exclamation-triangle" />}
                        {toggle.requiresDevMode && <Badge text="Dev only" color="orange" />}
                        {toggle.frontendOnly && <Badge text="Frontend" color="blue" />}
                      </div>
                    </td>
                    <td>
                      <InlineSwitch
                        value={toggle.enabled}
                        disabled={toggle.readOnly}
                        onChange={() =>
                          setPendingToggle({ name: toggle.name, enabled: !toggle.enabled })
                        }
                        showLabel={true}
                        label={toggle.readOnly ? 'Read only' : toggle.enabled ? 'On' : 'Off'}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      No feature toggles match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {pendingToggle && (
          <ConfirmModal
            isOpen={true}
            title="Confirm feature toggle change"
            body={
              <p>
                Are you sure you want to <strong>{pendingToggle.enabled ? 'enable' : 'disable'}</strong>{' '}
                <code>{pendingToggle.name}</code>? This change takes effect immediately.
              </p>
            }
            confirmText={pendingToggle.enabled ? 'Enable' : 'Disable'}
            onConfirm={handleToggle}
            onDismiss={() => setPendingToggle(null)}
          />
        )}
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
      flexWrap: 'wrap',
    }),
    searchInput: css({
      flexGrow: 1,
      minWidth: 200,
    }),
    stageSelect: css({
      minWidth: 180,
    }),
    counter: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      whiteSpace: 'nowrap',
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      'th, td': {
        padding: theme.spacing(1, 1.5),
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        textAlign: 'left',
        verticalAlign: 'top',
      },
      th: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.bodySmall.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
        whiteSpace: 'nowrap',
      },
    }),
    descriptionCell: css({
      maxWidth: 400,
      color: theme.colors.text.secondary,
    }),
    badges: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
    }),
    emptyRow: css({
      textAlign: 'center',
      padding: theme.spacing(4),
      color: theme.colors.text.secondary,
    }),
  };
}

export default FeatureTogglesPage;
