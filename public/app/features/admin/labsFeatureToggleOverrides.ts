import { store } from '@grafana/data';

export type FeatureToggleOverrides = Record<string, boolean>;

export const FEATURE_TOGGLE_OVERRIDES_KEY = 'grafana.featureToggles';

export function parseFeatureToggleOverrides(value: string | null): FeatureToggleOverrides {
  if (!value) {
    return {};
  }

  const overrides: FeatureToggleOverrides = {};
  const features = value.split(',');

  for (const feature of features) {
    if (!feature) {
      continue;
    }

    const [name, rawValue] = feature.split('=');
    if (!name) {
      continue;
    }

    const normalizedValue = rawValue?.toLowerCase();
    overrides[name] = normalizedValue === 'true' || normalizedValue === '1';
  }

  return overrides;
}

export function serializeFeatureToggleOverrides(overrides: FeatureToggleOverrides): string {
  const collator = new Intl.Collator('en');
  return Object.entries(overrides)
    .sort(([left], [right]) => collator.compare(left, right))
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function readFeatureToggleOverrides(): FeatureToggleOverrides {
  const storedValue = store.get(FEATURE_TOGGLE_OVERRIDES_KEY);
  return parseFeatureToggleOverrides(typeof storedValue === 'string' ? storedValue : null);
}

export function writeFeatureToggleOverrides(overrides: FeatureToggleOverrides): void {
  const serialized = serializeFeatureToggleOverrides(overrides);
  if (!serialized) {
    store.delete(FEATURE_TOGGLE_OVERRIDES_KEY);
    return;
  }

  store.set(FEATURE_TOGGLE_OVERRIDES_KEY, serialized);
}
