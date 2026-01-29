import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { Spinner, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { historySrv, RevisionsModel } from 'app/features/dashboard-scene/settings/version-history/HistorySrv';
import { VersionsHistoryButtons } from 'app/features/dashboard-scene/settings/version-history/VersionHistoryButtons';
import { VersionHistoryHeader } from 'app/features/dashboard-scene/settings/version-history/VersionHistoryHeader';

import { VersionHistoryComparison } from '../VersionHistory/VersionHistoryComparison';
import { VersionHistoryTable } from '../VersionHistory/VersionHistoryTable';

import { SettingsPageProps } from './types';

interface Props extends SettingsPageProps {}

export type DecoratedRevisionModel = RevisionsModel & {
  createdDateString: string;
  ageString: string;
};

export const VERSIONS_FETCH_LIMIT = 10;

export function VersionsSettings({ dashboard, sectionNav }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppending, setIsAppending] = useState(true);
  const [versions, setVersions] = useState<DecoratedRevisionModel[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [diffData, setDiffData] = useState({ lhs: '', rhs: '' });
  const [newInfo, setNewInfo] = useState<DecoratedRevisionModel>();
  const [baseInfo, setBaseInfo] = useState<DecoratedRevisionModel>();
  const [isNewLatest, setIsNewLatest] = useState(false);

  const limitRef = useRef(VERSIONS_FETCH_LIMIT);
  const startRef = useRef(0);
  const continueTokenRef = useRef('');

  const decorateVersions = useCallback(
    (versionList: RevisionsModel[]) =>
      versionList.map((version) => ({
        ...version,
        createdDateString: dashboard.formatDate(version.created),
        ageString: dashboard.getRelativeTime(version.created),
        checked: false,
      })),
    [dashboard]
  );

  const getVersions = useCallback(
    (append = false) => {
      setIsAppending(append);
      const requestOptions = continueTokenRef.current
        ? { limit: limitRef.current, start: startRef.current, continueToken: continueTokenRef.current }
        : { limit: limitRef.current, start: startRef.current };

      historySrv
        .getHistoryList(dashboard.uid, requestOptions)
        .then((res) => {
          setIsLoading(false);
          setVersions((prev) => [...prev, ...decorateVersions(res.versions)]);
          startRef.current += limitRef.current;
          continueTokenRef.current = res.continueToken ?? '';
        })
        .catch((err) => console.log(err))
        .finally(() => setIsAppending(false));
    },
    [dashboard.uid, decorateVersions]
  );

  useEffect(() => {
    getVersions();
  }, [getVersions]);

  const getDiff = useCallback(async () => {
    const selectedVersions = versions.filter((version) => version.checked);
    const [newInfoData, baseInfoData] = selectedVersions;
    const newLatest = newInfoData.version === dashboard.version;

    setIsLoading(true);

    const lhs = await historySrv.getDashboardVersion(dashboard.uid, baseInfoData.id);
    const rhs = await historySrv.getDashboardVersion(dashboard.uid, newInfoData.id);

    setBaseInfo(baseInfoData);
    setIsLoading(false);
    setIsNewLatest(newLatest);
    setNewInfo(newInfoData);
    setViewMode('compare');
    setDiffData({
      lhs: lhs.data,
      rhs: rhs.data,
    });
  }, [versions, dashboard.version, dashboard.uid]);

  const isLastPage = useCallback(() => {
    return (
      versions.find((rev) => rev.version === 1) ||
      versions.length % limitRef.current !== 0 ||
      continueTokenRef.current === ''
    );
  }, [versions]);

  const onCheck = useCallback((ev: FormEvent<HTMLInputElement>, versionId: number) => {
    setVersions((prev) =>
      prev.map((version) => (version.id === versionId ? { ...version, checked: ev.currentTarget.checked } : version))
    );
  }, []);

  const reset = useCallback(() => {
    continueTokenRef.current = '';
    setBaseInfo(undefined);
    setDiffData({ lhs: '', rhs: '' });
    setIsNewLatest(false);
    setNewInfo(undefined);
    setVersions((prev) => prev.map((version) => ({ ...version, checked: false })));
    setViewMode('list');
  }, []);

  const canCompare = versions.filter((version) => version.checked).length === 2;
  const showButtons = versions.length > 1;
  const hasMore = versions.length >= limitRef.current;
  const pageNav = sectionNav.node.parentItem;

  if (viewMode === 'compare') {
    return (
      <Page navModel={sectionNav} pageNav={pageNav}>
        <VersionHistoryHeader
          onClick={reset}
          baseVersion={baseInfo?.version}
          newVersion={newInfo?.version}
          isNewLatest={isNewLatest}
        />
        {isLoading ? (
          <VersionsHistorySpinner msg="Fetching changes&hellip;" />
        ) : (
          <VersionHistoryComparison
            newInfo={newInfo!}
            baseInfo={baseInfo!}
            isNewLatest={isNewLatest}
            diffData={diffData}
          />
        )}
      </Page>
    );
  }

  return (
    <Page navModel={sectionNav} pageNav={pageNav}>
      {isLoading ? (
        <VersionsHistorySpinner msg="Fetching history list&hellip;" />
      ) : (
        <VersionHistoryTable versions={versions} onCheck={onCheck} canCompare={canCompare} />
      )}
      {isAppending && <VersionsHistorySpinner msg="Fetching more entries&hellip;" />}
      {showButtons && (
        <VersionsHistoryButtons
          hasMore={hasMore}
          canCompare={canCompare}
          getVersions={getVersions}
          getDiff={getDiff}
          isLastPage={!!isLastPage()}
        />
      )}
    </Page>
  );
}

export const VersionsHistorySpinner = ({ msg }: { msg: string }) => (
  <Stack>
    <Spinner />
    <em>{msg}</em>
  </Stack>
);
