import { z } from "zod";
import prisma from "@/lib/db";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";

export const exploreRouter = createTRPCRouter({
  searchPublic: baseProcedure
    .input(z.object({ search: z.string().trim().max(100) }))
    .query(async ({ input }) => {
      const search = input.search.replace(/^#/, "").trim();
      if (!search) return [];

      const matchingTagIds = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT location."id"
        FROM "saved_location" AS location
        WHERE location."visibility" = 'PUBLIC'
          AND EXISTS (
            SELECT 1
            FROM unnest(location."tags") AS tag(value)
            WHERE strpos(lower(tag.value), lower(${search})) > 0
          )
      `;

      return prisma.savedLocation.findMany({
        where: {
          visibility: "PUBLIC",
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { locationName: { contains: search, mode: "insensitive" } },
            { publicId: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { id: { in: matchingTagIds.map(({ id }) => id) } },
          ],
        },
        select: {
          name: true,
          publicId: true,
          locationName: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
      });
    }),
});