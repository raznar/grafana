import { css } from '@emotion/css';
import { useEffect, useId, useMemo, useState } from 'react';

import { store } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Badge, Button, Field, Input, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

const FEATURE_TOGGLES_LS_KEY = 'grafana.featureToggles';

export interface FeatureToggleMetadataItem {
  name: string;
  description: string;
  stage: string;
  frontendOnly: boolean;
  expression: string;
}

function parseLocalStorageOverrides(): Record<string, boolean> {
  const raw = store.get(FEATURE_TOGGLES_LS_KEY);
  if (!raw) {
    return {};
  }
  const out: Record<string, boolean> = {};
  for (const part of raw.split(',')) {
    const [name, value] = part.split('=');
    if (!name) {
      continue;
    }
    out[name.trim()] = value === 'true' || value === '1';
  }
  return out;
}

function persistLocalStorageOverrides(overrides: Record<string, boolean>) {
  const entries = Object.entries(overrides);
  if (entries.length === 0) {
    store.delete(FEATURE_TOGGLES_LS_KEY);
    return;
  }
  const serialized = entries.map(([k, v]) => `${k}=${v ? 'true' : 'false'}`).join(',');
  store.set(FEATURE_TOGGLES_LS_KEY, serialized);
}

function defaultBoolFromExpression(expression: string): boolean {
  const e = expression.trim();
  if (e === 'true') {
    return true;
  }
  if (e === 'false') {
    return false;
  }
  return false;
}

function stageBadgeColor(stage: string): 'blue' | 'green' | 'orange' | 'purple' | 'red' {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'preview':
      return 'purple';
    case 'generalAvailability':
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'blue';
  }
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const searchInputId = useId();
  const [items, setItems] = useState<FeatureToggleMetadataItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    getBackendSrv()
      .get<{ items: FeatureToggleMetadataItem[] }>('/api/feature-toggles/metadata')
      .then((resp) => {
        if (!cancelled) {
          const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
          const sorted = [...(resp.items ?? [])].sort((a, b) => collator.compare(a.name, b.name));
          setItems(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t('labs-page.load-error', 'Could not load feature flags.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stages = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      if (it.stage) {
        s.add(it.stage);
      }
    }
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (stageFilter !== 'all' && it.stage !== stageFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.stage.toLowerCase().includes(q)
      );
    });
  }, [items, query, stageFilter]);

  const readToggleEnabled = (name: string): boolean => {
    return Boolean(Reflect.get(config.featureToggles, name));
  };

  const onToggle = (name: string, enabled: boolean) => {
    const overrides = parseLocalStorageOverrides();
    const def = defaultBoolFromExpression(items.find((i) => i.name === name)?.expression ?? '');
    if (enabled === def) {
      delete overrides[name];
    } else {
      overrides[name] = enabled;
    }
    persistLocalStorageOverrides(overrides);
    window.location.reload();
  };

  const onResetAll = () => {
    store.delete(FEATURE_TOGGLES_LS_KEY);
    window.location.reload();
  };

  return (
    <Page navId="labs" pageNav={{ text: t('labs-page.nav', 'Labs') }} data-testid="labs-page">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <div>
            <h1 className={styles.h1}>
              <Trans i18nKey="labs-page.title">Labs</Trans>
            </h1>
            <Text element="p" color="secondary">
              <Trans i18nKey="labs-page.intro">
                Toggle feature flags for this browser. Overrides are stored in local storage and apply after reload. Some
                flags only take effect when changed in Grafana configuration or require a server restart.
              </Trans>
            </Text>
          </div>

          <Stack direction="row" gap={2} alignItems="flex-end" wrap>
            <Field noMargin label={t('labs-page.search-label', 'Search')} htmlFor={searchInputId}>
              <Input
                id={searchInputId}
                data-testid="labs-search-input"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder={t('labs-page.search-placeholder', 'Filter by name or description')}
              />
            </Field>
            <Field noMargin label={t('labs-page.stage-label', 'Stage')}>
              <select
                className={styles.select}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.currentTarget.value)}
                aria-label={t('labs-page.stage-filter-aria', 'Filter by stage')}
              >
                <option value="all">{t('labs-page.stage-all', 'All stages')}</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Button variant="secondary" data-testid="labs-reset-all" onClick={onResetAll}>
              <Trans i18nKey="labs-page.reset-all">Reset browser overrides</Trans>
            </Button>
          </Stack>

          {loadError && (
            <Text color="error" element="p">
              {loadError}
            </Text>
          )}

          <Stack direction="column" gap={1}>
            {filtered.map((it) => {
              const def = defaultBoolFromExpression(it.expression);
              const enabled = readToggleEnabled(it.name);
              const modified = enabled !== def;
              return (
                <div key={it.name} className={styles.row} data-testid={`labs-flag-row-${it.name}`}>
                  <div className={styles.rowMain}>
                    <Stack direction="row" gap={1} alignItems="center" wrap>
                      <Text element="span" weight="bold">
                        {it.name}
                      </Text>
                      <Badge color={stageBadgeColor(it.stage)} text={it.stage} />
                      {it.frontendOnly && (
                        <Badge color="blue" text={t('labs-page.badge-frontend', 'Frontend only')} />
                      )}
                      {modified && (
                        <Badge color="orange" text={t('labs-page.badge-modified', 'Modified in this browser')} />
                      )}
                    </Stack>
                    {it.description && (
                      <Text element="p" color="secondary" variant="bodySmall">
                        {it.description}
                      </Text>
                    )}
                  </div>
                  <Switch
                    id={`labs-toggle-${it.name}`}
                    value={enabled}
                    onChange={(e) => onToggle(it.name, e.currentTarget.checked)}
                  />
                </div>
              );
            })}
          </Stack>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles() {
  return {
    h1: css({
      marginBottom: 0,
    }),
    select: css({
      minWidth: 200,
    }),
    row: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '12px 0',
      borderBottom: '1px solid var(--border-weak)',
    }),
    rowMain: css({
      flex: 1,
      minWidth: 0,
    }),
  };
}
