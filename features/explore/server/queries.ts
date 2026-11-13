import { Prisma } from "@/lib/generated/prisma/client";
import prisma from "@/lib/db";
import { EXPLORE_PAGE_SIZE } from "@/features/explore/constants";
import type { PaidPromotionPlan } from "@/features/locations/constants/promotion-plans";

type ExploreLocation = {
  id: string;
  ownerId: string;
  shareId: string;
  locationName: string;
  publicId: string;
  name: string;
  description: string | null;
  tags: string[];
  images: string[];
  imagePositionX: number;
  imagePositionY: number;
  address: string | null;
  mapsUrl: string;
  ownerName: string;
  ownerImage: string | null;
  promotionPlan: PaidPromotionPlan | null;
};

export async function getExploreLocations(search: string, requestedPage: number) {
  const searchFilter = search
    ? Prisma.sql`(
        strpos(lower(location.name), lower(${search})) > 0
          OR strpos(lower(location."locationName"), lower(${search})) > 0
          OR strpos(lower(location."publicId"), lower(${search})) > 0
          OR strpos(lower(coalesce(location.description, '')), lower(${search})) > 0
        OR strpos(lower(coalesce(location.address, '')), lower(${search})) > 0
        OR EXISTS (
          SELECT 1
          FROM unnest(location.tags) AS tag(value)
          WHERE strpos(lower(tag.value), lower(${search})) > 0
        )
      )`
    : Prisma.sql`TRUE`;

  const whereClause = Prisma.sql`
    location.visibility = 'PUBLIC'
    AND ${searchFilter}
  `;

  const [countResult] = await prisma.$queryRaw<Array<{ totalCount: bigint }>>`
    SELECT COUNT(*) AS "totalCount"
    FROM "saved_location" AS location
    WHERE ${whereClause}
  `;
  const totalCount = Number(countResult.totalCount);
  const totalPages = Math.ceil(totalCount / EXPLORE_PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages || 1);
  const activePromotion = Prisma.sql`
    promotion.status = 'ACTIVE'
    AND promotion."startsAt" <= CURRENT_TIMESTAMP
    AND promotion."expiresAt" > CURRENT_TIMESTAMP
  `;

  const items = await prisma.$queryRaw<ExploreLocation[]>`
    WITH ranked_locations AS (
      SELECT
        location.id,
        location."shareId",
        location."locationName",
        location."publicId",
        location.name,
        location.description,
        location.tags,
        location.images,
        location."imagePositionX",
        location."imagePositionY",
        location.address,
        location."mapsUrl",
        location."createdAt",
        owner.id AS "ownerId",
        owner.name AS "ownerName",
        owner.image AS "ownerImage",
        CASE
          WHEN ${activePromotion} AND promotion.plan = 'SINGLE_ELITE' THEN 3
          WHEN ${activePromotion} AND promotion.plan = 'SINGLE_FEATURED' THEN 2
          WHEN ${activePromotion} AND promotion.plan = 'SINGLE_REFRESH' THEN 1
          ELSE 0
        END AS "promotionTier",
        CASE
          WHEN ${activePromotion} THEN promotion.plan::text
          ELSE NULL
        END AS "promotionPlan",
        CASE
          WHEN ${activePromotion} AND promotion.plan = 'SINGLE_REFRESH' THEN
            promotion."startsAt" +
              floor(extract(epoch FROM (CURRENT_TIMESTAMP - promotion."startsAt")) / 86400)
              * interval '1 day'
          ELSE NULL
        END AS "refreshedAt",
        CASE
          WHEN ${search} <> '' AND lower(location.name) = lower(${search}) THEN 2
          WHEN ${search} <> '' AND strpos(lower(location.name), lower(${search})) = 1 THEN 1
          ELSE 0
        END AS "searchRelevance"
      FROM "saved_location" AS location
      INNER JOIN "user" AS owner ON owner.id = location."userId"
      LEFT JOIN "location_promotion" AS promotion
        ON promotion."locationId" = location.id
      WHERE ${whereClause}
    )
    SELECT
      id,
      "shareId",
      "locationName",
      "publicId",
      name,
      description,
      tags,
      images,
      "imagePositionX",
      "imagePositionY",
      address,
      "mapsUrl",
      "ownerId",
      "ownerName",
      "ownerImage",
      "promotionPlan"
    FROM ranked_locations
    ORDER BY
      "promotionTier" DESC,
      "refreshedAt" DESC NULLS LAST,
      "searchRelevance" DESC,
      "createdAt" DESC,
      id ASC
    LIMIT ${EXPLORE_PAGE_SIZE}
    OFFSET ${(page - 1) * EXPLORE_PAGE_SIZE}
  `;

  return {
    items,
    page,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
