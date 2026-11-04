// lib/auth.ts

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import {
  normalizeUsername,
  USERNAME_FORMAT_ERROR,
  USERNAME_LENGTH_ERROR,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/features/auth/username";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (context?.path !== "/sign-up/email") return;

          if (
            user.name.length < USERNAME_MIN_LENGTH ||
            user.name.length > USERNAME_MAX_LENGTH
          ) {
            throw new APIError("BAD_REQUEST", {
              message: USERNAME_LENGTH_ERROR,
            });
          }
          if (!USERNAME_PATTERN.test(user.name)) {
            throw new APIError("BAD_REQUEST", {
              message: USERNAME_FORMAT_ERROR,
            });
          }

          const name = normalizeUsername(user.name);
          const existingUser = await prisma.user.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
            select: { id: true },
          });
          if (existingUser) {
            throw new APIError("CONFLICT", { message: "Username is taken" });
          }

          return { data: { ...user, name } };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, //so after registering sign in auutomatically , instead of sign in after registering
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});