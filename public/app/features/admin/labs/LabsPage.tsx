import { css } from '@emotion/css';
import { ChangeEvent, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import {
  Alert,
  Badge,
  FilterInput,
  InlineSwitch,
  LinkButton,
  LoadingPlaceholder,
  Spinner,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getLabsFeatureToggles, LabsFeatureToggleState, updateLabsFeatureToggle } from './api';

type PendingState = Record<string, boolean>;

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [filter, setFilter] = useState('');
  const [pending, setPending] = useState<PendingState>({});
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string>();

  const {
    loading,
    value,
    error: loadError,
  } = useAsync(async () => {
    setError(undefined);
    return getLabsFeatureToggles();
  }, [reloadToken]);

  const filteredToggles = useMemo(() => {
    const toggles = value?.toggles ?? [];
    const query = filter.trim().toLowerCase();

    if (!query) {
      return toggles;
    }

    return toggles.filter((toggle) => {
      const haystack = [toggle.name, toggle.description, toggle.stage, toggle.warning, toggle.source?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, value?.toggles]);

  const onToggle = async (toggle: LabsFeatureToggleState) => {
    const nextValue = !toggle.enabled;
    setPending((current) => ({ ...current, [toggle.name]: nextValue }));
    setError(undefined);

    try {
      await updateLabsFeatureToggle(toggle.name, nextValue);
      setReloadToken((current) => current + 1);
    } catch (err) {
      const fallback = t('admin.labs.update-error', 'Failed to update feature flag');
      if (hasErrorMessage(err)) {
        setError(err.data?.message ?? fallback);
      } else {
        setError(fallback);
      }
    } finally {
      setPending((current) => {
        const next = { ...current };
        delete next[toggle.name];
        return next;
      });
    }
  };

  return (
    <Page
      navId="labs"
      subTitle={t(
        'admin.labs.page-subtitle',
        'Manage feature flags that are available in this Grafana instance.'
      )}
    >
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.labs.server-admin-title', 'Server admin only')}>
            <Trans i18nKey="admin.labs.server-admin-description">
              Changes in Labs update feature flags for this Grafana instance. Flags marked as restart required keep the
              new value, but some behavior won&apos;t change until you restart Grafana.
            </Trans>
          </Alert>

          {value?.restartRequired && (
            <Alert severity="warning" title={t('admin.labs.restart-title', 'Restart required')}>
              <Trans i18nKey="admin.labs.restart-description">
                One or more Labs overrides affect startup-only behavior. Restart Grafana to apply those changes fully.
              </Trans>
            </Alert>
          )}

          {error && <Alert severity="error" title={error} />}
          {loadError && (
            <Alert severity="error" title={t('admin.labs.load-error', 'Failed to load Labs feature flags')} />
          )}

          <div className={styles.toolbar}>
            <FilterInput
              className={styles.filter}
              placeholder={t('admin.labs.filter-placeholder', 'Filter feature flags')}
              value={filter}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFilter(event.currentTarget.value)}
            />
            <LinkButton href="/admin/settings" variant="secondary" icon="sliders-v-alt">
              <Trans i18nKey="admin.labs.server-settings-link">Server settings</Trans>
            </LinkButton>
          </div>

          {loading && <LoadingPlaceholder text={t('admin.labs.loading', 'Loading feature flags...')} />}

          {!loading && value && (
            <Text color="secondary">
              <Trans
                i18nKey="admin.labs.count"
                values={{ filteredCount: filteredToggles.length, totalCount: value.toggles.length }}
              >
                {{ filteredCount: filteredToggles.length }} of {{ totalCount: value.toggles.length }} feature flags
              </Trans>
            </Text>
          )}

          <div className={styles.list}>
            {filteredToggles.map((toggle) => {
              const isPending = pending[toggle.name] !== undefined;
              const disabled = !toggle.writeable || isPending;

              return (
                <div key={toggle.name} className={styles.card} data-testid={`labs-toggle-${toggle.name}`}>
                  <div className={styles.cardHeader}>
                    <div>
                      <Text element="h3" variant="h5">
                        {toggle.name}
                      </Text>
                      {toggle.description && (
                        <Text color="secondary" element="p">
                          {toggle.description}
                        </Text>
                      )}
                    </div>
                    <div className={styles.switchWrap}>
                      {isPending && <Spinner inline size="sm" />}
                      <InlineSwitch
                        id={`labs-toggle-${toggle.name}`}
                        value={toggle.enabled}
                        onChange={() => onToggle(toggle)}
                        disabled={disabled}
                        transparent={false}
                      />
                    </div>
                  </div>

                  <div className={styles.meta}>
                    <Badge text={toggle.stage || t('admin.labs.unknown-stage', 'unknown')} color={stageColor(toggle.stage)} />
                    <Badge
                      text={t('admin.labs.source-badge', 'Source: {{source}}', {
                        source: toggle.source?.name ?? 'default',
                      })}
                      color="blue"
                    />
                    {!toggle.writeable && toggle.warning && <Badge text={toggle.warning} color="red" />}
                    {toggle.source?.name === 'labs' && (
                      <Badge text={t('admin.labs.override-badge', 'Labs override')} color="purple" />
                    )}
                    {value.enabled[toggle.name] && <Badge text={t('admin.labs.enabled-badge', 'Enabled')} color="green" />}
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && value && filteredToggles.length === 0 && (
            <Alert severity="info" title={t('admin.labs.empty-filter', 'No feature flags match your filter')} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function stageColor(stage?: string) {
  switch (stage) {
    case 'GA':
      return 'green';
    case 'preview':
      return 'blue';
    case 'privatePreview':
      return 'purple';
    case 'experimental':
      return 'orange';
    case 'deprecated':
      return 'red';
    default:
      return 'blue';
  }
}

function hasErrorMessage(err: unknown): err is { data?: { message?: string } } {
  return typeof err === 'object' && err !== null && 'data' in err;
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }),
  filter: css({
    minWidth: '280px',
    maxWidth: '420px',
    width: '100%',
  }),
  list: css({
    display: 'grid',
    gap: '12px',
  }),
  card: css({
    border: '1px solid var(--border-weak)',
    borderRadius: theme.shape.radius.md,
    padding: '16px',
    background: 'var(--background-secondary)',
  }),
  cardHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  }),
  switchWrap: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '32px',
  }),
  meta: css({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '12px',
  }),
});
