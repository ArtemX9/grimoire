/*
  Warnings:

  - Made the column `platformId` on table `UserGame` required. This step will fail if there are existing NULL values in that column.
  - Made the column `platformId` on table `UserPlatform` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserGame" ALTER COLUMN "platformId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserPlatform" ALTER COLUMN "platformId" SET NOT NULL;
