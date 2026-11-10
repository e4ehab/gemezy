import { z } from "zod";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { markAllNotificationsRead } from "@/features/notifications/server/services";

export const notificationsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(({ ctx }) =>
    prisma.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ),
  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.notification.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return { updated: result.count === 1 };
    }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await markAllNotificationsRead(
      prisma.notification,
      ctx.session.user.id,
    );

    return { updatedCount: result.count };
  }),
});
