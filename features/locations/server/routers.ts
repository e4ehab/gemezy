import prisma from '@/lib/db';
import { createTRPCRouter, baseProcedure } from '@/trpc/init';
import { z } from 'zod';

export const locationsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });

      return users;
    }),
});
