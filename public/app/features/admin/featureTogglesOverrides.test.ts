import {
  parseFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
} from 'app/features/admin/featureTogglesOverrides';

describe('featureTogglesOverrides', () => {
  it('parses local storage override values', () => {
    const parsed = parseFeatureToggleOverrides('flagA=1,flagB=0,flagC=true,flagD=false');

    expect(parsed).toEqual({
      flagA: true,
      flagB: false,
      flagC: true,
      flagD: false,
    });
  });

  it('returns empty object for empty values', () => {
    expect(parseFeatureToggleOverrides(null)).toEqual({});
    expect(parseFeatureToggleOverrides('')).toEqual({});
  });

  it('serializes override values in stable order', () => {
    const serialized = serializeFeatureToggleOverrides({
      flagB: false,
      flagA: true,
    });

    expect(serialized).toBe('flagA=1,flagB=0');
  });
});
