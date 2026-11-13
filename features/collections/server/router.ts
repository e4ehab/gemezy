import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";

export const collectionsRouter = createTRPCRouter({
  getSavedIds: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      return { authenticated: false, userId: null, publicIds: [] };
    }

    const savedItems = await prisma.savedCollectionItem.findMany({
      where: {
        userId: ctx.session.user.id,
        location: { visibility: "PUBLIC" },
      },
      select: { location: { select: { publicId: true } } },
    });

    return {
      authenticated: true,
      userId: ctx.session.user.id,
      publicIds: savedItems.map(({ location }) => location.publicId),
    };
  }),

  getMany: protectedProcedure.query(async ({ ctx }) => {
    const savedItems = await prisma.savedCollectionItem.findMany({
      where: {
        userId: ctx.session.user.id,
        location: { visibility: "PUBLIC" },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        createdAt: true,
        location: {
          select: {
            id: true,
            shareId: true,
            locationName: true,
            publicId: true,
            name: true,
            description: true,
            tags: true,
            images: true,
            imagePositionX: true,
            imagePositionY: true,
            address: true,
            mapsUrl: true,
            user: { select: { id: true, name: true, image: true } },
            promotion: {
              select: {
                plan: true,
                status: true,
                startsAt: true,
                expiresAt: true,
              },
            },
          },
        },
      },
    });
    const now = new Date();

    return savedItems.map(({ createdAt, location }) => ({
      ...location,
      ownerId: location.user.id,
      ownerName: location.user.name,
      ownerImage: location.user.image,
      savedAt: createdAt,
      promotionPlan:
        location.promotion?.status === "ACTIVE" &&
        location.promotion.startsAt !== null &&
        location.promotion.startsAt <= now &&
        location.promotion.expiresAt !== null &&
        location.promotion.expiresAt > now
          ? location.promotion.plan
          : null,
    }));
  }),

  setSaved: protectedProcedure
    .input(
      z.object({
        publicId: z.string().regex(/^LOC@\d{8}$/i),
        isSaved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const location = await prisma.savedLocation.findUnique({
        where: { publicId: input.publicId },
        select: { id: true, userId: true, visibility: true },
      });

      if (!location || location.visibility !== "PUBLIC") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This public location is no longer available.",
        });
      }

      if (input.isSaved) {
        if (location.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot add your own location to your collections.",
          });
        }

        await prisma.savedCollectionItem.upsert({
          where: {
            userId_locationId: {
              userId: ctx.session.user.id,
              locationId: location.id,
            },
          },
          create: {
            userId: ctx.session.user.id,
            locationId: location.id,
          },
          update: {},
        });
      } else {
        await prisma.savedCollectionItem.deleteMany({
          where: {
            userId: ctx.session.user.id,
            locationId: location.id,
          },
        });
      }

      return { isSaved: input.isSaved };
    }),
});
