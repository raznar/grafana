import { css, cx } from '@emotion/css';
import { CSSProperties, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type HomepageTheme = 'windows98' | 'windowsVista' | 'macos';

interface ThemePreset {
  shellBackground: string;
  windowBackground: string;
  windowBorder: string;
  windowShadow: string;
  titleBarBackground: string;
  titleBarText: string;
  textColor: string;
  mutedText: string;
  buttonBackground: string;
  buttonBorder: string;
  buttonShadow: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  fontFamily: string;
}

const THEME_PRESETS: Record<HomepageTheme, ThemePreset> = {
  windows98: {
    shellBackground: 'linear-gradient(180deg, #008080 0%, #006c6c 100%)',
    windowBackground: '#c0c0c0',
    windowBorder: '2px solid #ffffff',
    windowShadow: 'inset -1px -1px #000000, inset 1px 1px #dfdfdf, 8px 8px 0 rgba(0, 0, 0, 0.35)',
    titleBarBackground: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
    titleBarText: '#ffffff',
    textColor: '#111111',
    mutedText: '#2f2f2f',
    buttonBackground: '#c0c0c0',
    buttonBorder: '2px solid #ffffff',
    buttonShadow: 'inset -1px -1px #000000, inset 1px 1px #dfdfdf',
    cardBackground: '#d4d0c8',
    cardBorder: '2px solid #ffffff',
    cardShadow: 'inset -1px -1px #000000, inset 1px 1px #dfdfdf',
    fontFamily: '"MS Sans Serif", "Tahoma", "Segoe UI", sans-serif',
  },
  windowsVista: {
    shellBackground: 'linear-gradient(160deg, #0a2f67 0%, #204f98 45%, #0a1b35 100%)',
    windowBackground: 'rgba(232, 240, 255, 0.86)',
    windowBorder: '1px solid rgba(158, 189, 255, 0.9)',
    windowShadow: '0 18px 32px rgba(0, 15, 50, 0.45)',
    titleBarBackground: 'linear-gradient(90deg, rgba(55, 147, 255, 0.95) 0%, rgba(150, 216, 255, 0.95) 100%)',
    titleBarText: '#f9fdff',
    textColor: '#102a43',
    mutedText: '#35526d',
    buttonBackground: 'linear-gradient(180deg, #f9fbff 0%, #dce8ff 100%)',
    buttonBorder: '1px solid #8bb7ff',
    buttonShadow: '0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 4px 8px rgba(15, 40, 85, 0.2)',
    cardBackground: 'rgba(245, 250, 255, 0.95)',
    cardBorder: '1px solid #b5d2ff',
    cardShadow: '0 10px 22px rgba(15, 52, 110, 0.22)',
    fontFamily: '"Segoe UI", "Tahoma", sans-serif',
  },
  macos: {
    shellBackground: 'linear-gradient(150deg, #6c66ff 0%, #f26fa7 45%, #f9b466 100%)',
    windowBackground: 'rgba(255, 255, 255, 0.82)',
    windowBorder: '1px solid rgba(255, 255, 255, 0.55)',
    windowShadow: '0 24px 50px rgba(36, 31, 52, 0.34)',
    titleBarBackground: 'linear-gradient(180deg, rgba(250, 250, 252, 0.95) 0%, rgba(229, 232, 237, 0.95) 100%)',
    titleBarText: '#1f1f1f',
    textColor: '#1f2937',
    mutedText: '#4b5563',
    buttonBackground: '#ffffff',
    buttonBorder: '1px solid rgba(120, 130, 150, 0.3)',
    buttonShadow: '0 8px 18px rgba(39, 44, 56, 0.15)',
    cardBackground: 'rgba(255, 255, 255, 0.9)',
    cardBorder: '1px solid rgba(148, 163, 184, 0.35)',
    cardShadow: '0 12px 24px rgba(31, 41, 55, 0.14)',
    fontFamily: '"SF Pro Text", "Helvetica Neue", "Segoe UI", sans-serif',
  },
};

const THEME_IDS: HomepageTheme[] = ['windows98', 'windowsVista', 'macos'];

export default function GrafanaHomePage() {
  const styles = useStyles2(getStyles);
  const [selectedTheme, setSelectedTheme] = useState<HomepageTheme>('windows98');
  const activeTheme = THEME_PRESETS[selectedTheme];
  const themeLabels: Record<HomepageTheme, string> = {
    windows98: t('home-page.theme.windows98.label', 'Windows 98'),
    windowsVista: t('home-page.theme.windows-vista.label', 'Windows Vista'),
    macos: t('home-page.theme.macos.label', 'macOS'),
  };
  const activeThemeLabel = themeLabels[selectedTheme];
  const quickActions = [
    {
      title: t('home-page.quick-actions.metrics.title', 'Metrics at a glance'),
      description: t(
        'home-page.quick-actions.metrics.description',
        'Review key service and infrastructure metrics from your dashboards.'
      ),
    },
    {
      title: t('home-page.quick-actions.logs-and-traces.title', 'Logs and traces'),
      description: t(
        'home-page.quick-actions.logs-and-traces.description',
        'Jump into logs and traces to troubleshoot incidents faster.'
      ),
    },
    {
      title: t('home-page.quick-actions.profiles-and-trends.title', 'Profiles and trends'),
      description: t(
        'home-page.quick-actions.profiles-and-trends.description',
        'Track long-term performance trends and profile regressions.'
      ),
    },
  ];

  const shellStyle: CSSProperties = {
    background: activeTheme.shellBackground,
    color: activeTheme.textColor,
    fontFamily: activeTheme.fontFamily,
  };

  const windowStyle: CSSProperties = {
    background: activeTheme.windowBackground,
    border: activeTheme.windowBorder,
    boxShadow: activeTheme.windowShadow,
  };

  const titleBarStyle: CSSProperties = {
    background: activeTheme.titleBarBackground,
    color: activeTheme.titleBarText,
  };

  return (
    <Page navId="home" pageNav={{ text: t('home-page.page-nav.title', 'Homepage'), active: true }}>
      <Page.Contents>
        <section className={styles.shell} style={shellStyle}>
          <div className={styles.pickerRow}>
            <p className={styles.label}>{t('home-page.theme-picker.label', 'Theme picker')}</p>
            <div className={styles.buttonRow}>
              {THEME_IDS.map((themeId) => (
                <button
                  key={themeId}
                  type="button"
                  className={cx(styles.themeButton, selectedTheme === themeId && styles.themeButtonActive)}
                  onClick={() => setSelectedTheme(themeId)}
                  style={{
                    background: activeTheme.buttonBackground,
                    border: activeTheme.buttonBorder,
                    boxShadow: activeTheme.buttonShadow,
                    color: activeTheme.textColor,
                    fontFamily: activeTheme.fontFamily,
                  }}
                >
                  {themeLabels[themeId]}
                </button>
              ))}
            </div>
          </div>

          <article className={styles.window} style={windowStyle}>
            <header className={styles.windowHeader} style={titleBarStyle}>
              <span>{t('home-page.window.header', 'Grafana homepage')}</span>
              <div className={styles.windowDots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </header>
            <div className={styles.windowBody}>
              <h1 className={styles.title}>
                {t('home-page.theme-edition.heading', '{{theme}} edition', { theme: activeThemeLabel })}
              </h1>
              <p className={styles.subtitle} style={{ color: activeTheme.mutedText }}>
                {t(
                  'home-page.subtitle',
                  'Move between classic and modern desktop-inspired looks while keeping the same observability workflow.'
                )}
              </p>

              <div className={styles.cardsGrid}>
                {quickActions.map((card) => (
                  <section
                    key={card.title}
                    className={styles.card}
                    style={{
                      background: activeTheme.cardBackground,
                      border: activeTheme.cardBorder,
                      boxShadow: activeTheme.cardShadow,
                    }}
                  >
                    <h2 className={styles.cardTitle}>{card.title}</h2>
                    <p className={styles.cardDescription} style={{ color: activeTheme.mutedText }}>
                      {card.description}
                    </p>
                  </section>
                ))}
              </div>
            </div>
          </article>
        </section>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  shell: css({
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(4),
    minHeight: 'calc(100vh - 220px)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  }),
  pickerRow: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  label: css({
    margin: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: theme.typography.fontWeightMedium,
  }),
  buttonRow: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  themeButton: css({
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  themeButtonActive: css({
    outline: `2px solid ${theme.colors.primary.main}`,
    outlineOffset: '1px',
  }),
  window: css({
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  windowHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  windowDots: css({
    display: 'flex',
    gap: theme.spacing(0.75),
  }),
  dot: css({
    width: theme.spacing(1),
    height: theme.spacing(1),
    borderRadius: theme.shape.radius.circle,
    background: 'currentColor',
    opacity: 0.75,
  }),
  windowBody: css({
    padding: theme.spacing(4),
  }),
  title: css({
    marginTop: 0,
    marginBottom: theme.spacing(1),
  }),
  subtitle: css({
    marginTop: 0,
    marginBottom: theme.spacing(3),
    maxWidth: '72ch',
  }),
  cardsGrid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  }),
  card: css({
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
  cardTitle: css({
    marginTop: 0,
    marginBottom: theme.spacing(0.5),
    fontSize: theme.typography.body.fontSize,
  }),
  cardDescription: css({
    margin: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  }),
});
