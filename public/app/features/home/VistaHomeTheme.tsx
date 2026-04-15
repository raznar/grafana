/* eslint-disable @grafana/no-border-radius-literal, @grafana/no-unreduced-motion -- Vista decorative global styling */
import { css, Global } from '@emotion/react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { config } from '@grafana/runtime';

const VISTA_BODY_CLASS = 'vista-home-theme';

/**
 * Applies a Windows Vista–inspired glass and Aurora look to the Grafana home dashboard (`/`).
 * Scoped to the home route only via `body.${VISTA_BODY_CLASS}`.
 * Requires the `vistaHomeTheme` feature toggle and light theme (styles are light-only).
 */
export function VistaHomeTheme() {
  const location = useLocation();
  const isHomePath = location.pathname === '/';
  const enabled = Boolean(config.featureToggles.vistaHomeTheme) && !config.theme2.isDark;

  useEffect(() => {
    if (enabled && isHomePath) {
      document.body.classList.add(VISTA_BODY_CLASS);
    } else {
      document.body.classList.remove(VISTA_BODY_CLASS);
    }
    return () => document.body.classList.remove(VISTA_BODY_CLASS);
  }, [enabled, isHomePath]);

  if (!enabled || !isHomePath) {
    return null;
  }

  return <Global styles={getVistaHomeGlobalStyles(VISTA_BODY_CLASS)} />;
}

function getVistaHomeGlobalStyles(bodyClass: string) {
  const b = `body.${bodyClass}`;

  return css({
    [b]: {
      backgroundColor: '#1a3a6e',
      backgroundImage: `
        radial-gradient(ellipse 120% 80% at 20% 15%, rgba(120, 200, 255, 0.45) 0%, transparent 55%),
        radial-gradient(ellipse 100% 60% at 75% 25%, rgba(80, 180, 140, 0.35) 0%, transparent 50%),
        radial-gradient(ellipse 80% 50% at 50% 90%, rgba(60, 100, 200, 0.4) 0%, transparent 45%),
        linear-gradient(165deg, #0d1f4a 0%, #1e4a7b 35%, #2a6a5a 70%, #143a6e 100%)`,
      backgroundAttachment: 'fixed',
    },

    [`${b} .grafana-app, ${b} .main-view`]: {
      background: 'transparent',
    },

    [`${b} .main-view > header`]: {
      background: `linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.92) 0%,
        rgba(210, 225, 250, 0.75) 45%,
        rgba(175, 195, 235, 0.65) 100%
      ) !important`,
      borderBottom: '1px solid rgba(255, 255, 255, 0.65)',
      boxShadow: `
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        0 1px 2px rgba(0, 0, 0, 0.15)`,
      backdropFilter: 'blur(12px)',
    },

    [`${b} .main-view > header button, ${b} .main-view > header [role='button']`]: {
      borderRadius: 3,
      border: '1px solid rgba(255, 255, 255, 0.55)',
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(220, 230, 250, 0.85))',
      boxShadow: `
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        0 1px 1px rgba(0, 0, 0, 0.08)`,
    },

    [`${b} .main-view > header button:hover, ${b} .main-view > header [role='button']:hover`]: {
      background: 'linear-gradient(to bottom, #ffffff, rgba(230, 240, 255, 0.95))',
      borderColor: 'rgba(100, 150, 220, 0.55)',
    },

    [`${b} .main-view > header a`]: {
      color: '#1a2744',
      textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    },

    [`${b} [data-testid*='mega-menu']`]: {
      background: `linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.92) 0%,
        rgba(230, 238, 252, 0.88) 100%
      ) !important`,
      borderRight: '1px solid rgba(255, 255, 255, 0.55) !important',
      boxShadow: `
        inset 1px 0 0 rgba(255, 255, 255, 0.7),
        4px 0 16px rgba(0, 0, 0, 0.12)`,
      backdropFilter: 'blur(10px)',
    },

    [`${b} #pageContent`]: {
      background: 'transparent',
    },

    [`${b} #pageContent [class*='page-container'], ${b} #pageContent main, ${b} #page-scrollbar`]: {
      background: 'transparent',
    },

    [`${b} [data-testid='dashboard-scene-page']`]: {
      background: 'transparent',
    },

    // e2e test id value includes the literal prefix "data-testid "
    [`${b} [data-testid^='data-testid Panel'], ${b} section[data-testid='Panel']`]: {
      borderRadius: 6,
      border: '1px solid rgba(255, 255, 255, 0.55)',
      background: `linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.88) 0%,
        rgba(220, 232, 252, 0.72) 55%,
        rgba(200, 218, 248, 0.65) 100%
      ) !important`,
      boxShadow: `
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        0 4px 14px rgba(0, 0, 0, 0.12),
        0 1px 2px rgba(0, 0, 0, 0.08)`,
      backdropFilter: 'blur(8px)',
      overflow: 'hidden',
    },

    [`${b} [data-testid^='data-testid Panel'] h2, ${b} section[data-testid='Panel'] h2`]: {
      color: '#1a2744',
      textShadow: '0 1px 0 rgba(255, 255, 255, 0.65)',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },

    [`${b} .dashboard-row-header`]: {
      background: `linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.55) 0%,
        rgba(200, 215, 245, 0.45) 100%
      ) !important`,
      border: '1px solid rgba(255, 255, 255, 0.45)',
      borderRadius: 4,
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(6px)',
    },

    [`${b} .dashboard-row-header button`]: {
      color: '#1a2744 !important',
      textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    },

    [`${b} .react-grid-layout`]: {
      background: 'transparent',
    },

    [`${b} .react-grid-item`]: {
      transition: 'box-shadow 0.15s ease-out',
    },

    [`${b} .react-grid-item.cssTransforms`]: {
      borderRadius: 4,
    },
  });
}
