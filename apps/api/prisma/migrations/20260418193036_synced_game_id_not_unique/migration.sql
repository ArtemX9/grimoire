/*
  Warnings:

  - A unique constraint covering the columns `[userId,syncedGameId]` on the table `UnmappedSyncedGame` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UnmappedSyncedGame_syncedGameId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UnmappedSyncedGame_userId_syncedGameId_key" ON "UnmappedSyncedGame"("userId", "syncedGameId");
