/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `externalTitle` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `genres` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `igdbId` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `platformId` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `UserGame` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,igdbGameId]` on the table `UserGame` will be added. If there are existing duplicate values, this will fail.
  - Made the column `igdbGameId` on table `UserGame` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_igdbGameId_fkey";

-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_platformId_fkey";

-- DropIndex
DROP INDEX "UserGame_userId_igdbId_externalId_key";

-- DropIndex
DROP INDEX "UserGame_userId_igdbId_platformId_key";

-- AlterTable
ALTER TABLE "UserGame" DROP COLUMN "coverUrl",
DROP COLUMN "externalId",
DROP COLUMN "externalTitle",
DROP COLUMN "genres",
DROP COLUMN "igdbId",
DROP COLUMN "platformId",
DROP COLUMN "title",
ALTER COLUMN "igdbGameId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_userId_igdbGameId_key" ON "UserGame"("userId", "igdbGameId");

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_igdbGameId_fkey" FOREIGN KEY ("igdbGameId") REFERENCES "IGDBGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
