import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, store } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

const helpOptions = [
  { value: 0, label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { value: 1, label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { value: 2, label: 'Community', href: 'https://community.grafana.com' },
  { value: 3, label: 'Public Slack', href: 'http://slack.grafana.com' },
];

const THEME_STORAGE_KEY = 'grafana_home_os_theme';

type OsThemeId =
  | 'macos-aqua'
  | 'macos-sonoma'
  | 'windows-98'
  | 'windows-vista'
  | 'ubuntu-ambiance'
  | 'ubuntu-yaru-dark';

type OsTheme = {
  id: OsThemeId;
  family: 'macOS' | 'Windows' | 'Ubuntu';
  name: string;
  subtitle: string;
  desktopBackground: string;
  desktopColor: string;
  windowBackground: string;
  windowBorder: string;
  windowShadow: string;
  titlebarBackground: string;
  titlebarColor: string;
  buttonBackground: string;
  buttonColor: string;
  buttonBorder: string;
  accent: string;
  fontFamily: string;
};

const osThemes: OsTheme[] = [
  {
    id: 'macos-aqua',
    family: 'macOS',
    name: 'macOS Aqua',
    subtitle: 'Brushed gradients, rounded controls, and Lucida Grande styling.',
    desktopBackground: 'linear-gradient(145deg, #4ac0f7 0%, #0a6fb3 100%)',
    desktopColor: '#042a45',
    windowBackground: 'linear-gradient(180deg, #f8fcff 0%, #d9e7f2 100%)',
    windowBorder: '1px solid #7b8d9a',
    windowShadow: '0 12px 28px rgba(0, 20, 40, 0.35)',
    titlebarBackground: 'linear-gradient(180deg, #f6f9fb 0%, #cfd8e1 52%, #b6c3cd 100%)',
    titlebarColor: '#223746',
    buttonBackground: 'linear-gradient(180deg, #ffffff 0%, #d9e9f5 100%)',
    buttonColor: '#1e425a',
    buttonBorder: '1px solid #8ba5b8',
    accent: '#2d8ed1',
    fontFamily: '"Lucida Grande", "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'macos-sonoma',
    family: 'macOS',
    name: 'macOS Sonoma',
    subtitle: 'Soft blur-inspired cards with SF Pro typography and neon accents.',
    desktopBackground: 'linear-gradient(140deg, #091b4f 0%, #2b0d62 40%, #ad1360 100%)',
    desktopColor: '#f4f7ff',
    windowBackground: 'rgba(255, 255, 255, 0.15)',
    windowBorder: '1px solid rgba(255, 255, 255, 0.35)',
    windowShadow: '0 18px 40px rgba(4, 8, 32, 0.5)',
    titlebarBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.16) 100%)',
    titlebarColor: '#f3f5ff',
    buttonBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.22) 100%)',
    buttonColor: '#f7f8ff',
    buttonBorder: '1px solid rgba(255, 255, 255, 0.45)',
    accent: '#7ed3ff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'windows-98',
    family: 'Windows',
    name: 'Windows 98',
    subtitle: 'Classic teal desktop, beveled controls, and MS Sans Serif UI.',
    desktopBackground: '#008080',
    desktopColor: '#000000',
    windowBackground: '#c0c0c0',
    windowBorder: '2px solid #ffffff',
    windowShadow: '4px 4px 0 #2a2a2a',
    titlebarBackground: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
    titlebarColor: '#ffffff',
    buttonBackground: '#c0c0c0',
    buttonColor: '#000000',
    buttonBorder: '2px solid #ffffff',
    accent: '#000080',
    fontFamily: '"MS Sans Serif", Tahoma, Arial, sans-serif',
  },
  {
    id: 'windows-vista',
    family: 'Windows',
    name: 'Windows Vista Aero',
    subtitle: 'Glass-like gradients, Segoe UI controls, and luminous blue chrome.',
    desktopBackground: 'linear-gradient(160deg, #184f8f 0%, #2f86d2 45%, #77b8f7 100%)',
    desktopColor: '#102741',
    windowBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(220, 239, 255, 0.84) 100%)',
    windowBorder: '1px solid #74a7d9',
    windowShadow: '0 16px 36px rgba(7, 35, 78, 0.38)',
    titlebarBackground: 'linear-gradient(180deg, rgba(220, 245, 255, 0.95) 0%, rgba(131, 191, 246, 0.92) 100%)',
    titlebarColor: '#143257',
    buttonBackground: 'linear-gradient(180deg, #fdfefe 0%, #d8ecff 100%)',
    buttonColor: '#123a67',
    buttonBorder: '1px solid #7ca7cb',
    accent: '#2f7fd4',
    fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
  },
  {
    id: 'ubuntu-ambiance',
    family: 'Ubuntu',
    name: 'Ubuntu Ambiance',
    subtitle: 'Warm aubergine-to-orange tones inspired by early Ubuntu desktops.',
    desktopBackground: 'linear-gradient(145deg, #2c001e 0%, #5e2750 45%, #dd4814 100%)',
    desktopColor: '#fff3ec',
    windowBackground: 'linear-gradient(180deg, #f5f2ef 0%, #ddd4cb 100%)',
    windowBorder: '1px solid #7a6559',
    windowShadow: '0 16px 32px rgba(38, 10, 27, 0.44)',
    titlebarBackground: 'linear-gradient(180deg, #4e3b33 0%, #2f2522 100%)',
    titlebarColor: '#f6ece4',
    buttonBackground: 'linear-gradient(180deg, #f0ece7 0%, #d2c7bc 100%)',
    buttonColor: '#3f332d',
    buttonBorder: '1px solid #8f796a',
    accent: '#dd4814',
    fontFamily: '"Ubuntu", "Noto Sans", Arial, sans-serif',
  },
  {
    id: 'ubuntu-yaru-dark',
    family: 'Ubuntu',
    name: 'Ubuntu Yaru Dark',
    subtitle: 'Dark shell surfaces with Ubuntu orange focus accents.',
    desktopBackground: 'linear-gradient(135deg, #300a24 0%, #1a1d20 52%, #3a2a14 100%)',
    desktopColor: '#f6efeb',
    windowBackground: 'linear-gradient(180deg, #2a2e33 0%, #1f2226 100%)',
    windowBorder: '1px solid #4d555d',
    windowShadow: '0 18px 34px rgba(0, 0, 0, 0.52)',
    titlebarBackground: 'linear-gradient(180deg, #373d44 0%, #24282e 100%)',
    titlebarColor: '#f6f2ef',
    buttonBackground: 'linear-gradient(180deg, #4e5761 0%, #394049 100%)',
    buttonColor: '#f4f6f8',
    buttonBorder: '1px solid #59626b',
    accent: '#e95420',
    fontFamily: '"Ubuntu", "Noto Sans", Arial, sans-serif',
  },
];

const isOsThemeId = (value: string): value is OsThemeId => {
  return osThemes.some((osTheme) => osTheme.id === value);
};

const defaultThemeId: OsThemeId = 'macos-sonoma';

const readStoredTheme = (): OsThemeId => {
  const saved = store.get(THEME_STORAGE_KEY);
  return typeof saved === 'string' && isOsThemeId(saved) ? saved : defaultThemeId;
};

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);
  const [themeId, setThemeId] = useState<OsThemeId>(readStoredTheme);
  const selectedTheme = useMemo(() => osThemes.find((osTheme) => osTheme.id === themeId) ?? osThemes[0], [themeId]);
  const isClassicWin98 = selectedTheme.id === 'windows-98';
  const isModernGlass = selectedTheme.id === 'windows-vista' || selectedTheme.id === 'macos-sonoma';
  const macThemes = osThemes.filter((osTheme) => osTheme.family === 'macOS');
  const windowsThemes = osThemes.filter((osTheme) => osTheme.family === 'Windows');
  const ubuntuThemes = osThemes.filter((osTheme) => osTheme.family === 'Ubuntu');

  useEffect(() => {
    store.set(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  return (
    <div
      className={styles.desktop}
      style={{
        background: selectedTheme.desktopBackground,
        color: selectedTheme.desktopColor,
        fontFamily: selectedTheme.fontFamily,
      }}
    >
      <div
        className={styles.window}
        style={{
          background: selectedTheme.windowBackground,
          border: selectedTheme.windowBorder,
          boxShadow: selectedTheme.windowShadow,
        }}
      >
        <div
          className={styles.titleBar}
          style={{
            background: selectedTheme.titlebarBackground,
            color: selectedTheme.titlebarColor,
          }}
        >
          <div className={styles.chromeIcons}>
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
          </div>
          <p className={styles.titleBarText}>{t('welcome.os-themes.titlebar.label', 'Grafana home shell')}</p>
          <p className={styles.titleBarText}>{selectedTheme.family}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.topRow}>
            <div>
              <h1 className={styles.title}>{t('welcome.os-themes.heading', 'Pick your operating-system look')}</h1>
              <p className={styles.subtitle}>{selectedTheme.subtitle}</p>
            </div>
            <label className={styles.selectorLabel} htmlFor="home-os-theme">
              {t('welcome.os-themes.selector.label', 'Theme preset')}
              <select
                id="home-os-theme"
                className={styles.selector}
                value={themeId}
                onChange={(event) => {
                  const nextThemeId = event.currentTarget.value;
                  if (isOsThemeId(nextThemeId)) {
                    setThemeId(nextThemeId);
                  }
                }}
                style={{
                  color: selectedTheme.buttonColor,
                  background: selectedTheme.buttonBackground,
                  border: selectedTheme.buttonBorder,
                  boxShadow: isClassicWin98 ? '1px 1px 0 #7f7f7f inset' : undefined,
                }}
              >
                <optgroup label={t('welcome.os-themes.selector.macos', 'macOS themes')}>
                  {macThemes.map((osTheme) => (
                    <option key={osTheme.id} value={osTheme.id}>
                      {osTheme.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('welcome.os-themes.selector.windows', 'Windows themes')}>
                  {windowsThemes.map((osTheme) => (
                    <option key={osTheme.id} value={osTheme.id}>
                      {osTheme.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('welcome.os-themes.selector.ubuntu', 'Ubuntu themes')}>
                  {ubuntuThemes.map((osTheme) => (
                    <option key={osTheme.id} value={osTheme.id}>
                      {osTheme.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{t('welcome.os-themes.feature.chrome.title', 'Desktop chrome')}</h3>
              <p className={styles.featureBody}>
                {t(
                  'welcome.os-themes.feature.chrome.body',
                  'Window title bars, borders, and shadows match each era so the homepage behaves like a native shell.'
                )}
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{t('welcome.os-themes.feature.typography.title', 'OS typography')}</h3>
              <p className={styles.featureBody}>
                {t(
                  'welcome.os-themes.feature.typography.body',
                  'Fonts switch between Lucida/SF Pro, Segoe/MS Sans, and Ubuntu styles for platform-authentic rhythm.'
                )}
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{t('welcome.os-themes.feature.colors.title', 'Color systems')}</h3>
              <p className={styles.featureBody}>
                {t(
                  'welcome.os-themes.feature.colors.body',
                  'Palettes use canonical desktop tones, from teal Windows 98 chrome to Ubuntu aubergine and macOS glass.'
                )}
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            {helpOptions.map((option, index) => {
              return (
                <a
                  key={`${option.label}-${index}`}
                  className={styles.actionButton}
                  href={`${option.href}?utm_source=grafana_gettingstarted`}
                  style={{
                    background: selectedTheme.buttonBackground,
                    color: selectedTheme.buttonColor,
                    border: selectedTheme.buttonBorder,
                    boxShadow: isClassicWin98 ? '1px 1px 0 #7f7f7f, -1px -1px 0 #ffffff inset' : undefined,
                  }}
                >
                  {option.label}
                </a>
              );
            })}
          </div>

          <div
            className={styles.statusBar}
            style={{
              borderTop: selectedTheme.buttonBorder,
              background: isModernGlass ? 'rgba(255, 255, 255, 0.14)' : selectedTheme.windowBackground,
            }}
          >
            <span className={styles.statusItem}>
              {t('welcome.os-themes.status.active-preset', 'Active preset')}: <strong>{selectedTheme.name}</strong>
            </span>
            <span className={styles.statusItem}>
              {t('welcome.os-themes.status.accent', 'Accent')}: {selectedTheme.accent}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    desktop: css({
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
      padding: theme.spacing(2),
      [theme.transitions.handleMotion('no-preference')]: {
        transition: 'background 0.25s ease, color 0.25s ease',
      },
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(1),
      },
    }),
    window: css({
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
      minHeight: 280,
      backdropFilter: 'blur(12px)',
    }),
    titleBar: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      padding: theme.spacing(0.75, 1.5),
      borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
    }),
    chromeIcons: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      minWidth: 62,
    }),
    chromeDot: css({
      width: 11,
      height: 11,
      borderRadius: theme.shape.radius.circle,
      border: '1px solid rgba(0, 0, 0, 0.26)',
      background: 'rgba(255, 255, 255, 0.75)',
    }),
    titleBarText: css({
      margin: 0,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 700,
    }),
    content: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5),
      height: '100%',
      [theme.breakpoints.down('md')]: {
        gap: theme.spacing(1),
        padding: theme.spacing(1),
      },
    }),
    topRow: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing(2),
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
      },
    }),
    title: css({
      margin: 0,
      fontSize: theme.typography.h2.fontSize,
      lineHeight: 1.1,
    }),
    subtitle: css({
      margin: theme.spacing(0.5, 0, 0, 0),
      maxWidth: 680,
      opacity: 0.9,
      fontSize: theme.typography.body.fontSize,
    }),
    selectorLabel: css({
      display: 'flex',
      flexDirection: 'column',
      fontSize: 12,
      fontWeight: 700,
      gap: theme.spacing(0.5),
      minWidth: 230,
    }),
    selector: css({
      borderRadius: 'unset',
      fontSize: 14,
      padding: theme.spacing(0.75, 1),
      cursor: 'pointer',
    }),
    featureGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: theme.spacing(1),
      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      },
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    featureCard: css({
      padding: theme.spacing(1.25),
      border: '1px solid rgba(0, 0, 0, 0.2)',
      background: 'rgba(255, 255, 255, 0.16)',
      minHeight: 96,
    }),
    featureTitle: css({
      margin: 0,
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      fontWeight: 700,
    }),
    featureBody: css({
      margin: theme.spacing(0.5, 0, 0, 0),
      fontSize: 13,
      lineHeight: 1.5,
      opacity: 0.94,
    }),
    actions: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    }),
    actionButton: css({
      textDecoration: 'none',
      fontSize: 13,
      fontWeight: 700,
      padding: theme.spacing(0.75, 1.25),
      [theme.transitions.handleMotion('no-preference')]: {
        transition: 'transform 0.12s ease',
      },
      '&:hover': {
        transform: 'translateY(-1px)',
      },
    }),
    statusBar: css({
      marginTop: 'auto',
      display: 'flex',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
      fontSize: 12,
      padding: theme.spacing(0.5, 1),
    }),
    statusItem: css({
      opacity: 0.95,
    }),
  };
};
