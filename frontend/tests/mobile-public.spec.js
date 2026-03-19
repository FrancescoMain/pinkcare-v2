import { test, expect } from '@playwright/test';

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

// Helper: check interactive elements have adequate touch targets (>= 44px)
async function checkTouchTargets(page) {
  const smallTargets = await page.evaluate(() => {
    const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
    const problems = [];
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Skip hidden/offscreen elements
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.top > window.innerHeight * 2) return;
      if (rect.height < 44 && rect.width < 44) {
        const text = el.textContent?.trim().substring(0, 40) || el.tagName;
        problems.push({
          element: text,
          tag: el.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    });
    return problems;
  });
  // Log warnings but don't fail - just report
  if (smallTargets.length > 0) {
    console.warn(`[WARN] ${smallTargets.length} elements with small touch targets:`, JSON.stringify(smallTargets.slice(0, 10)));
  }
}

// Helper: check text readability (font-size >= 12px for main content)
async function checkTextReadability(page) {
  const smallText = await page.evaluate(() => {
    const elements = document.querySelectorAll('p, span, a, li, td, th, label, h1, h2, h3, h4, h5, h6');
    const problems = [];
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const rect = el.getBoundingClientRect();
      // Skip hidden elements
      if (rect.width === 0 || rect.height === 0) return;
      if (fontSize < 12 && el.textContent?.trim().length > 0) {
        problems.push({
          text: el.textContent.trim().substring(0, 30),
          fontSize: fontSize,
          tag: el.tagName,
        });
      }
    });
    return problems;
  });
  if (smallText.length > 0) {
    console.warn(`[WARN] ${smallText.length} elements with font-size < 12px:`, JSON.stringify(smallText.slice(0, 10)));
  }
}

// Helper: check elements are not clipped or overflowing
// Excludes Bootstrap .row elements (negative margins are by design) and their direct col children
async function checkElementsNotOverflowing(page) {
  const overflows = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const elements = document.querySelectorAll('div, section, nav, main, article, form, table');
    const problems = [];
    elements.forEach((el) => {
      // Skip Bootstrap .row elements and their col children - negative margins are by design
      const cls = el.className?.toString() || '';
      if (cls.includes('row') || cls.match(/col-(xs|sm|md|lg|xl)-/)) return;
      // Skip elements whose parent is a .row (col elements)
      const parentCls = el.parentElement?.className?.toString() || '';
      if (parentCls.includes('row')) return;

      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 5) { // 5px tolerance
        const id = el.id || cls.substring(0, 30) || el.tagName;
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

// Full mobile check suite for a page
async function runMobileChecks(page) {
  await checkNoHorizontalOverflow(page);
  await checkImagesWithinViewport(page);
  await checkTouchTargets(page);
  await checkTextReadability(page);
  await checkElementsNotOverflowing(page);
}

test.describe('Mobile - Public Pages', () => {

  test('Home page (/) is mobile friendly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/home-mobile.png', fullPage: true });
  });

  test('Login page (/login) is mobile friendly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/login-mobile.png', fullPage: true });
  });

  test('About page (/about) is mobile friendly', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/about-mobile.png', fullPage: true });
  });

  test('Accreditation page (/accreditation) is mobile friendly', async ({ page }) => {
    await page.goto('/accreditation');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/accreditation-mobile.png', fullPage: true });
  });

  test('Disclosure page (/disclosure) is mobile friendly', async ({ page }) => {
    await page.goto('/disclosure');
    await page.waitForLoadState('networkidle');
    await runMobileChecks(page);
    await page.screenshot({ path: 'test-results/screenshots/disclosure-mobile.png', fullPage: true });
  });

});
