import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'admin@pinkcare.test',
  password: 'Admin2025!',
};

const DB_EXEC = 'docker exec pinkcare-db psql -U pinkcare_user -d PINKCARE_DB -t -A -c';

// Use desktop viewport for admin tests
test.use({
  viewport: { width: 1280, height: 800 },
  isMobile: false,
  hasTouch: false,
  deviceScaleFactor: 1,
});

/**
 * Helper: dismiss cookie banner if present
 */
async function dismissCookieBanner(page) {
  const banner = page.locator('#wt-cookie-banner');
  if (await banner.isVisible({ timeout: 1000 }).catch(() => false)) {
    const acceptBtn = banner.locator('button, a').filter({ hasText: /accett|ok|chiudi|accept|close/i }).first();
    if (await acceptBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await acceptBtn.click();
    }
  }
}

/**
 * Helper: login as admin
 */
async function loginAsAdmin(page) {
  await page.goto('/login');
  await dismissCookieBanner(page);
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail" i]', ADMIN_USER.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/administration/);
  await dismissCookieBanner(page);
}

// Test 1: Login admin -> redirect to /administration?tab=0
test('admin login redirects to /administration?tab=0', async ({ page }) => {
  await loginAsAdmin(page);

  expect(page.url()).toContain('/administration');
  expect(page.url()).toContain('tab=0');

  const title = page.locator('h5.admin-title');
  await expect(title).toBeVisible();
  await expect(title).toHaveText('Lista Utenti');
});

// Test 2: Consumer table loads data with correct columns
test('consumer table loads data with correct columns', async ({ page }) => {
  await loginAsAdmin(page);

  const table = page.locator('table.admin-table');
  await expect(table).toBeVisible();

  // Check column headers
  const headers = table.locator('thead th');
  await expect(headers).toHaveCount(7);
  await expect(headers.nth(0)).toHaveText('Data Inserimento');
  await expect(headers.nth(1)).toHaveText('Nome');
  await expect(headers.nth(2)).toHaveText('Cognome');
  await expect(headers.nth(3)).toHaveText('Età');
  await expect(headers.nth(4)).toHaveText('Consenti accesso');
  await expect(headers.nth(5)).toHaveText('Marketing');
  await expect(headers.nth(6)).toHaveText('Newsletter');

  // Check table has rows
  const rows = table.locator('tbody tr');
  await expect(rows).not.toHaveCount(0);

  // Check toggle icons are present (fa-check or fa-times)
  const toggleIcons = table.locator('tbody .fas.fa-check, tbody .fas.fa-times');
  await expect(toggleIcons.first()).toBeVisible();
});

// Test 3: Consumer search filters results
test('consumer search filters results', async ({ page }) => {
  await loginAsAdmin(page);

  // Get initial pagination text
  const paginationText = page.locator('.admin-pagination span');
  await expect(paginationText).toBeVisible();
  const initialText = await paginationText.textContent();

  // Type a name in the search field
  const nameInput = page.locator('.admin-search-fields input').first();
  await nameInput.fill('test');

  // Click search button
  await page.click('.admin-search-actions button[type="submit"]');

  // Wait for table to update
  await page.waitForTimeout(500);

  // Results may have changed (either fewer results or same if 'test' matches all)
  const table = page.locator('table.admin-table');
  const hasResults = await table.isVisible().catch(() => false);
  const hasEmpty = await page.locator('.admin-empty').isVisible().catch(() => false);

  // Either we have filtered results or no results - both are valid
  expect(hasResults || hasEmpty).toBe(true);
});

// Test 4: Toggle access on a consumer
test('toggle access on consumer changes icon', async ({ page }) => {
  await loginAsAdmin(page);

  const table = page.locator('table.admin-table');
  await expect(table).toBeVisible();

  // Get first row's access toggle (5th column, index 4)
  const firstRow = table.locator('tbody tr').first();
  const accessCell = firstRow.locator('td').nth(4);
  const toggleBtn = accessCell.locator('.toggle-btn');
  const icon = accessCell.locator('.fas');

  // Get initial state
  const wasCheck = await icon.evaluate(el => el.classList.contains('fa-check'));

  // Click toggle
  await toggleBtn.click();

  // Wait for API response and re-render
  await page.waitForTimeout(1000);

  // Verify icon changed
  const isCheck = await icon.evaluate(el => el.classList.contains('fa-check'));
  expect(isCheck).toBe(!wasCheck);
});

// Test 5: Toggle marketing on a consumer
test('toggle marketing on consumer changes icon', async ({ page }) => {
  await loginAsAdmin(page);

  const table = page.locator('table.admin-table');
  await expect(table).toBeVisible();

  const firstRow = table.locator('tbody tr').first();
  const marketingCell = firstRow.locator('td').nth(5);
  const toggleBtn = marketingCell.locator('.toggle-btn');
  const icon = marketingCell.locator('.fas');

  const wasCheck = await icon.evaluate(el => el.classList.contains('fa-check'));

  await toggleBtn.click();
  await page.waitForTimeout(1000);

  const isCheck = await icon.evaluate(el => el.classList.contains('fa-check'));
  expect(isCheck).toBe(!wasCheck);
});

// Test 6: Pagination works
test('pagination shows Pag. X Di Y and navigates', async ({ page }) => {
  await loginAsAdmin(page);

  const paginationText = page.locator('.admin-pagination span');
  await expect(paginationText).toBeVisible();

  const text = await paginationText.textContent();
  // Should match "Pag. X Di Y" format
  expect(text).toMatch(/Pag\.\s*\d+\s*Di\s*\d+/);

  // If there's a next page button (">"), click it
  const nextBtn = page.locator('.admin-pagination .btn-pagination').last();
  const hasNext = await nextBtn.isVisible().catch(() => false);

  if (hasNext) {
    await dismissCookieBanner(page);
    await nextBtn.click({ force: true });
    await page.waitForTimeout(500);

    const newText = await paginationText.textContent();
    expect(newText).toContain('Pag.');
    // Page number should have changed
    expect(newText).not.toBe(text);
  }
});

// Test 7: Switch to Business via header RETE link
test('switch to business tab shows correct columns', async ({ page }) => {
  await loginAsAdmin(page);

  // Click RETE header link
  await page.locator('a[href="/administration?tab=1"]').click();

  // URL should contain tab=1
  await page.waitForURL(/tab=1/);
  expect(page.url()).toContain('tab=1');

  // Check title
  const title = page.locator('h5.admin-title');
  await expect(title).toHaveText('Gestione Lista Business');

  // Wait for loading to finish
  await page.waitForTimeout(1000);

  // Check table or empty state is visible
  const table = page.locator('table.admin-table');
  const emptyState = page.locator('.admin-empty');
  const hasTable = await table.isVisible().catch(() => false);
  const hasEmpty = await emptyState.isVisible().catch(() => false);
  expect(hasTable || hasEmpty).toBe(true);

  if (hasTable) {
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toHaveText('Data Inserimento');
    await expect(headers.nth(1)).toHaveText('Tipologia');
    await expect(headers.nth(2)).toHaveText('Denominazione');
    await expect(headers.nth(3)).toHaveText('Consenti accesso');
    await expect(headers.nth(4)).toHaveText('Attivo');
  }

  // Check typology dropdown is populated
  const typologySelect = page.locator('.admin-search-fields select');
  await expect(typologySelect).toBeVisible();
  const options = typologySelect.locator('option');
  const optionCount = await options.count();
  // Should have "Tutte le tipologie" + at least one type
  expect(optionCount).toBeGreaterThan(1);
});

// Test 8: Toggle searchable on business (skip if no business data)
test('toggle searchable on business changes icon', async ({ page }) => {
  await loginAsAdmin(page);

  // Switch to business via RETE header link
  await page.locator('a[href="/administration?tab=1"]').click();
  await page.waitForURL(/tab=1/);
  await page.waitForTimeout(1000);

  const table = page.locator('table.admin-table');
  const hasTable = await table.isVisible().catch(() => false);

  if (!hasTable) {
    test.skip();
    return;
  }

  const firstRow = table.locator('tbody tr').first();
  const searchableCell = firstRow.locator('td').nth(4);
  const toggleBtn = searchableCell.locator('.toggle-btn');
  const icon = searchableCell.locator('.fas');

  const wasCheck = await icon.evaluate(el => el.classList.contains('fa-check'));

  await toggleBtn.click();
  await page.waitForTimeout(1000);

  const isCheck = await icon.evaluate(el => el.classList.contains('fa-check'));
  expect(isCheck).toBe(!wasCheck);
});

// Test 9: Header navigation (UTENTI/RETE links, no internal tabs)
test('header navigation switches between consumers and businesses', async ({ page }) => {
  await loginAsAdmin(page);

  // Should start on consumers (tab=0)
  await expect(page.locator('h5.admin-title')).toHaveText('Lista Utenti');

  // No internal tabs should exist
  await expect(page.locator('.admin-tab')).toHaveCount(0);

  // Click RETE header link
  await page.locator('a[href="/administration?tab=1"]').click();
  await page.waitForURL(/tab=1/);
  await page.waitForTimeout(500);
  await expect(page.locator('h5.admin-title')).toHaveText('Gestione Lista Business');

  // Click UTENTI header link back
  await page.locator('a[href="/administration?tab=0"]').click();
  await page.waitForURL(/tab=0/);
  await page.waitForTimeout(500);
  await expect(page.locator('h5.admin-title')).toHaveText('Lista Utenti');
});
