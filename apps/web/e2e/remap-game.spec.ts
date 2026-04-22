import { Page, expect, test } from '@playwright/test';

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
// Remap game — navigation after backend merges into existing game
//
// The backend deletes the original UserGame when all platform links move to an
// already-existing UserGame (merge scenario). In that case the remap endpoint
// returns the *existing* game with a different ID than the current URL.
// The UI must navigate to the new game's detail page instead of staying on a
// now-deleted record.
//
// Strategy:
//   - Use the real IGDB search (the live dev server is available during E2E).
//   - Mock only the remap PATCH to return a fake UserGame with a different ID,
//     simulating the "original deleted, navigate to merged target" branch.
//   - Mock GET /api/games/:newId so the merged game detail page renders.
// ---------------------------------------------------------------------------

test.describe('Remap game — navigates to merged game', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test(
    'navigates to the new game detail page when remap returns a different game ID',
    async ({ page }) => {
      // -----------------------------------------------------------------------
      // 1. Log in and wait for the library to load.
      // -----------------------------------------------------------------------
      await login(page, USER_EMAIL, USER_PASSWORD);
      await page.waitForURL('**/library');

      // -----------------------------------------------------------------------
      // 2. Pick the first game card and read its ID from the href.
      // -----------------------------------------------------------------------
      const firstCard = page.locator('a[href^="/games/"]').first();
      await expect(firstCard).toBeVisible({ timeout: 10_000 });

      const href = await firstCard.getAttribute('href');
      const originalGameID = href!.replace('/games/', '');

      // -----------------------------------------------------------------------
      // 3. Define the fake "merged" game that the backend would return when it
      //    discovers an existing UserGame already owns the chosen IGDB entry.
      //    The ID must differ from the original so the navigation branch fires.
      // -----------------------------------------------------------------------
      const newGameID = 'merged-game-id-9999';
      const newGameTitle = 'Merged Target Game';

      const fakeRemappedGame = {
        id: newGameID,
        igdbId: 1905,
        title: newGameTitle,
        coverURL: null,
        status: 'PLAYING',
        playtimeHours: 42,
        userRating: null,
        notes: null,
        moods: [],
        genres: [],
        platforms: [],
        summary: null,
        storyLine: null,
        releaseDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // -----------------------------------------------------------------------
      // 4. Intercept the remap PATCH — simulate backend returning the merged
      //    game (a different ID than the one in the current URL).
      // -----------------------------------------------------------------------
      await page.route(`**/api/v1/games/${originalGameID}/remap`, (route) => {
        if (route.request().method() === 'PATCH') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(fakeRemappedGame),
          });
        } else {
          route.continue();
        }
      });

      // -----------------------------------------------------------------------
      // 5. Intercept GET for the new game's detail page so the page renders
      //    the merged game's title instead of showing "Game not found".
      // -----------------------------------------------------------------------
      await page.route(`**/api/v1/games/${newGameID}`, (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(fakeRemappedGame),
          });
        } else {
          route.continue();
        }
      });

      // -----------------------------------------------------------------------
      // 6. Navigate to the original game's detail page.
      // -----------------------------------------------------------------------
      await firstCard.click();
      await page.waitForURL('**/games/**');

      // -----------------------------------------------------------------------
      // 7. Click "Re-map".
      //    If a platform picker dialog opens (game has multiple platforms),
      //    select the first platform entry before proceeding.
      // -----------------------------------------------------------------------
      const remapButton = page.getByRole('button', { name: /re-map/i });
      await expect(remapButton).toBeVisible({ timeout: 10_000 });
      await remapButton.click();

      // Handle the optional platform picker dialog.
      const platformPicker = page.getByRole('dialog', { name: /which platform entry to remap/i });
      const hasPlatformPicker = await platformPicker.isVisible().catch(() => false);
      if (hasPlatformPicker) {
        const firstPlatformButton = platformPicker.getByRole('button').first();
        await expect(firstPlatformButton).toBeVisible({ timeout: 5_000 });
        await firstPlatformButton.click();
      }

      // -----------------------------------------------------------------------
      // 8. The IGDB search dialog must now be open.
      // -----------------------------------------------------------------------
      const remapDialog = page.getByRole('dialog', { name: /remap game/i });
      await expect(remapDialog).toBeVisible({ timeout: 10_000 });

      // -----------------------------------------------------------------------
      // 9. Type a search term and wait for real IGDB results to appear.
      //    We search for "Elden Ring" — a well-known game that will always
      //    appear in IGDB — and click whichever result comes back first.
      // -----------------------------------------------------------------------
      const searchInput = remapDialog.getByPlaceholder(/search igdb/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Elden Ring');

      // The debounce in IGDBGameSearchDialogContainer is 1 000 ms — wait for
      // it, then wait for the results list to contain at least one item.
      const firstResult = remapDialog.locator('button').filter({ hasText: /elden ring/i }).first();
      await expect(firstResult).toBeVisible({ timeout: 10_000 });

      // -----------------------------------------------------------------------
      // 10. Click the first search result to enter the confirm step, then
      //     confirm the remap.
      // -----------------------------------------------------------------------
      await firstResult.click();

      const confirmButton = remapDialog.getByRole('button', { name: /^remap$/i });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // -----------------------------------------------------------------------
      // 11. Assert: URL must now point to the *new* game's ID.
      // -----------------------------------------------------------------------
      await page.waitForURL(`**/games/${newGameID}`, { timeout: 10_000 });
      expect(page.url()).toContain(`/games/${newGameID}`);

      // -----------------------------------------------------------------------
      // 12. Assert: the new game's title is on screen.
      // -----------------------------------------------------------------------
      await expect(page.getByRole('heading', { name: newGameTitle, level: 1 })).toBeVisible({
        timeout: 10_000,
      });

      // -----------------------------------------------------------------------
      // 13. Assert: "Game not found" is absent.
      // -----------------------------------------------------------------------
      await expect(page.getByText('Game not found')).not.toBeVisible();
    },
  );
});
