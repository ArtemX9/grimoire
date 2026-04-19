-- Populate IGDBGame table
INSERT INTO "IGDBGame" (id, "igdbId", title, "coverUrl", genres, "updatedAt")
SELECT DISTINCT ON ("igdbId")  gen_random_uuid(), "igdbId", "title", "coverUrl", "genres", NOW()  FROM "UserGame"
ON CONFLICT ("igdbId") DO NOTHING;

-- Populate SyncedGame table
INSERT INTO "SyncedGame" ("id", "platformId", "externalId", "externalTitle")
SELECT DISTINCT ON ("platformId", "externalId") gen_random_uuid(), "platformId", "externalId", "title"
FROM "UserGame"
WHERE "externalId" IS NOT NULL
ON CONFLICT ("platformId", "externalId") DO NOTHING;

-- Populate UserGamePlatform table
INSERT INTO "UserGamePlatform" ("id", "userGameId", "syncedGameId")
SELECT gen_random_uuid(), "UserGame".id, "SyncedGame".id FROM "SyncedGame"
INNER JOIN "UserGame"
  ON "SyncedGame"."platformId" = "UserGame"."platformId"
       AND "SyncedGame"."externalId" = "UserGame"."externalId"
ON CONFLICT ("userGameId", "syncedGameId") DO NOTHING;

-- Update UserGame.igdbGameId — set it to the matching IGDBGame.id
UPDATE "UserGame"
SET "igdbGameId" = "IGDBGame".id
FROM "IGDBGame"
WHERE "UserGame"."igdbId" = "IGDBGame"."igdbId";
