import prisma from '@/lib/db';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  normalizeUsername,
  USERNAME_FORMAT_ERROR,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@/features/auth/username';

export const profileRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) =>
    prisma.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: {
        publicId: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        accounts: {
          select: {
            providerId: true,
            createdAt: true,
          },
        },
      },
    }),
  ),
  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
          .max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`)
          .regex(USERNAME_PATTERN, USERNAME_FORMAT_ERROR)
          .transform(normalizeUsername),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await prisma.user.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: ctx.session.user.id },
        },
        select: { id: true },
      });
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username is taken' });
      }

      return prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name },
        select: { name: true },
      });
    }),
});
