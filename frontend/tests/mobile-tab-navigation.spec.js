import { test, expect } from '@playwright/test';

// Helper: check no horizontal overflow
async function checkNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow, 'Page should not have horizontal overflow').toBe(false);
}

test.describe('Mobile - Tab Navigation on Home', () => {

  test('Click "Struttura / Medico" tab navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot before click
    await page.screenshot({ path: 'test-results/screenshots/home-before-tab-click.png', fullPage: true });

    // Find and click the "Struttura / Medico" tab
    const tab = page.locator('.tab-inactive').first();
    await expect(tab).toBeVisible();
    await tab.click();

    // Wait for navigation/page change
    await page.waitForLoadState('networkidle');

    // Screenshot after click
    await page.screenshot({ path: 'test-results/screenshots/home-after-struttura-medico.png', fullPage: true });

    // Check no overflow after navigation
    await checkNoHorizontalOverflow(page);
  });

  test('Tabs are visually side by side on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tabPositions = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.tab-button');
      return Array.from(tabs).map(tab => ({
        text: tab.textContent.trim(),
        top: Math.round(tab.getBoundingClientRect().top),
        left: Math.round(tab.getBoundingClientRect().left),
        width: Math.round(tab.getBoundingClientRect().width),
      }));
    });

    // Both tabs should be on the same line (same top position)
    expect(tabPositions).toHaveLength(2);
    expect(tabPositions[0].top, 'Tabs should be on the same row').toBe(tabPositions[1].top);
    // Second tab should be to the right of the first
    expect(tabPositions[1].left).toBeGreaterThan(tabPositions[0].left);
  });

});
