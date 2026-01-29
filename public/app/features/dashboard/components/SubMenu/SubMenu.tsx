import { css } from '@emotion/css';
import { FormEvent, useCallback, useState } from 'react';
import { connect, MapStateToProps } from 'react-redux';

import { AnnotationQuery, DataQuery, TypedVariableModel, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { DashboardLink } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { StoreState } from 'app/types/store';

import { getSubMenuVariables, getVariablesState } from '../../../variables/state/selectors';
import { DashboardModel } from '../../state/DashboardModel';

import { Annotations } from './Annotations';
import { DashboardLinks } from './DashboardLinks';
import { SubMenuItems } from './SubMenuItems';

interface OwnProps {
  dashboard: DashboardModel;
  links: DashboardLink[];
  annotations: AnnotationQuery[];
}

interface ConnectedProps {
  variables: TypedVariableModel[];
}

type Props = OwnProps & ConnectedProps;

function SubMenuUnConnected({ dashboard, variables, links, annotations }: Props) {
  const [, forceUpdate] = useState({});
  const styles = useStyles2(getStyles);

  const onAnnotationStateChanged = useCallback(
    (updatedAnnotation: AnnotationQuery<DataQuery>) => {
      // we're mutating dashboard state directly here until annotations are in Redux.
      for (let index = 0; index < dashboard.annotations.list.length; index++) {
        const annotation = dashboard.annotations.list[index];
        if (annotation.name === updatedAnnotation.name) {
          annotation.enable = !annotation.enable;
          break;
        }
      }
      dashboard.startRefresh();
      forceUpdate({});
    },
    [dashboard]
  );

  const disableSubmitOnEnter = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }, []);

  const readOnlyVariables = dashboard.meta.isSnapshot ?? false;

  return (
    <div className={styles.submenu}>
      <form
        aria-label={t('dashboard.sub-menu-un-connected.aria-label-template-variables', 'Template variables')}
        className={styles.formStyles}
        onSubmit={disableSubmitOnEnter}
      >
        <SubMenuItems variables={variables} readOnly={readOnlyVariables} />
      </form>
      <Annotations
        annotations={annotations}
        onAnnotationChanged={onAnnotationStateChanged}
        events={dashboard.events}
      />
      <div className={styles.spacer} />
      {dashboard && <DashboardLinks dashboard={dashboard} links={links} />}
    </div>
  );
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state, ownProps) => {
  const { uid } = ownProps.dashboard;
  const templatingState = getVariablesState(uid, state);
  return {
    variables: getSubMenuVariables(uid, templatingState.variables),
  };
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    formStyles: css({
      display: 'contents',
      flexWrap: 'wrap',
    }),
    submenu: css({
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignContent: 'flex-start',
      alignItems: 'flex-start',
      gap: `${theme.spacing(1)} ${theme.spacing(2)}`,
      padding: `0 0 ${theme.spacing(1)} 0`,
    }),
    spacer: css({
      flexGrow: 1,
    }),
  };
};

export const SubMenu = connect(mapStateToProps)(SubMenuUnConnected);

SubMenu.displayName = 'SubMenu';
