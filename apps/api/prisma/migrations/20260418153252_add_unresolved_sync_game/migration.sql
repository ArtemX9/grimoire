-- CreateEnum
CREATE TYPE "UnmappedReason" AS ENUM ('DUPLICATE_MATCH', 'LOW_CONFIDENCE', 'NO_MATCH');

-- CreateTable
CREATE TABLE "UnmappedSyncedGame" (
    "id" TEXT NOT NULL,
    "syncedGameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" "UnmappedReason" NOT NULL,
    "isMapped" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnmappedSyncedGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnmappedSyncedGame_syncedGameId_key" ON "UnmappedSyncedGame"("syncedGameId");

-- AddForeignKey
ALTER TABLE "UnmappedSyncedGame" ADD CONSTRAINT "UnmappedSyncedGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnmappedSyncedGame" ADD CONSTRAINT "UnmappedSyncedGame_syncedGameId_fkey" FOREIGN KEY ("syncedGameId") REFERENCES "SyncedGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
