import { expect, Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Credentials (matching the backend seed script)
// ---------------------------------------------------------------------------
const USER_EMAIL = 'test@grimoire.test';
const USER_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@grimoire.test';
const ADMIN_PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function logout(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Grimoire e2e', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // -------------------------------------------------------------------------
  // 1. Application starts — page loads and shows the login screen
  // -------------------------------------------------------------------------
  test('shows the login screen on first visit', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Grimoire' })).toBeVisible();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 2. Regular user can log in
  // -------------------------------------------------------------------------
  test('regular user can log in and lands on the library', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASSWORD);

    await page.waitForURL('**/library');
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 3. User can navigate from the library to a game detail page
  // -------------------------------------------------------------------------
  test('user can navigate from the library to a game detail page', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/library');

    const firstCard = page.locator('a[href^="/games/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    const cardTitle = await firstCard.locator('h3').innerText();
    await firstCard.click();

    await page.waitForURL('**/games/**');
    await expect(page.getByRole('heading', { name: cardTitle, level: 1 })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 4. Regular user cannot open admin routes — redirected away
  // -------------------------------------------------------------------------
  test('regular user is redirected away from admin routes', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/library');

    await page.goto('/admin/dashboard');

    await page.waitForURL('**/library');
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Admin' })).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 5. Admin can open the dashboard page
  // -------------------------------------------------------------------------
  test('admin can log in and open the admin dashboard', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.waitForURL('**/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create user' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Data isolation
// ---------------------------------------------------------------------------

const USER1_EMAIL = 'test@grimoire.test';
const USER1_PASSWORD = 'password123';
const USER1_GAME = 'Hollow Knight';

const USER2_EMAIL = 'test2@grimoire.test';
const USER2_PASSWORD = 'password123';
const USER2_GAME = 'Celeste';

test.describe('Data isolation', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('users only see their own games and sessions', async ({ page }) => {
    // ------------------------------------------------------------------
    // User 1
    // ------------------------------------------------------------------
    await login(page, USER1_EMAIL, USER1_PASSWORD);
    await page.waitForURL('**/library');

    // User 1's own game must be visible before asserting the other is not.
    await expect(page.getByText(USER1_GAME)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(USER2_GAME)).not.toBeVisible({ timeout: 3_000 });

    // Navigate to the Hollow Knight detail page by clicking its card.
    const user1Card = page.locator('a[href^="/games/"]').filter({ hasText: USER1_GAME }).first();
    await expect(user1Card).toBeVisible({ timeout: 10_000 });
    await user1Card.click();
    await page.waitForURL('**/games/**');

    // Sessions section is present on the detail page.
    const sessionsHeading = page.getByRole('heading', { name: 'Sessions', level: 2 });
    await expect(sessionsHeading).toBeVisible({ timeout: 10_000 });

    // At least one session row should exist (seed data guarantees one).
    const sessionRows = page.locator('div').filter({ hasText: /\d+ min/ }).first();
    await expect(sessionRows).toBeVisible({ timeout: 10_000 });

    // No session rows should carry user 2's game title.
    await expect(page.getByText(USER2_GAME)).not.toBeVisible({ timeout: 3_000 });

    // ------------------------------------------------------------------
    // Switch to User 2
    // ------------------------------------------------------------------
    await logout(page);

    await login(page, USER2_EMAIL, USER2_PASSWORD);
    await page.waitForURL('**/library');

    // User 2's own game must be visible before asserting the other is not.
    await expect(page.getByText(USER2_GAME)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(USER1_GAME)).not.toBeVisible({ timeout: 3_000 });

    // Navigate to the Celeste detail page by clicking its card.
    const user2Card = page.locator('a[href^="/games/"]').filter({ hasText: USER2_GAME }).first();
    await expect(user2Card).toBeVisible({ timeout: 10_000 });
    await user2Card.click();
    await page.waitForURL('**/games/**');

    // Sessions section is present on the detail page.
    await expect(page.getByRole('heading', { name: 'Sessions', level: 2 })).toBeVisible({ timeout: 10_000 });

    // At least one session row should exist (seed data guarantees one).
    await expect(page.locator('div').filter({ hasText: /\d+ min/ }).first()).toBeVisible({ timeout: 10_000 });

    // No session rows should carry user 1's game title.
    await expect(page.getByText(USER1_GAME)).not.toBeVisible({ timeout: 3_000 });
  });
});