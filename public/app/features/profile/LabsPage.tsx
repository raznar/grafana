import { useCallback, useEffect, useMemo, useState } from 'react';

import { store } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config, getBackendSrv } from '@grafana/runtime';
import { Alert, Button, Field, Input, Label, Stack, Switch, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const FEATURE_TOGGLES_STORAGE_KEY = 'grafana.featureToggles';

interface LabsFeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  requiresDevMode: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  enabled: boolean;
}

function parseFeatureTogglesFromLocalStorage(): Record<string, boolean> {
  const raw = store.get(FEATURE_TOGGLES_STORAGE_KEY);
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

function writeFeatureTogglesToLocalStorage(overrides: Record<string, boolean>) {
  const entries = Object.entries(overrides);
  if (entries.length === 0) {
    store.delete(FEATURE_TOGGLES_STORAGE_KEY);
    return;
  }
  const serialized = entries.map(([k, v]) => `${k}=${v ? 'true' : 'false'}`).join(',');
  store.set(FEATURE_TOGGLES_STORAGE_KEY, serialized);
}

export default function LabsPage() {
  const [flags, setFlags] = useState<LabsFeatureFlagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() => parseFeatureTogglesFromLocalStorage());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getBackendSrv().get<LabsFeatureFlagDTO[]>('/api/user/labs/feature-flags');
        if (!cancelled) {
          setFlags(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effective = useCallback(
    (name: string, serverEnabled: boolean) => (name in overrides ? overrides[name] : serverEnabled),
    [overrides]
  );

  const setToggle = useCallback((name: string, serverEnabled: boolean, next: boolean) => {
    setOverrides((prev) => {
      const nextMap = { ...prev };
      if (next === serverEnabled) {
        delete nextMap[name];
      } else {
        nextMap[name] = next;
      }
      writeFeatureTogglesToLocalStorage(nextMap);
      return nextMap;
    });
  }, []);

  const resetOverrides = useCallback(() => {
    store.delete(FEATURE_TOGGLES_STORAGE_KEY);
    setOverrides({});
    window.location.reload();
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return flags;
    }
    return flags.filter(
      (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.stage.toLowerCase().includes(q)
    );
  }, [flags, query]);

  if (!config.labsEnabled) {
    return (
      <Page navId="profile/labs">
        <Page.Contents>
          <Alert title={t('profile.labs.not-available-title', 'Labs is not available')} severity="info">
            <Trans i18nKey="profile.labs.not-available-body">
              Turn on Labs with <Text element="code">[labs] enabled = true</Text> or set{' '}
              <Text element="code">GF_LABS_ENABLED=true</Text>. In development mode, Labs is on by default.
            </Trans>
          </Alert>
        </Page.Contents>
      </Page>
    );
  }

  return (
    <Page navId="profile/labs">
      <Page.Contents isLoading={loading}>
        {error && (
          <Alert title={t('profile.labs.load-error-title', 'Could not load feature flags')} severity="error">
            {error}
          </Alert>
        )}
        <Stack direction="column" gap={2}>
          <Text element="p">
            <Trans i18nKey="profile.labs.intro">
              Toggle feature flags for this browser session. Overrides are stored in localStorage under{' '}
              <Text element="code">{FEATURE_TOGGLES_STORAGE_KEY}</Text> (same format as manual overrides). Reload the
              page after changes so the app picks them up.
            </Trans>
          </Text>
          <Stack gap={2} wrap>
            <Button variant="secondary" onClick={reload}>
              <Trans i18nKey="profile.labs.reload">Reload page</Trans>
            </Button>
            <Button variant="destructive" fill="outline" onClick={resetOverrides}>
              <Trans i18nKey="profile.labs.reset">Clear overrides and reload</Trans>
            </Button>
          </Stack>
          <Field label={t('profile.labs.filter', 'Filter')} noMargin>
            <Input
              width={50}
              placeholder={t('profile.labs.filter-placeholder', 'Search by name or description')}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          </Field>
          <Stack direction="column" gap={1}>
            {filtered.map((f) => {
              const on = effective(f.name, f.enabled);
              return (
                <Stack key={f.name} direction="row" gap={1} alignItems="flex-start">
                  <Switch
                    id={`labs-flag-${f.name}`}
                    value={on}
                    onChange={(e) => setToggle(f.name, f.enabled, e.currentTarget.checked)}
                    label={f.name}
                  />
                  <Label htmlFor={`labs-flag-${f.name}`}>
                    <Stack direction="column" gap={0.5}>
                      <Text weight="medium">{f.name}</Text>
                      <span>{f.description}</span>
                      <Text color="secondary" variant="bodySmall">
                        {f.stage}
                        {f.requiresDevMode && (
                          <>
                            {' '}
                            <Trans i18nKey="profile.labs.requires-dev-mode">· requires dev mode</Trans>
                          </>
                        )}
                        {f.frontendOnly && (
                          <>
                            {' '}
                            <Trans i18nKey="profile.labs.frontend-only">· frontend only</Trans>
                          </>
                        )}
                        {f.requiresRestart && (
                          <>
                            {' '}
                            <Trans i18nKey="profile.labs.requires-restart">· may require server restart</Trans>
                          </>
                        )}
                      </Text>
                    </Stack>
                  </Label>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </Page.Contents>
    </Page>
  );
}
