import { css } from '@emotion/css';
import { useCallback, useId, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { isFetchError } from '@grafana/runtime';
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
import { getFeatureToggles, updateFeatureToggles } from 'app/features/admin/api';

function getStageOptions() {
  return [
    { label: t('admin.feature-toggles.stage-option-all', 'All stages'), value: '' },
    { label: t('admin.feature-toggles.stage-option-experimental', 'Experimental'), value: 'experimental' },
    { label: t('admin.feature-toggles.stage-option-private-preview', 'Private Preview'), value: 'privatePreview' },
    { label: t('admin.feature-toggles.stage-option-preview', 'Preview'), value: 'preview' },
    { label: t('admin.feature-toggles.stage-option-ga', 'GA'), value: 'GA' },
    { label: t('admin.feature-toggles.stage-option-deprecated', 'Deprecated'), value: 'deprecated' },
    { label: t('admin.feature-toggles.stage-option-unknown', 'Unknown'), value: 'unknown' },
  ];
}

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
  const switchIdPrefix = useId();
  const stageOptions = useMemo(() => getStageOptions(), []);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [pendingToggle, setPendingToggle] = useState<{ name: string; enabled: boolean } | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  const { loading, value: toggles, error } = useAsync(getFeatureToggles, []);

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
      await updateFeatureToggles({
        toggles: [{ name: pendingToggle.name, enabled: pendingToggle.enabled }],
      });
      setLocalToggles((prev) => ({ ...prev, [pendingToggle.name]: pendingToggle.enabled }));
      setAlertMessage({
        severity: 'success',
        text: pendingToggle.enabled
          ? t('admin.feature-toggles.alert-success-enabled', 'Feature toggle "{{name}}" enabled successfully.', {
              name: pendingToggle.name,
            })
          : t('admin.feature-toggles.alert-success-disabled', 'Feature toggle "{{name}}" disabled successfully.', {
              name: pendingToggle.name,
            }),
      });
    } catch (err) {
      const detail = isFetchError(err)
        ? err.data?.message
        : err instanceof Error
          ? err.message
          : t('admin.feature-toggles.error-unknown', 'Unknown error');
      setAlertMessage({
        severity: 'error',
        text: t('admin.feature-toggles.alert-update-failed', 'Failed to update "{{name}}": {{detail}}', {
          name: pendingToggle.name,
          detail: detail ?? t('admin.feature-toggles.error-unknown', 'Unknown error'),
        }),
      });
    } finally {
      setPendingToggle(null);
    }
  }, [pendingToggle]);

  return (
    <Page navId="feature-toggles">
      <Page.Contents>
        <Alert severity="info" title={t('admin.feature-toggles.about-title', 'About feature toggles')}>
          <Trans i18nKey="admin.feature-toggles.about-body">
            Changes made here take effect immediately but do not persist across server restarts. To make permanent
            changes, update the <code>[feature_toggles]</code> section in your Grafana configuration file.
          </Trans>
        </Alert>

        {alertMessage && (
          <Alert
            severity={alertMessage.severity}
            title={t('admin.feature-toggles.alert-status-title', 'Update status')}
            onRemove={() => setAlertMessage(null)}
          >
            {alertMessage.text}
          </Alert>
        )}

        {error && (
          <Alert severity="error" title={t('admin.feature-toggles.load-error-title', 'Failed to load feature toggles')}>
            {error.message}
          </Alert>
        )}

        {loading && <LoadingPlaceholder text={t('admin.feature-toggles.loading', 'Loading feature toggles...')} />}

        {toggles && (
          <>
            <div className={styles.controls}>
              <FilterInput
                placeholder={t('admin.feature-toggles.search-placeholder', 'Search by name or description...')}
                aria-label={t('admin.feature-toggles.search-aria-label', 'Search feature toggles')}
                value={search}
                onChange={setSearch}
                className={styles.searchInput}
              />
              <Select
                options={stageOptions}
                value={stageFilter}
                onChange={(v) => setStageFilter(v.value ?? '')}
                className={styles.stageSelect}
                prefix={t('admin.feature-toggles.stage-prefix', 'Stage')}
                aria-label={t('admin.feature-toggles.stage-filter-aria-label', 'Filter by stage')}
              />
              <span className={styles.counter} aria-live="polite">
                {search || stageFilter
                  ? t(
                      'admin.feature-toggles.enabled-count-filtered',
                      '{{enabledCount}} / {{totalFiltered}} filtered enabled',
                      {
                        enabledCount,
                        totalFiltered,
                      }
                    )
                  : t('admin.feature-toggles.enabled-count-all', '{{enabledCount}} / {{totalAll}} enabled', {
                      enabledCount,
                      totalAll,
                    })}
              </span>
            </div>

            <table className={styles.table} aria-label={t('admin.feature-toggles.table-aria-label', 'Feature toggles')}>
              <thead>
                <tr>
                  <th scope="col">{t('admin.feature-toggles.column-name', 'Name')}</th>
                  <th scope="col">{t('admin.feature-toggles.column-description', 'Description')}</th>
                  <th scope="col">{t('admin.feature-toggles.column-stage', 'Stage')}</th>
                  <th scope="col">{t('admin.feature-toggles.column-properties', 'Properties')}</th>
                  <th scope="col">{t('admin.feature-toggles.column-enabled', 'Enabled')}</th>
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
                        {toggle.requiresRestart && (
                          <Badge
                            text={t('admin.feature-toggles.badge-restart-required', 'Restart required')}
                            color="red"
                            icon="exclamation-triangle"
                          />
                        )}
                        {toggle.requiresDevMode && (
                          <Badge text={t('admin.feature-toggles.badge-dev-only', 'Dev only')} color="orange" />
                        )}
                        {toggle.frontendOnly && (
                          <Badge text={t('admin.feature-toggles.badge-frontend', 'Frontend')} color="blue" />
                        )}
                      </div>
                    </td>
                    <td>
                      <InlineSwitch
                        id={`${switchIdPrefix}-feature-toggle-switch-${toggle.name}`}
                        value={toggle.enabled}
                        disabled={toggle.readOnly}
                        onChange={() => setPendingToggle({ name: toggle.name, enabled: !toggle.enabled })}
                        showLabel={true}
                        label={
                          toggle.readOnly
                            ? t('admin.feature-toggles.switch-label-read-only', 'Read only')
                            : toggle.enabled
                              ? t('admin.feature-toggles.switch-label-on', 'On')
                              : t('admin.feature-toggles.switch-label-off', 'Off')
                        }
                        transparent={true}
                        aria-label={
                          toggle.readOnly
                            ? t('admin.feature-toggles.switch-aria-read-only', 'Toggle {{name}}, read only', {
                                name: toggle.name,
                              })
                            : toggle.enabled
                              ? t('admin.feature-toggles.switch-aria-enabled', 'Toggle {{name}}, currently enabled', {
                                  name: toggle.name,
                                })
                              : t('admin.feature-toggles.switch-aria-disabled', 'Toggle {{name}}, currently disabled', {
                                  name: toggle.name,
                                })
                        }
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      {t('admin.feature-toggles.empty-filters', 'No feature toggles match the current filters.')}
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
            title={t('admin.feature-toggles.confirm-title', 'Confirm feature toggle change')}
            body={
              <p>
                {pendingToggle.enabled ? (
                  <Trans
                    i18nKey="admin.feature-toggles.confirm-body-enable"
                    values={{ toggleName: pendingToggle.name }}
                  >
                    Are you sure you want to <strong>enable</strong> <code>{'{{toggleName}}'}</code>? This change takes
                    effect immediately.
                  </Trans>
                ) : (
                  <Trans
                    i18nKey="admin.feature-toggles.confirm-body-disable"
                    values={{ toggleName: pendingToggle.name }}
                  >
                    Are you sure you want to <strong>disable</strong> <code>{'{{toggleName}}'}</code>? This change takes
                    effect immediately.
                  </Trans>
                )}
              </p>
            }
            confirmText={
              pendingToggle.enabled
                ? t('admin.feature-toggles.confirm-button-enable', 'Enable')
                : t('admin.feature-toggles.confirm-button-disable', 'Disable')
            }
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
