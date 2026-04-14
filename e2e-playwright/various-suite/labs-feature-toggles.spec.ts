import { test, expect } from '@grafana/plugin-e2e';

test.describe(
  'Labs feature flags',
  {
    tag: ['@various'],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.evaluate(() => {
        localStorage.setItem('grafana.navigation.docked', 'true');
      });
    });

    test('Labs page loads with feature toggles', async ({ page }) => {
      await page.goto('/labs');
      await expect(page.getByTestId('labs-page')).toBeVisible();
      await expect(page.getByRole('heading', { name: /^Labs$/i })).toBeVisible();
      await expect(page.getByRole('switch').first()).toBeVisible();
    });

    test('search filters feature flags', async ({ page }) => {
      await page.goto('/labs');
      await expect(page.getByTestId('labs-flag-row-panelTitleSearch')).toBeVisible();
      await page.getByTestId('labs-search-input').fill('panelTitleSearch');
      await expect(page.getByTestId('labs-flag-row-panelTitleSearch')).toBeVisible();
      await expect(page.getByRole('switch')).toHaveCount(1);
    });

    test('toggling a flag updates localStorage and reloads', async ({ page }) => {
      await page.goto('/labs');
      await page.evaluate(() => localStorage.removeItem('grafana.featureToggles'));
      await page.reload();
      await expect(page.getByTestId('labs-flag-row-panelTitleSearch')).toBeVisible();

      const row = page.getByTestId('labs-flag-row-panelTitleSearch');
      const toggle = row.getByRole('switch');
      const wasChecked = await toggle.isChecked();
      await toggle.click();
      await page.waitForLoadState('load');

      const ls = await page.evaluate(() => localStorage.getItem('grafana.featureToggles'));
      expect(ls).toContain('panelTitleSearch=');
      if (wasChecked) {
        expect(ls).toContain('panelTitleSearch=false');
      } else {
        expect(ls).toContain('panelTitleSearch=true');
      }
    });

    test('reset all clears localStorage overrides', async ({ page }) => {
      await page.goto('/labs');
      await page.evaluate(() => {
        localStorage.setItem('grafana.featureToggles', 'panelTitleSearch=true');
      });
      await page.reload();
      await page.getByTestId('labs-reset-all').click();
      await page.waitForLoadState('load');
      const ls = await page.evaluate(() => localStorage.getItem('grafana.featureToggles'));
      expect(ls).toBeNull();
    });

    test('Labs appears in docked navigation', async ({ page, selectors }) => {
      await page.goto('/');
      const navMenu = page.getByTestId(selectors.components.NavMenu.Menu);
      await expect(navMenu).toBeVisible();
      await expect(navMenu.getByRole('link', { name: 'Labs' })).toBeVisible();
    });
  }
);
