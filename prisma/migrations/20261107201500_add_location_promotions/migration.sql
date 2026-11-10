CREATE TYPE "LocationPromotionPlan" AS ENUM (
    'SINGLE_REFRESH',
    'SINGLE_FEATURED',
    'SINGLE_ELITE'
);

CREATE TYPE "LocationPromotionStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'CANCELED'
);

CREATE TABLE "location_promotion" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "plan" "LocationPromotionPlan" NOT NULL,
    "status" "LocationPromotionStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutReference" TEXT NOT NULL,
    "pendingUntil" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "polarOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "location_promotion_locationId_key"
ON "location_promotion"("locationId");

CREATE UNIQUE INDEX "location_promotion_checkoutReference_key"
ON "location_promotion"("checkoutReference");

CREATE UNIQUE INDEX "location_promotion_polarOrderId_key"
ON "location_promotion"("polarOrderId");

CREATE INDEX "location_promotion_status_pendingUntil_idx"
ON "location_promotion"("status", "pendingUntil");

ALTER TABLE "location_promotion"
ADD CONSTRAINT "location_promotion_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "saved_location"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
