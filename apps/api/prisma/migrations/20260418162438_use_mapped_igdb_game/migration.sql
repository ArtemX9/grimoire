-- AlterTable
ALTER TABLE "UnmappedSyncedGame" ADD COLUMN     "igdbGameId" INTEGER;

-- AddForeignKey
ALTER TABLE "UnmappedSyncedGame" ADD CONSTRAINT "UnmappedSyncedGame_igdbGameId_fkey" FOREIGN KEY ("igdbGameId") REFERENCES "IGDBGame"("igdbId") ON DELETE SET NULL ON UPDATE SET NULL;
