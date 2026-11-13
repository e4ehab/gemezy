CREATE TABLE "saved_collection_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_collection_item_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_collection_item_user_location_key"
ON "saved_collection_item"("userId", "locationId");

CREATE INDEX "saved_collection_item_userId_createdAt_idx"
ON "saved_collection_item"("userId", "createdAt");

ALTER TABLE "saved_collection_item"
ADD CONSTRAINT "saved_collection_item_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_collection_item"
ADD CONSTRAINT "saved_collection_item_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "saved_location"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
