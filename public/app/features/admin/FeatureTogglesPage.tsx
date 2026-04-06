import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
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
  Spinner,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureToggleDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  readOnly: boolean;
  requiresDevMode?: boolean;
  requiresRestart?: boolean;
  frontendOnly?: boolean;
}

function stageBadgeColor(stage: string): BadgeColor {
  switch (stage) {
    case 'GA':
      return 'green';
    case 'preview':
      return 'blue';
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

function stageLabel(stage: string): string {
  switch (stage) {
    case 'GA':
      return 'GA';
    case 'preview':
      return 'Preview';
    case 'privatePreview':
      return 'Private Preview';
    case 'experimental':
      return 'Experimental';
    case 'deprecated':
      return 'Deprecated';
    default:
      return stage || 'Unknown';
  }
}

function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [pendingToggle, setPendingToggle] = useState<FeatureToggleDTO | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  const { loading, error: loadError, value: toggles } = useAsync(async () => {
    const result = await getBackendSrv().get<FeatureToggleDTO[]>('/api/admin/feature-toggles');
    const states: Record<string, boolean> = {};
    for (const t of result) {
      states[t.name] = t.enabled;
    }
    setToggleStates(states);
    return result;
  }, []);

  const stages = useMemo(() => {
    if (!toggles) {
      return [];
    }
    const s = new Set<string>();
    for (const t of toggles) {
      s.add(t.stage);
    }
    return Array.from(s).sort();
  }, [toggles]);

  const filteredToggles = useMemo(() => {
    if (!toggles) {
      return [];
    }
    return toggles.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = stageFilter === 'all' || t.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [toggles, searchQuery, stageFilter]);

  const handleToggle = async (toggle: FeatureToggleDTO) => {
    const newEnabled = !toggleStates[toggle.name];
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      await getBackendSrv().put('/api/admin/feature-toggles', {
        toggles: [{ name: toggle.name, enabled: newEnabled }],
      });
      setToggleStates((prev) => ({ ...prev, [toggle.name]: newEnabled }));
      setUpdateSuccess(`Feature toggle "${toggle.name}" ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (e: unknown) {
      setUpdateError(`Failed to update "${toggle.name}": ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setPendingToggle(null);
  };

  const enabledCount = toggles ? toggles.filter((t) => toggleStates[t.name]).length : 0;
  const totalCount = toggles ? toggles.length : 0;

  return (
    <Page navId="feature-toggles">
      <Page.Contents>
        <Alert severity="info" title="">
          Feature toggles control experimental and in-development features. Changes take effect immediately but don&apos;t
          persist across server restarts. To make changes permanent, update the <code>[feature_toggles]</code> section
          in your Grafana configuration.
        </Alert>

        {updateError && (
          <Alert severity="error" title="Update failed" onRemove={() => setUpdateError(null)}>
            {updateError}
          </Alert>
        )}

        {updateSuccess && (
          <Alert severity="success" title="" onRemove={() => setUpdateSuccess(null)}>
            {updateSuccess}
          </Alert>
        )}

        <div className={styles.header}>
          <Stack gap={2} alignItems="center">
            <FilterInput
              placeholder="Search feature toggles..."
              value={searchQuery}
              onChange={setSearchQuery}
              width={40}
            />
            <select
              className={styles.stageSelect}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="all">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>
            {toggles != null && (
              <span className={styles.countLabel}>
                {enabledCount} / {totalCount} enabled
                {filteredToggles.length < totalCount && ` (showing ${filteredToggles.length})`}
              </span>
            )}
          </Stack>
        </div>

        {loading && <Spinner />}

        {!loading && loadError && (
          <Alert severity="error" title="Failed to load feature toggles">
            {loadError instanceof Error ? loadError.message : String(loadError)}
          </Alert>
        )}

        {!loading && !loadError && filteredToggles.length === 0 && (
          <div className={styles.emptyState}>No feature toggles match your search.</div>
        )}

        {!loading && !loadError && filteredToggles.length > 0 && (
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
              {filteredToggles.map((toggle) => (
                <tr key={toggle.name} className={styles.row}>
                  <td className={styles.nameCell}>
                    <code>{toggle.name}</code>
                  </td>
                  <td className={styles.descCell}>{toggle.description || '—'}</td>
                  <td>
                    <Badge text={stageLabel(toggle.stage)} color={stageBadgeColor(toggle.stage)} />
                  </td>
                  <td>
                    <Stack gap={0.5} wrap="wrap">
                      {toggle.requiresRestart && <Badge text="Restart required" color="orange" icon="exclamation-triangle" />}
                      {toggle.requiresDevMode && <Badge text="Dev only" color="purple" />}
                      {toggle.frontendOnly && <Badge text="Frontend" color="blue" />}
                    </Stack>
                  </td>
                  <td>
                    <InlineSwitch
                      value={toggleStates[toggle.name] ?? toggle.enabled}
                      disabled={toggle.readOnly}
                      onChange={() => setPendingToggle(toggle)}
                      showLabel={true}
                      label={toggleStates[toggle.name] ? 'On' : 'Off'}
                      transparent={true}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ConfirmModal
          isOpen={!!pendingToggle}
          title="Confirm feature toggle change"
          body={
            pendingToggle
              ? `Are you sure you want to ${toggleStates[pendingToggle.name] ? 'disable' : 'enable'} "${pendingToggle.name}"? This change takes effect immediately but won't persist across restarts.`
              : ''
          }
          confirmText={pendingToggle ? (toggleStates[pendingToggle.name] ? 'Disable' : 'Enable') : 'Confirm'}
          onConfirm={() => {
            if (pendingToggle) {
              handleToggle(pendingToggle);
            }
          }}
          onDismiss={() => setPendingToggle(null)}
        />
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    header: css({
      marginBottom: theme.spacing(2),
    }),
    stageSelect: css({
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.medium}`,
      background: theme.colors.background.primary,
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    countLabel: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    emptyState: css({
      padding: theme.spacing(4),
      textAlign: 'center',
      color: theme.colors.text.secondary,
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      '& th': {
        textAlign: 'left',
        padding: theme.spacing(1, 2),
        borderBottom: `2px solid ${theme.colors.border.medium}`,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.bodySmall.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
        whiteSpace: 'nowrap',
      },
      '& td': {
        padding: theme.spacing(1, 2),
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        verticalAlign: 'middle',
      },
    }),
    row: css({
      '&:hover': {
        background: theme.colors.background.secondary,
      },
    }),
    nameCell: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      whiteSpace: 'nowrap',
    }),
    descCell: css({
      color: theme.colors.text.secondary,
      maxWidth: '400px',
    }),
  };
}

export default FeatureTogglesPage;
