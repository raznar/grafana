import { test, expect } from '@grafana/plugin-e2e';

test.describe('Dashboard panel attention', { tag: ['@dashboards'] }, () => {
  test('should give panel attention on focus', async ({ gotoDashboardPage, page, selectors }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'n1jR8vnnz' });
    const title = dashboardPage.getByGrafanaSelector(selectors.components.Panels.Panel.title('State timeline'));
    await title.focus();
    await page.keyboard.press('v');
    await expect(page).toHaveURL(/viewPanel=41/);
  });

  test('should give panel attention on hover', async ({ gotoDashboardPage, page, selectors }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'n1jR8vnnz' });
    const title = dashboardPage.getByGrafanaSelector(selectors.components.Panels.Panel.title('State timeline'));
    await title.hover();
    // Panel attention uses a short debounce on pointer move
    await page.waitForTimeout(150);
    await page.keyboard.press('v');
    await expect(page).toHaveURL(/viewPanel=41/);
  });

  test('should change panel attention between focus and hover', async ({ gotoDashboardPage, page, selectors }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'n1jR8vnnz' });
    const focusTitle = dashboardPage.getByGrafanaSelector(
      selectors.components.Panels.Panel.title('Size, color mapped to different fields + share view')
    );
    const hoverTitle = dashboardPage.getByGrafanaSelector(selectors.components.Panels.Panel.title('State timeline'));
    await focusTitle.focus();
    await hoverTitle.hover();
    await page.waitForTimeout(150);
    await page.keyboard.press('v');
    await expect(page).toHaveURL(/viewPanel=41/);
  });
});
