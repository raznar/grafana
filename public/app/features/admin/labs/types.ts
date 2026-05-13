export type FeatureToggleStage =
  | 'experimental'
  | 'privatePreview'
  | 'preview'
  | 'GA'
  | 'deprecated'
  | 'unknown';

export interface FeatureToggleRowDTO {
  name: string;
  description: string;
  stage: FeatureToggleStage;
  owner: string;
  expression: string;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  runtimeEnabled: boolean;
  afterRestart: boolean;
  inheritedAfterRestart: boolean;
  hasOverride: boolean;
  override?: boolean;
  readOnly: boolean;
  unavailable: boolean;
  unavailableReason?: string;
}

export interface FeatureMgmtResponse {
  toggles: FeatureToggleRowDTO[];
  restartRequired: boolean;
}

export interface FeatureMgmtUpdateRequest {
  updates?: Array<{ name: string; enabled: boolean }>;
  removeOverrides?: string[];
}
