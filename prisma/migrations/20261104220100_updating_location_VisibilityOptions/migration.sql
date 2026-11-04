ALTER TABLE "saved_location"
ALTER COLUMN "visibility" DROP DEFAULT;

ALTER TYPE "LocationVisibility" RENAME TO "LocationVisibility_old";

CREATE TYPE "LocationVisibility" AS ENUM (
  'PUBLIC',
  'PRIVATE',
  'FRIENDS_ONLY'
);

ALTER TABLE "saved_location"
ALTER COLUMN "visibility" TYPE "LocationVisibility"
USING (
  CASE "visibility"::text
    WHEN 'Unlisted' THEN 'PRIVATE'
    WHEN 'SHARED' THEN 'FRIENDS_ONLY'
    ELSE "visibility"::text
  END
)::"LocationVisibility";

DROP TYPE "LocationVisibility_old";

ALTER TABLE "saved_location"
ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';
