import { test, expect } from '@playwright/test';

// ⚠️ Replace with real test credentials
const TEST_USER = {
  email: 'TEST_EMAIL',
  password: 'TEST_PASSWORD',
};

// Helper: check no horizontal overflow on the page
async function checkNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow, 'Page should not have horizontal overflow').toBe(false);
}

// Helper: check all images fit within viewport
async function checkImagesWithinViewport(page) {
  const issues = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const viewportWidth = window.innerWidth;
    const problems = [];
    imgs.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.width > viewportWidth) {
        problems.push({
          src: img.src?.substring(0, 80),
          width: Math.round(rect.width),
          viewport: viewportWidth,
        });
      }
    });
    return problems;
  });
  expect(issues, `Images overflowing viewport: ${JSON.stringify(issues)}`).toHaveLength(0);
}

// Helper: check elements are not clipped or overflowing
async function checkElementsNotOverflowing(page) {
  const overflows = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const elements = document.querySelectorAll('div, section, nav, main, article, form, table');
    const problems = [];
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 5) {
        const id = el.id || el.className?.toString().substring(0, 30) || el.tagName;
        problems.push({
          element: id,
          right: Math.round(rect.right),
          viewport: viewportWidth,
          overflow: Math.round(rect.right - viewportWidth),
        });
      }
    });
    return problems;
  });
  expect(overflows, `Elements overflowing viewport: ${JSON.stringify(overflows.slice(0, 5))}`).toHaveLength(0);
}

// Full mobile check suite
async function runMobileChecks(page) {
  await checkNoHorizontalOverflow(page);
  await checkImagesWithinViewport(page);
  await checkElementsNotOverflowing(page);
}

// Login helper
async function loginUser(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  // Fill login form - adjust selectors as needed
  await page.fill('input[type="email"], input[name="email"], input[type="text"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForURL(/\/(home|dashboard|consumer)/, { timeout: 10000 });
}

test.describe('Mobile - Authenticated Pages', () => {

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('Dashboard (/home) is mobile friendly', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/dashboard-mobile.png', fullPage: true });
  });

  test('Profile (/profile) is mobile friendly', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/profile-mobile.png', fullPage: true });
  });

  test('Consumer (/consumer) is mobile friendly', async ({ page }) => {
    await page.goto('/consumer');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/consumer-mobile.png', fullPage: true });
  });

  test('Blog (/blog) is mobile friendly', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/blog-mobile.png', fullPage: true });
  });

  test('Forum (/forum) is mobile friendly', async ({ page }) => {
    await page.goto('/forum');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/forum-mobile.png', fullPage: true });
  });

  test('Hospitalization (/hospitalization) is mobile friendly', async ({ page }) => {
    await page.goto('/hospitalization');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/hospitalization-mobile.png', fullPage: true });
  });

  test('Document Shop (/documentshop) is mobile friendly', async ({ page }) => {
    await page.goto('/documentshop');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/documentshop-mobile.png', fullPage: true });
  });

  test('Business (/business) is mobile friendly', async ({ page }) => {
    await page.goto('/business');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/business-mobile.png', fullPage: true });
  });

});
