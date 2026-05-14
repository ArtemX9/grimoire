import { GameStatus, Genre, Platform, UnmappedReasons } from '@grimoire/shared';
import { Page, expect, test } from '@playwright/test';

import { generateIgdbGame, generateUnmappedGame, generateUserGame } from '@/test';

// ---------------------------------------------------------------------------
// Credentials (matching the backend seed script)
// ---------------------------------------------------------------------------
const USER_EMAIL = 'test@grimoire.test';
const USER_PASSWORD = 'password123';

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
// Shared IGDB mock result — used in both tests below.
// ---------------------------------------------------------------------------
const IGDB_RESULT = generateIgdbGame({
  id: 119133,
  name: 'Elden Ring',
  cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co4jni.jpg',
  genres: [Genre.RPG, Genre.Action],
  summary: 'An action RPG developed by FromSoftware.',
});

// ---------------------------------------------------------------------------
// Helper — returns true when the URL is the /games list endpoint (not a
// sub-path like /games/stats or /games/:id).
// ---------------------------------------------------------------------------
function isGamesListUrl(url: URL): boolean {
  return /\/api\/v1\/games$/.test(url.pathname) || /\/api\/v1\/games\?/.test(url.href);
}

// ---------------------------------------------------------------------------
// Test 1 — Mapping an unmapped Xbox game (not yet in library)
//
// Flow:
//   - Set up mocks; navigate to /unmapped-games (mock returns an Xbox game row).
//   - Click "Map manually".
//   - Mock IGDB search → pick a result.
//   - Mock POST /unmapped-games/map/:id → success.
//   - Assert: game disappears from unmapped list (filtered out via setQueriesData).
//   - Navigate to /library.
//   - Assert: game card appears with an Xbox platform icon.
// ---------------------------------------------------------------------------

test.describe('Unmapped games — mapping a new game', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('mapping an unmapped Xbox game removes it from the list and adds it to the library with Xbox icon', async ({ page }) => {
    const UNMAPPED_GAME_ID = 'unmapped-xbox-001';
    const UNMAPPED_GAME_TITLE = 'Forza Horizon 5';

    const xboxUnmappedGame = generateUnmappedGame({
      id: UNMAPPED_GAME_ID,
      syncedGameTitle: UNMAPPED_GAME_TITLE,
      reason: UnmappedReasons.NO_MATCH,
      platform: { id: 3, platform: Platform.Xbox },
      isMapped: false,
    });

    const mappedGame = generateUserGame({
      igdbID: IGDB_RESULT.id,
      title: IGDB_RESULT.name,
      coverURL: IGDB_RESULT.cover,
      genres: IGDB_RESULT.genres as Genre[],
      summary: IGDB_RESULT.summary,
      isMappedManually: true,
      status: GameStatus.BACKLOG,
      platforms: [
        {
          platformID: 3,
          platformName: Platform.Xbox,
          externalID: 'xbox-title-id-001',
          externalTitle: UNMAPPED_GAME_TITLE,
        },
      ],
    });

    // -----------------------------------------------------------------------
    // 1. Log in and wait for the library to load.
    // -----------------------------------------------------------------------
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/');

    // -----------------------------------------------------------------------
    // 2. Register all route mocks BEFORE navigating to /unmapped-games so
    //    the initial data fetch for that page is intercepted correctly.
    //
    //    Route registration order matters: Playwright evaluates handlers
    //    last-registered-first (LIFO). The most-specific routes (map endpoint,
    //    IGDB search) are registered last so they take priority over the
    //    broader unmapped-games catch-all.
    // -----------------------------------------------------------------------

    // Games list — always returns the newly mapped game (library view).
    await page.route('**/api/v1/games**', (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && isGamesListUrl(url)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mappedGame]),
        });
      } else {
        route.continue();
      }
    });

    // Unmapped games list — returns the single Xbox game.
    await page.route('**/api/v1/unmapped-games**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([xboxUnmappedGame]),
      });
    });

    // IGDB search — registered after the broader unmapped-games route so it
    // takes priority for search requests.
    await page.route('**/api/v1/igdb/search*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([IGDB_RESULT]),
      });
    });

    // Map endpoint — registered last (highest priority). Method-guarded so
    // unmatched methods pass through.
    await page.route(`**/api/v1/unmapped-games/map/${UNMAPPED_GAME_ID}`, (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        route.continue();
      }
    });

    // -----------------------------------------------------------------------
    // 3. Navigate to the unmapped games page and verify the Xbox row appears.
    // -----------------------------------------------------------------------
    await page.goto('/unmapped-games');
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 4. Click "Map manually" on the Xbox row.
    // -----------------------------------------------------------------------
    await page
      .getByRole('button', { name: /Map manually/i })
      .first()
      .click();

    // -----------------------------------------------------------------------
    // 5. The IGDB search dialog must now be open.
    // -----------------------------------------------------------------------
    const mapDialog = page.getByRole('dialog').first();
    await expect(mapDialog).toBeVisible({ timeout: 10_000 });

    const searchInput = mapDialog.getByPlaceholder(/Search IGDB/i).first();
    await expect(searchInput).toBeVisible();

    // Clear the pre-filled title and type a search term.
    await searchInput.clear();
    await searchInput.fill('Elden Ring');

    // -----------------------------------------------------------------------
    // 6. Wait for the mocked IGDB result and click it.
    //    The dialog debounces the query by 1 000 ms before fetching.
    // -----------------------------------------------------------------------
    const firstResult = mapDialog
      .locator('button')
      .filter({ hasText: /Elden Ring/i })
      .first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
    await firstResult.click();

    // -----------------------------------------------------------------------
    // 7. Confirm the mapping.
    //    The actionButtonTitle passed to the dialog is 'Map game'.
    // -----------------------------------------------------------------------
    const confirmButton = mapDialog.getByRole('button', { name: /^Map game$/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // -----------------------------------------------------------------------
    // 8. Assert: the Xbox row disappears from the unmapped list.
    //    useMapUnmappedGame.onSuccess calls setQueriesData to filter it out.
    // -----------------------------------------------------------------------
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).not.toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 9. Navigate to /library and assert the game appears with an Xbox icon.
    //    PlatformIcon renders <svg aria-hidden> for every platform entry.
    // -----------------------------------------------------------------------
    await page.goto('/');
    await page.waitForURL('**/');

    const libraryCard = page.locator('a[href^="/games/"]').filter({ hasText: IGDB_RESULT.name }).first();
    await expect(libraryCard).toBeVisible({ timeout: 10_000 });

    await expect(libraryCard.locator('svg[aria-hidden]').first()).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Mapping an unmapped Xbox game onto an existing PSN library entry
//
// Flow:
//   - Set up mocks; navigate to /unmapped-games (mock returns an Xbox game).
//   - Click "Map manually".
//   - Mock IGDB search returns a game whose igdbID already exists in the
//     library as a PlayStation entry.
//   - Mock POST /unmapped-games/map/:id → success.
//   - Assert: game disappears from unmapped list.
//   - Navigate to /library; find the existing game card.
//   - Assert: card now shows both PlayStation and Xbox platform icons.
// ---------------------------------------------------------------------------

test.describe('Unmapped games — mapping onto an existing library entry', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('mapping an unmapped Xbox game onto an existing PSN entry adds Xbox platform icon alongside PSN icon', async ({ page }) => {
    const UNMAPPED_GAME_ID = 'unmapped-xbox-002';
    const UNMAPPED_GAME_TITLE = 'Elden Ring';
    const EXISTING_GAME_ID = 'existing-psn-game-001';
    const SHARED_IGDB_ID = 119133;

    const xboxUnmappedGame = generateUnmappedGame({
      id: UNMAPPED_GAME_ID,
      syncedGameTitle: UNMAPPED_GAME_TITLE,
      reason: UnmappedReasons.LOW_CONFIDENCE,
      platform: { id: 3, platform: Platform.Xbox },
      isMapped: false,
    });

    const existingPsnGame = generateUserGame({
      id: EXISTING_GAME_ID,
      igdbID: SHARED_IGDB_ID,
      title: 'Elden Ring',
      coverURL: IGDB_RESULT.cover,
      genres: IGDB_RESULT.genres as Genre[],
      summary: IGDB_RESULT.summary,
      status: GameStatus.PLAYING,
      playtimeHours: 30,
      platforms: [{ platformID: 2, platformName: Platform.PlayStation, externalID: 'psn-title-001', externalTitle: 'ELDEN RING' }],
    });

    // After mapping, the same library entry gains the Xbox platform.
    const mergedGame = generateUserGame({
      ...existingPsnGame,
      platforms: [
        { platformID: 2, platformName: Platform.PlayStation, externalID: 'psn-title-001', externalTitle: 'ELDEN RING' },
        { platformID: 3, platformName: Platform.Xbox, externalID: 'xbox-title-id-002', externalTitle: UNMAPPED_GAME_TITLE },
      ],
    });

    // -----------------------------------------------------------------------
    // 1. Log in and wait for the library to load.
    // -----------------------------------------------------------------------
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/');

    // -----------------------------------------------------------------------
    // 2. Register all mocks BEFORE navigating to /unmapped-games.
    //
    //    The games list mock flips after the map POST succeeds: before mapping
    //    it returns the PSN-only entry; after mapping it returns the merged
    //    game with both platform icons.
    // -----------------------------------------------------------------------
    let isMapped = false;
    await page.route('**/api/v1/games**', (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && isGamesListUrl(url)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isMapped ? [mergedGame] : [existingPsnGame]),
        });
      } else {
        route.continue();
      }
    });

    // Unmapped games list — returns the single Xbox game.
    await page.route('**/api/v1/unmapped-games**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([xboxUnmappedGame]),
      });
    });

    // IGDB search — same Elden Ring result (igdbID matches the PSN library entry).
    await page.route('**/api/v1/igdb/search*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([IGDB_RESULT]),
      });
    });

    // Map endpoint — registered last for highest priority.
    await page.route(`**/api/v1/unmapped-games/map/${UNMAPPED_GAME_ID}`, (route) => {
      if (route.request().method() === 'POST') {
        isMapped = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        route.continue();
      }
    });

    // -----------------------------------------------------------------------
    // 3. Navigate to the unmapped games page.
    // -----------------------------------------------------------------------
    await page.goto('/unmapped-games');
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 4. Click "Map manually".
    // -----------------------------------------------------------------------
    await page
      .getByRole('button', { name: /Map manually/i })
      .first()
      .click();

    // -----------------------------------------------------------------------
    // 5. The dialog opens.
    // -----------------------------------------------------------------------
    const mapDialog = page.getByRole('dialog').first();
    await expect(mapDialog).toBeVisible({ timeout: 10_000 });

    const searchInput = mapDialog.getByPlaceholder(/Search IGDB/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.clear();
    await searchInput.fill('Elden Ring');

    // -----------------------------------------------------------------------
    // 6. Select the IGDB result — its igdbID matches the existing PSN entry.
    // -----------------------------------------------------------------------
    const firstResult = mapDialog
      .locator('button')
      .filter({ hasText: /Elden Ring/i })
      .first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
    await firstResult.click();

    // -----------------------------------------------------------------------
    // 7. Confirm the mapping.
    // -----------------------------------------------------------------------
    const confirmButton = mapDialog.getByRole('button', { name: /^Map game$/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // -----------------------------------------------------------------------
    // 8. The dialog closes and the unmapped row disappears.
    // -----------------------------------------------------------------------
    await expect(mapDialog).not.toBeVisible({ timeout: 10_000 });
    const unmappedRow = page.locator('button').filter({ hasText: UNMAPPED_GAME_TITLE });
    await expect(unmappedRow).not.toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 9. Navigate to /library. The cache invalidation from onSuccess triggers
    //    a re-fetch of the games list; the mock returns mergedGame on the
    //    second call, so the card now carries both platform entries.
    // -----------------------------------------------------------------------
    await page.goto('/');
    await page.waitForURL('**/');

    const libraryCard = page.locator('a[href^="/games/"]').filter({ hasText: 'Elden Ring' }).first();
    await expect(libraryCard).toBeVisible({ timeout: 10_000 });

    // renderPlatformIcons in GameCard maps game.platforms to <PlatformIcon>,
    // each rendering a single <svg aria-hidden>. Two platforms → two SVGs.
    const platformIcons = libraryCard.locator('svg[aria-hidden]');
    await expect(platformIcons).toHaveCount(2, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Deleting an unmapped game (cancel and confirm flows)
//
// Flow A (cancel):
//   - Navigate to /unmapped-games (mock returns one Xbox game).
//   - Click the Trash2 delete icon.
//   - Confirmation dialog appears.
//   - Click "Cancel".
//   - Assert: the game row is still visible.
//   - Assert: DELETE /unmapped-games/:id was NOT called.
//
// Flow B (confirm delete):
//   - Navigate to /unmapped-games (mock returns one Xbox game).
//   - Mock DELETE /unmapped-games/:id → 200.
//   - Mock GET /api/v1/games** → empty array.
//   - Click the Trash2 icon; confirmation dialog appears.
//   - Click "Delete".
//   - Assert: the game row disappears from the unmapped list.
//   - Navigate to /library.
//   - Assert: the game title is NOT present in the library.
// ---------------------------------------------------------------------------

test.describe('Unmapped games — deleting a game', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('clicking Cancel in the delete dialog keeps the game in the list without calling DELETE', async ({ page }) => {
    const UNMAPPED_GAME_ID = 'unmapped-xbox-cancel-001';
    const UNMAPPED_GAME_TITLE = 'Halo Infinite';

    const xboxUnmappedGame = generateUnmappedGame({
      id: UNMAPPED_GAME_ID,
      syncedGameTitle: UNMAPPED_GAME_TITLE,
      reason: UnmappedReasons.NO_MATCH,
      platform: { id: 3, platform: Platform.Xbox },
      isMapped: false,
    });

    // -----------------------------------------------------------------------
    // 1. Log in and wait for the library to load.
    // -----------------------------------------------------------------------
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/');

    // -----------------------------------------------------------------------
    // 2. Register mocks BEFORE navigating; track DELETE calls via a flag.
    // -----------------------------------------------------------------------
    let deleteWasCalled = false;

    await page.route(`**/api/v1/unmapped-games/${UNMAPPED_GAME_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteWasCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        route.continue();
      }
    });

    // Unmapped games list — returns the single Xbox game.
    await page.route('**/api/v1/unmapped-games**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([xboxUnmappedGame]),
      });
    });

    // -----------------------------------------------------------------------
    // 3. Navigate to /unmapped-games and verify the row is visible.
    // -----------------------------------------------------------------------
    await page.goto('/unmapped-games');
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 4. Click the Trash2 delete icon.
    // -----------------------------------------------------------------------
    await page
      .getByRole('button', { name: /Delete game/i })
      .first()
      .click();

    // -----------------------------------------------------------------------
    // 5. Confirmation dialog must appear.
    // -----------------------------------------------------------------------
    const confirmDialog = page.getByRole('alertdialog').first();
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 6. Click "Cancel".
    // -----------------------------------------------------------------------
    await confirmDialog.getByRole('button', { name: /^Cancel$/i }).click();

    // -----------------------------------------------------------------------
    // 7. Assert: dialog is gone and game row is still visible.
    // -----------------------------------------------------------------------
    await expect(confirmDialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).toBeVisible({ timeout: 5_000 });

    // -----------------------------------------------------------------------
    // 8. Assert: DELETE was never called.
    // -----------------------------------------------------------------------
    expect(deleteWasCalled).toBe(false);
  });

  test('clicking Delete in the confirm dialog removes the game from the unmapped list and library', async ({ page }) => {
    const UNMAPPED_GAME_ID = 'unmapped-xbox-delete-001';
    const UNMAPPED_GAME_TITLE = 'Forza Motorsport';

    const xboxUnmappedGame = generateUnmappedGame({
      id: UNMAPPED_GAME_ID,
      syncedGameTitle: UNMAPPED_GAME_TITLE,
      reason: UnmappedReasons.NO_MATCH,
      platform: { id: 3, platform: Platform.Xbox },
      isMapped: false,
    });

    // -----------------------------------------------------------------------
    // 1. Log in and wait for the library to load.
    // -----------------------------------------------------------------------
    await login(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('**/');

    // -----------------------------------------------------------------------
    // 2. Register all mocks BEFORE navigating to /unmapped-games.
    //
    //    Route registration order matters: Playwright evaluates handlers
    //    last-registered-first (LIFO). The most-specific route (the DELETE
    //    endpoint) is registered last so it takes priority over the broader
    //    unmapped-games catch-all.
    // -----------------------------------------------------------------------

    // Games list — always returns an empty array (game is not in the library).
    await page.route('**/api/v1/games**', (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && isGamesListUrl(url)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.continue();
      }
    });

    // Unmapped games list catch-all — returns the single Xbox game.
    await page.route('**/api/v1/unmapped-games**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([xboxUnmappedGame]),
      });
    });

    // DELETE endpoint — registered last (highest priority).
    await page.route(`**/api/v1/unmapped-games/${UNMAPPED_GAME_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        route.continue();
      }
    });

    // -----------------------------------------------------------------------
    // 3. Navigate to /unmapped-games and verify the row is visible.
    // -----------------------------------------------------------------------
    await page.goto('/unmapped-games');
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 4. Click the Trash2 delete icon.
    // -----------------------------------------------------------------------
    await page
      .getByRole('button', { name: /Delete game/i })
      .first()
      .click();

    // -----------------------------------------------------------------------
    // 5. Confirmation dialog must appear.
    // -----------------------------------------------------------------------
    const confirmDialog = page.getByRole('alertdialog').first();
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 6. Click "Delete" to confirm.
    // -----------------------------------------------------------------------
    await confirmDialog.getByRole('button', { name: /^Delete$/i }).click();

    // -----------------------------------------------------------------------
    // 7. Assert: the game row disappears from the unmapped list.
    //    useDeleteUnmappedGame.onSuccess calls setQueriesData to filter it out.
    // -----------------------------------------------------------------------
    await expect(page.getByText(UNMAPPED_GAME_TITLE)).not.toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // 8. Navigate to /library and assert the game title is not present.
    // -----------------------------------------------------------------------
    await page.goto('/');
    await page.waitForURL('**/');

    await expect(page.getByText(UNMAPPED_GAME_TITLE)).not.toBeVisible({ timeout: 10_000 });
  });
});
