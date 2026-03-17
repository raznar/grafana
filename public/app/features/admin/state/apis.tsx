import { getBackendSrv } from '@grafana/runtime';

interface AnonServerStat {
  activeDevices?: number;
}

export interface ServerStat extends AnonServerStat {
  activeAdmins: number;
  activeEditors: number;
  activeSessions: number;
  activeUsers: number;
  activeViewers: number;
  admins: number;
  alerts: number;
  dashboards: number;
  datasources: number;
  editors: number;
  orgs: number;
  playlists: number;
  snapshots: number;
  stars: number;
  tags: number;
  users: number;
  viewers: number;
}

export const getServerStats = async (): Promise<ServerStat | null> => {
  return getBackendSrv()
    .get('api/admin/stats')
    .catch((err) => {
      console.error(err);
      return null;
    });
};

export interface AdminFeatureToggle {
  name: string;
  description: string;
  stage: string;
  owner?: string;
  enabled: boolean;
  defaultEnabled: boolean;
  requiresRestart?: boolean;
  frontendOnly?: boolean;
}

export interface AdminFeatureTogglesResponse {
  items: AdminFeatureToggle[];
}

export const getAdminFeatureToggles = async (): Promise<AdminFeatureTogglesResponse> => {
  return getBackendSrv().get('/api/admin/feature-toggles');
};
