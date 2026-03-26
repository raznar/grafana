import { getBackendSrv } from '@grafana/runtime';

export interface LabsToggle {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  warning?: string;
  source?: {
    name?: string;
  };
}

export interface LabsState {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: LabsToggle[];
}

export const getLabsFeatureToggles = async () => {
  return getBackendSrv().get<LabsState>('/api/admin/labs');
};

export const updateLabsFeatureToggle = async (flag: string, enabled: boolean) => {
  return getBackendSrv().put<LabsState>(`/api/admin/labs/${encodeURIComponent(flag)}`, { enabled });
};
