ALTER TABLE "saved_location"
ADD COLUMN "locationName" TEXT;

WITH normalized_names AS (
  SELECT
    "id",
    "publicId",
    COALESCE(
      NULLIF(
        TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g')),
        ''
      ),
      'location'
    ) AS base_name
  FROM "saved_location"
),
ranked_names AS (
  SELECT
    "id",
    "publicId",
    base_name,
    ROW_NUMBER() OVER (PARTITION BY base_name ORDER BY "id") AS duplicate_rank
  FROM normalized_names
)
UPDATE "saved_location" AS location
SET "locationName" = CASE
  WHEN ranked_names.base_name = 'new' OR ranked_names.duplicate_rank > 1
    THEN LEFT(ranked_names.base_name, 85) || '-' || LOWER(REGEXP_REPLACE(ranked_names."publicId", '[^a-zA-Z0-9]', '', 'g'))
  ELSE ranked_names.base_name
END
FROM ranked_names
WHERE location."id" = ranked_names."id";

ALTER TABLE "saved_location"
ALTER COLUMN "locationName" SET NOT NULL;

CREATE UNIQUE INDEX "saved_location_locationName_key"
ON "saved_location"("locationName");