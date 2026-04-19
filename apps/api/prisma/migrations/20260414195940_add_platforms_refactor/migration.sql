/*
  Warnings:

  - You are about to drop the column `steamAppId` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `UserPlatform` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,igdbId,platformId]` on the table `UserGame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,igdbId,externalId]` on the table `UserGame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,platformId]` on the table `UserPlatform` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlatformTitle" AS ENUM ('STEAM', 'PlayStation', 'Xbox', 'PC');

-- CreateTable
CREATE TABLE "Platforms"
(
  "id"       SERIAL          NOT NULL,
  "platform" "PlatformTitle" NOT NULL,

  CONSTRAINT "Platforms_pkey" PRIMARY KEY ("id")
);

-- DropIndex
DROP INDEX "UserGame_userId_igdbId_key";

-- DropIndex
DROP INDEX "UserPlatform_userId_platform_key";

-- AlterTable
ALTER TABLE "UserGame"
  ADD COLUMN "externalId"    TEXT,
  ADD COLUMN "externalTitle" TEXT,
  ADD COLUMN "platformId"    INTEGER;

-- AlterTable
ALTER TABLE "UserPlatform"
  ADD COLUMN "platformId" INTEGER;

INSERT INTO "Platforms" (id, platform)
VALUES (1, 'STEAM');

-- Transition to externalID for all Steam-added games
UPDATE "UserGame"
SET "platformId" = 1;
UPDATE "UserGame"
SET "externalId" = "steamAppId"::TEXT
WHERE "steamAppId" IS NOT NULL;

-- Change
UPDATE "UserPlatform"
SET "platformId" = 1;

ALTER TABLE "UserGame"
  DROP COLUMN "steamAppId";
ALTER TABLE "UserPlatform"
  DROP COLUMN "platform";

-- DropEnum
DROP TYPE "Platform";

-- CreateIndex
CREATE UNIQUE INDEX "Platforms_platform_key" ON "Platforms" ("platform");

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_userId_igdbId_platformId_key" ON "UserGame" ("userId", "igdbId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_userId_igdbId_externalId_key" ON "UserGame" ("userId", "igdbId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlatform_userId_platformId_key" ON "UserPlatform" ("userId", "platformId");

-- AddForeignKey
ALTER TABLE "UserGame"
  ADD CONSTRAINT "UserGame_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platforms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlatform"
  ADD CONSTRAINT "UserPlatform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platforms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

