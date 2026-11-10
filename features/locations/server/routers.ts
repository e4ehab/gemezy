import prisma from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { randomBytes, randomInt } from 'node:crypto';
import {
  getGoogleMapsUrl,
  getLegacyLocationRouteSlugs,
  getLocationRouteSlugs,
  isGoogleMapsShareUrl,
} from '@/features/locations/utils';
import { getPublicLocationShareSlugMap } from '@/features/locations/server/share-slugs';
import { LOCATION_VISIBILITIES } from '@/features/locations/constants';
import { getPaidPromotionPlan } from '@/features/locations/constants/promotion-plans';
import { z } from 'zod';
const locationNameInput = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine((locationName) => locationName !== 'new', {
    message: 'This LocationName is reserved.',
  });

const createLocationInput = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('CURRENT'),
    name: z.string().trim().min(2).max(100),
    locationName: locationNameInput,
    description: z.string().trim().max(500).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    images: z.array(z.string().url().max(2000)).max(5).default([]),
    imagePositionX: z.number().int().min(0).max(100).default(50),
    imagePositionY: z.number().int().min(0).max(100).default(50),
    visibility: z.enum(LOCATION_VISIBILITIES).default('PRIVATE'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  z.object({
    source: z.literal('MAPS'),
    name: z.string().trim().min(2).max(100),
    locationName: locationNameInput,
    description: z.string().trim().max(500).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    images: z.array(z.string().url().max(2000)).max(5).default([]),
    imagePositionX: z.number().int().min(0).max(100).default(50),
    imagePositionY: z.number().int().min(0).max(100).default(50),
    visibility: z.enum(LOCATION_VISIBILITIES).default('PRIVATE'),
    address: z.string().trim().min(1).max(500).optional(),
    mapsUrl: z.string().url().max(2000),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
]);
const updateLocationFields = z.object({
  slug: z.string().min(1).max(180),
  name: z.string().trim().min(2).max(100),
  locationName: locationNameInput,
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  images: z.array(z.string().url().max(2000)).max(5),
  imagePositionX: z.number().int().min(0).max(100),
  imagePositionY: z.number().int().min(0).max(100),
  visibility: z.enum(LOCATION_VISIBILITIES),
});
const updateLocationInput = z.discriminatedUnion('source', [
  updateLocationFields.extend({
    source: z.literal('CURRENT'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  updateLocationFields.extend({
    source: z.literal('MAPS'),
    mapsUrl: z.string().url().max(2000),
  }),
]);

function isUniqueConstraintError(
  error: unknown,
): error is { code: string; meta?: { target?: unknown } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function isLocationNameUniqueError(error: unknown) {
  if (!isUniqueConstraintError(error)) return false;
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.includes('locationName')
    : typeof target === 'string' && target.includes('locationName');
}

function findLocationBySlug<T extends {
  locationName: string;
  name: string;
  publicId: string;
}>(locations: T[], slug: string) {
  const routeSlugs = getLocationRouteSlugs(locations);
  const legacyRouteSlugs = getLegacyLocationRouteSlugs(locations);

  return locations.find(
    (location) =>
      routeSlugs.get(location.publicId) === slug ||
      legacyRouteSlugs.get(location.publicId) === slug ||
      location.publicId.toLowerCase() === slug.toLowerCase(),
  );
}

function locationNameTakenError() {
  return new TRPCError({ code: 'CONFLICT', message: 'Location Name is taken' });
}

export const locationsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(100),
          search: z.string().trim().max(100).default(""),
        })
        .default({ page: 1, pageSize: 100, search: "" }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const normalizedQuery = input.search.replace(/^#/, "").trim().toLowerCase();
      const matchingTagIds = normalizedQuery
        ? await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "saved_location"
            WHERE "userId" = ${ctx.session.user.id}
              AND EXISTS (
                SELECT 1
                FROM unnest("tags") AS tag(value)
                WHERE strpos(lower(tag.value), ${normalizedQuery}) > 0
              )
          `
        : [];
      const where = {
        userId: ctx.session.user.id,
        ...(normalizedQuery
          ? {
              OR: [
                { name: { contains: normalizedQuery, mode: "insensitive" as const } },
                {
                  locationName: {
                    contains: normalizedQuery,
                    mode: "insensitive" as const,
                  },
                },
                { publicId: { contains: normalizedQuery, mode: "insensitive" as const } },
                { id: { in: matchingTagIds.map(({ id }) => id) } },
              ],
            }
          : {}),
      };
      const [locations, totalCount] = await Promise.all([
        prisma.savedLocation.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
        prisma.savedLocation.count({ where }),
      ]);
      const routeSlugs = getLocationRouteSlugs(locations);
      const items = locations.map((location) => ({
          ...location,
          slug: routeSlugs.get(location.publicId)!,
          shareSlug:
            location.visibility === 'FRIENDS_ONLY'
              ? location.locationName
              : location.visibility === 'PUBLIC'
                ? location.locationName
                : null,
        }));
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(180) }))
    .query(async ({ ctx, input }) => {
      const locations = await prisma.savedLocation.findMany({
        where: { userId: ctx.session.user.id },
      });
      const location = findLocationBySlug(locations, input.slug);

      if (!location) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found.' });
      }
      const promotion = await prisma.locationPromotion.findUnique({
        where: { locationId: location.id },
      });

      const publicShareSlugs =
        location.visibility === 'PUBLIC'
          ? await getPublicLocationShareSlugMap()
          : null;

      return {
        ...location,
        promotion,
        shareSlug:
          location.visibility === 'FRIENDS_ONLY'
            ? location.locationName
            : publicShareSlugs?.get(location.shareId) ?? null,
      };
    }),
  reservePromotionCheckout: protectedProcedure
    .input(
      z.object({
        locationId: z.string().min(1).max(100),
        plan: z.enum(['SINGLE_REFRESH', 'SINGLE_FEATURED', 'SINGLE_ELITE']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.POLAR_WEBHOOK_SECRET) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Location promotions are not fully configured yet.',
        });
      }

      const location = await prisma.savedLocation.findFirst({
        where: { id: input.locationId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!location) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found.' });
      }
      const plan = getPaidPromotionPlan(input.plan);
      if (!plan) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid promotion plan.',
        });
      }

      const now = new Date();
      const checkoutReference = randomBytes(24).toString('hex');
      const pendingUntil = new Date(now.getTime() + 30 * 60 * 1000);
      const existing = await prisma.locationPromotion.findUnique({
        where: { locationId: location.id },
      });

      if (existing) {
        if (
          (existing.status === 'ACTIVE' &&
            existing.expiresAt !== null &&
            existing.expiresAt > now) ||
          (existing.status === 'PENDING' && existing.pendingUntil > now)
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'This location already has a current plan or an open checkout.',
          });
        }

        const reservation = await prisma.locationPromotion.updateMany({
          where: {
            id: existing.id,
            OR: [
              { status: 'CANCELED' },
              { status: 'ACTIVE', expiresAt: { lte: now } },
              { status: 'PENDING', pendingUntil: { lte: now } },
            ],
          },
          data: {
            plan: input.plan,
            status: 'PENDING',
            checkoutReference,
            pendingUntil,
            startsAt: null,
            expiresAt: null,
            polarOrderId: null,
          },
        });
        if (reservation.count !== 1) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'This location already has a current plan or an open checkout.',
          });
        }
      } else {
        try {
          await prisma.locationPromotion.create({
            data: {
              locationId: location.id,
              plan: input.plan,
              checkoutReference,
              pendingUntil,
            },
          });
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw new TRPCError({
              code: 'CONFLICT',
              message:
                'This location already has a current plan or an open checkout.',
            });
          }
          throw error;
        }
      }

      return {
        checkoutReference,
        locationId: location.id,
        planSlug: plan.slug,
      };
    }),
  cancelPromotionCheckout: protectedProcedure
    .input(z.object({ checkoutReference: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await prisma.locationPromotion.updateMany({
        where: {
          checkoutReference: input.checkoutReference,
          status: 'PENDING',
          location: { userId: ctx.session.user.id },
        },
        data: { status: 'CANCELED' },
      });
      return { canceled: reservation.count === 1 };
    }),
  updateVisibility: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(180),
        visibility: z.enum(LOCATION_VISIBILITIES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const locations = await prisma.savedLocation.findMany({
        where: { userId: ctx.session.user.id },
      });
      const location = findLocationBySlug(locations, input.slug);
      if (!location) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found.' });
      }

      const updated = await prisma.savedLocation.update({
        where: { id: location.id, userId: ctx.session.user.id },
        data: { visibility: input.visibility },
        select: { visibility: true },
      });
      return updated;
    }),
  update: protectedProcedure.input(updateLocationInput).mutation(async ({ ctx, input }) => {
    const locations = await prisma.savedLocation.findMany({
      where: { userId: ctx.session.user.id },
    });
    const location = findLocationBySlug(locations, input.slug);
    if (!location) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found.' });
    }
    if (input.source === 'MAPS' && !isGoogleMapsShareUrl(input.mapsUrl)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Paste a valid Google Maps share link, such as https://share.google/...',
      });
    }

    const locationNameConflict = await prisma.savedLocation.findFirst({
      where: { locationName: input.locationName, id: { not: location.id } },
      select: { id: true },
    });
    if (locationNameConflict) throw locationNameTakenError();

    let updatedLocation;
    try {
      updatedLocation = await prisma.savedLocation.update({
        where: { id: location.id, userId: ctx.session.user.id },
        data: {
          name: input.name,
          locationName: input.locationName,
          description: input.description || null,
          tags: input.tags,
          images: input.images,
          imagePositionX: input.imagePositionX,
          imagePositionY: input.imagePositionY,
          visibility: input.visibility,
          mapsUrl:
            input.source === 'CURRENT'
              ? getGoogleMapsUrl(`${input.latitude},${input.longitude}`)
              : input.mapsUrl,
          latitude: input.source === 'CURRENT' ? input.latitude : null,
          longitude: input.source === 'CURRENT' ? input.longitude : null,
          address: input.source === 'CURRENT' ? null : location.address,
        },
      });
    } catch (error) {
      if (isLocationNameUniqueError(error)) throw locationNameTakenError();
      throw error;
    }
    const updatedLocations = locations.map((item) =>
      item.id === updatedLocation.id ? updatedLocation : item,
    );

    return {
      ...updatedLocation,
      slug: getLocationRouteSlugs(updatedLocations).get(updatedLocation.publicId)!,
      shareSlug:
        updatedLocation.visibility === 'PUBLIC'
          ? (await getPublicLocationShareSlugMap()).get(updatedLocation.shareId) ?? null
          : null,
    };
  }),
  delete: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(180) }))
    .mutation(async ({ ctx, input }) => {
      const locations = await prisma.savedLocation.findMany({
        where: { userId: ctx.session.user.id },
      });
      const location = findLocationBySlug(locations, input.slug);
      if (!location) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found.' });
      }

      await prisma.savedLocation.delete({
        where: { id: location.id, userId: ctx.session.user.id },
      });
      return { success: true };
    }),
  create: protectedProcedure.input(createLocationInput).mutation(async ({ ctx, input }) => {
      if (input.source === 'MAPS' && !isGoogleMapsShareUrl(input.mapsUrl)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Paste a valid Google Maps share link, such as https://share.google/...',
        });
      }

      const address = input.source === 'MAPS' ? input.address ?? null : null;
      const latitude = input.latitude ?? null;
      const longitude = input.longitude ?? null;
      const mapsUrl =
        input.source === 'CURRENT'
          ? getGoogleMapsUrl(`${input.latitude},${input.longitude}`)
          : input.mapsUrl;

    const locationNameConflict = await prisma.savedLocation.findUnique({
      where: { locationName: input.locationName },
      select: { id: true },
    });
    if (locationNameConflict) throw locationNameTakenError();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const publicId = `LOC@${randomInt(0, 100_000_000).toString().padStart(8, '0')}`;

      try {
        return await prisma.savedLocation.create({
          data: {
            publicId,
            shareId: randomBytes(16).toString('hex'),
            visibility: input.visibility,
            name: input.name,
            locationName: input.locationName,
            description: input.description || null,
            tags: input.tags,
            images: input.images,
            imagePositionX: input.imagePositionX,
            imagePositionY: input.imagePositionY,
            address,
            mapsUrl,
            latitude,
            longitude,
            userId: ctx.session.user.id,
          },
        });
      } catch (error) {
        if (isLocationNameUniqueError(error)) throw locationNameTakenError();
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Could not generate a unique location ID. Please try again.',
    });
  }),
});
