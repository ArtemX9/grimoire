-- CreateTable
CREATE TABLE "PlatformsTokens" (
    "id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "dateFrame" INTEGER NOT NULL,
    "dateSet" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformsTokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlatformsTokens" ADD CONSTRAINT "PlatformsTokens_id_fkey" FOREIGN KEY ("id") REFERENCES "Platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
