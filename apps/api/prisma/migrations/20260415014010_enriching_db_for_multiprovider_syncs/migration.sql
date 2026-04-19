-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "igdbGameId" TEXT;

-- CreateTable
CREATE TABLE "IGDBGame" (
    "id" TEXT NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "genres" TEXT[],
    "summary" TEXT,
    "storyLine" TEXT,
    "releaseDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IGDBGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedGame" (
    "id" TEXT NOT NULL,
    "platformId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalTitle" TEXT NOT NULL,
    "coverUrl" TEXT,
    "summary" TEXT,

    CONSTRAINT "SyncedGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGamePlatform" (
    "id" TEXT NOT NULL,
    "userGameId" TEXT NOT NULL,
    "syncedGameId" TEXT NOT NULL,

    CONSTRAINT "UserGamePlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IGDBGame_igdbId_key" ON "IGDBGame"("igdbId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedGame_platformId_externalId_key" ON "SyncedGame"("platformId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamePlatform_userGameId_syncedGameId_key" ON "UserGamePlatform"("userGameId", "syncedGameId");

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_igdbGameId_fkey" FOREIGN KEY ("igdbGameId") REFERENCES "IGDBGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedGame" ADD CONSTRAINT "SyncedGame_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamePlatform" ADD CONSTRAINT "UserGamePlatform_userGameId_fkey" FOREIGN KEY ("userGameId") REFERENCES "UserGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamePlatform" ADD CONSTRAINT "UserGamePlatform_syncedGameId_fkey" FOREIGN KEY ("syncedGameId") REFERENCES "SyncedGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
