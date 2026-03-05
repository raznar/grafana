import { parseFeatureToggleOverrides, serializeFeatureToggleOverrides } from './labsFeatureToggleOverrides';

describe('labsFeatureToggleOverrides', () => {
  it('parses an empty value', () => {
    expect(parseFeatureToggleOverrides(null)).toEqual({});
    expect(parseFeatureToggleOverrides('')).toEqual({});
  });

  it('parses mixed boolean values', () => {
    expect(parseFeatureToggleOverrides('flagA=1,flagB=0,flagC=true,flagD=false')).toEqual({
      flagA: true,
      flagB: false,
      flagC: true,
      flagD: false,
    });
  });

  it('serializes entries in a stable order', () => {
    expect(
      serializeFeatureToggleOverrides({
        zebra: true,
        alpha: false,
      })
    ).toBe('alpha=0,zebra=1');
  });
});
