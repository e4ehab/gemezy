// lib/auth.ts

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import prisma from "@/lib/db";
import { polarClient } from "@/lib/polar";
import {
  onPromotionCheckoutCreated,
  onPromotionCheckoutUpdated,
  onPromotionOrderPaid,
  onPromotionOrderUpdated,
} from "@/features/locations/server/promotion-webhooks";
import {
  normalizeUsername,
  USERNAME_FORMAT_ERROR,
  USERNAME_LENGTH_ERROR,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/features/auth/username";

const getPolarProducts = async () => {
  const singleRefreshProductId = process.env.POLAR_SINGLE_REFRESH_PRODUCT_ID;
  const singleFeaturedProductId = process.env.POLAR_SINGLE_FEATURED_PRODUCT_ID;
  const singleEliteProductId = process.env.POLAR_SINGLE_ELITE_PRODUCT_ID;

  if (
    !singleRefreshProductId ||
    !singleFeaturedProductId ||
    !singleEliteProductId
  ) {
    throw new Error(
      "Set all three single-promotion Polar product IDs before enabling checkout.",
    );
  }

  return [
    { productId: singleRefreshProductId, slug: "single-refresh" },
    { productId: singleFeaturedProductId, slug: "single-featured" },
    { productId: singleEliteProductId, slug: "single-elite" },
  ];
};

const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;
const promotionWebhooks = polarWebhookSecret
  ? webhooks({
      secret: polarWebhookSecret,
      onCheckoutCreated: onPromotionCheckoutCreated,
      onCheckoutUpdated: onPromotionCheckoutUpdated,
      onOrderPaid: onPromotionOrderPaid,
      onOrderUpdated: onPromotionOrderUpdated,
    })
  : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: getPolarProducts,
          successUrl: process.env.POLAR_SUCCESS_URL,
          returnUrl: process.env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
        ...(promotionWebhooks ? [promotionWebhooks] : []),
      ],
    }),
  ],
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