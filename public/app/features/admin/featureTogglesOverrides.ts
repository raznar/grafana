export const FEATURE_TOGGLES_LOCAL_STORAGE_KEY = 'grafana.featureToggles';
const collator = new Intl.Collator();

export function parseFeatureToggleOverrides(value: string | null): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  if (!value) {
    return result;
  }

  const entries = value.split(',');
  for (const entry of entries) {
    const [name, raw] = entry.split('=');
    if (!name) {
      continue;
    }

    result[name] = raw === '1' || raw === 'true';
  }

  return result;
}

export function serializeFeatureToggleOverrides(overrides: Record<string, boolean>): string {
  return Object.entries(overrides)
    .sort(([left], [right]) => collator.compare(left, right))
    .map(([name, value]) => `${name}=${value ? '1' : '0'}`)
    .join(',');
}
