import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FRIEND_PUBLIC_ID_PATTERN } from "@/features/friends/constants";
import { USERNAME_PATTERN } from "@/features/auth/username";
import { getPublicLocationShareSlugMap } from "@/features/locations/server/share-slugs";
import {
  ACCEPTED_FRIENDSHIP_STATUS,
  canSendFriendRequest,
  canRemoveFriendship,
  canCancelFriendRequest,
  canRespondToFriendRequest,
  canViewPublicLocations,
  canViewFriendsOnlyLocations,
  classifyRequestPair,
  getFriendVisibleLocationVisibilities,
  getFriendRequestResponseStatus,
  isLocationVisibleToFriend,
} from "@/features/friends/server/policies";

const publicIdInput = z
  .string()
  .trim()
  .toUpperCase()
  .regex(FRIEND_PUBLIC_ID_PATTERN, "Enter a valid friend ID, for example GEM@12345678.");
const usernameInput = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(100)
  .regex(USERNAME_PATTERN, "Enter a valid username.");

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function findBlockBetween(userId: string, otherUserId: string) {
  return prisma.friendBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
}

export const friendsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [requests, incomingRequests, outgoingRequests] = await Promise.all([
      prisma.friendRequest.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
        orderBy: { updatedAt: "desc" },
        select: {
          senderId: true,
          sender: { select: { publicId: true, name: true, image: true } },
          recipient: { select: { publicId: true, name: true, image: true } },
        },
      }),
      prisma.friendRequest.findMany({
        where: { recipientId: userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          sender: { select: { publicId: true, name: true, image: true } },
        },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          recipient: { select: { publicId: true, name: true, image: true } },
        },
      }),
    ]);

    return {
      friends: requests.map(({ senderId, sender, recipient }) =>
        senderId === userId ? recipient : sender,
      ),
      incomingRequests,
      outgoingRequests,
    };
  }),

  getBlocked: protectedProcedure.query(async ({ ctx }) =>
    prisma.friendBlock.findMany({
      where: { blockerId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        blocked: { select: { publicId: true, name: true, image: true } },
      },
    }),
  ),

  getByUsername: protectedProcedure
    .input(
      z.object({
        username: z.string().trim().min(2).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalizedUsername = input.username.toLowerCase();
      const friend = await prisma.user.findFirst({
        where: FRIEND_PUBLIC_ID_PATTERN.test(normalizedUsername)
          ? { publicId: normalizedUsername.toUpperCase() }
          : {
              name: {
                equals: usernameInput.parse(normalizedUsername),
                mode: "insensitive",
              },
            },
        select: { id: true, publicId: true, name: true, image: true },
      });
      if (!friend) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Friend not found." });
      }

      const blocked = Boolean(await findBlockBetween(ctx.session.user.id, friend.id));

      const friendRequests = await prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: ctx.session.user.id, recipientId: friend.id },
            { senderId: friend.id, recipientId: ctx.session.user.id },
          ],
        },
        select: { id: true, senderId: true, recipientId: true, status: true },
      });
      if (!canViewPublicLocations(blocked)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This user's locations are unavailable.",
        });
      }

      const isAcceptedFriend = canViewFriendsOnlyLocations(
        friendRequests.some((request) => request.status === ACCEPTED_FRIENDSHIP_STATUS),
      );
      const requestState = classifyRequestPair(ctx.session.user.id, friendRequests);
      const locations = await prisma.savedLocation.findMany({
        where: {
          userId: friend.id,
          visibility: { in: getFriendVisibleLocationVisibilities(isAcceptedFriend) },
        },
        orderBy: { createdAt: "desc" },
        select: {
          shareId: true,
          name: true,
          locationName: true,
          visibility: true,
          images: true,
          imagePositionX: true,
          imagePositionY: true,
          mapsUrl: true,
          createdAt: true,
        },
      });
      const publicShareSlugs = await getPublicLocationShareSlugMap();
      const publicLocations = locations
        .flatMap(({ visibility, ...location }) =>
          isLocationVisibleToFriend(visibility)
            ? [
                {
                  ...location,
                  shareSlug:
                    visibility === "FRIENDS_ONLY"
                      ? location.locationName
                      : publicShareSlugs.get(location.shareId) ?? null,
                },
              ]
            : [],
        );

      return {
        friend: {
          publicId: friend.publicId,
          name: friend.name,
          image: friend.image,
        },
        relationship:
          requestState.kind === "accepted"
            ? "FRIENDS"
            : requestState.kind === "pending-outgoing" ||
                requestState.kind === "pending-incoming"
              ? "PENDING"
              : "NONE",
        locations: publicLocations,
      };
    }),

  sendRequest: protectedProcedure
    .input(z.object({ friendId: publicIdInput }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const target = await prisma.user.findUnique({
        where: { publicId: input.friendId },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found with that friend ID.",
        });
      }
      if (target.id === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot add yourself as a friend.",
        });
      }
      if (!canSendFriendRequest(Boolean(await findBlockBetween(userId, target.id)))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A friend request cannot be sent between these accounts.",
        });
      }

      const pairRequests = await prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: target.id },
            { senderId: target.id, recipientId: userId },
          ],
        },
      });
      const pairState = classifyRequestPair(userId, pairRequests);
      if (pairState.kind === "accepted") {
        throw new TRPCError({ code: "CONFLICT", message: "You are already friends." });
      }

      if (
        pairState.kind === "pending-outgoing" ||
        pairState.kind === "pending-incoming"
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            pairState.kind === "pending-outgoing"
              ? "Your invitation is already waiting for approval."
              : "This person has already invited you. Approve their request below.",
        });
      }

      try {
        if (pairState.kind === "retry-outgoing") {
          await prisma.friendRequest.update({
            where: { id: pairState.requestId },
            data: { status: "PENDING", respondedAt: null },
          });
        } else {
          await prisma.friendRequest.create({
            data: { senderId: userId, recipientId: target.id },
          });
        }
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An invitation between these accounts already exists.",
          });
        }
        throw error;
      }
      return { success: true };
    }),

  respondToRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().min(1),
        response: z.enum(["ACCEPTED", "DECLINED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.friendRequest.findUnique({
        where: { id: input.requestId },
        select: { recipientId: true, status: true },
      });
      const nextStatus = request
        ? getFriendRequestResponseStatus(
            request.status,
            request.recipientId === ctx.session.user.id,
            input.response,
          )
        : null;
      if (
        !request ||
        !canRespondToFriendRequest(request, ctx.session.user.id) ||
        !nextStatus
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This friend request is no longer available.",
        });
      }
      const result = await prisma.friendRequest.updateMany({
        where: {
          id: input.requestId,
          recipientId: ctx.session.user.id,
          status: "PENDING",
        },
        data: { status: nextStatus, respondedAt: new Date() },
      });
      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This friend request is no longer available.",
        });
      }
      return { success: true, status: input.response };
    }),

  cancelRequest: protectedProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.friendRequest.findUnique({
        where: { id: input.requestId },
        select: { senderId: true, status: true },
      });
      if (!request || !canCancelFriendRequest(request, ctx.session.user.id)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This pending friend request is no longer available.",
        });
      }
      const result = await prisma.friendRequest.deleteMany({
        where: {
          id: input.requestId,
          senderId: ctx.session.user.id,
          status: "PENDING",
        },
      });
      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This pending friend request is no longer available.",
        });
      }
      return { success: true };
    }),

  blockUser: protectedProcedure
    .input(z.object({ friendId: publicIdInput }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const target = await prisma.user.findUnique({
        where: { publicId: input.friendId },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      if (target.id === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot block yourself." });
      }

      await prisma.$transaction(async (transaction) => {
        await transaction.friendBlock.upsert({
          where: {
            blockerId_blockedId: { blockerId: userId, blockedId: target.id },
          },
          create: { blockerId: userId, blockedId: target.id },
          update: {},
        });
        await transaction.friendRequest.deleteMany({
          where: {
            status: { in: ["PENDING", "ACCEPTED"] },
            OR: [
              { senderId: userId, recipientId: target.id },
              { senderId: target.id, recipientId: userId },
            ],
          },
        });
      });
      return { success: true };
    }),

  unblockUser: protectedProcedure
    .input(z.object({ friendId: publicIdInput }))
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUnique({
        where: { publicId: input.friendId },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      const result = await prisma.friendBlock.deleteMany({
        where: { blockerId: ctx.session.user.id, blockedId: target.id },
      });
      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This user is not blocked." });
      }
      return { success: true };
    }),

  removeFriend: protectedProcedure
    .input(z.object({ friendId: publicIdInput }))
    .mutation(async ({ ctx, input }) => {
      const friend = await prisma.user.findUnique({
        where: { publicId: input.friendId },
        select: { id: true },
      });
      if (!friend) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Friend not found." });
      }
      const acceptedFriendship = await prisma.friendRequest.findFirst({
        where: {
          status: ACCEPTED_FRIENDSHIP_STATUS,
          OR: [
            { senderId: ctx.session.user.id, recipientId: friend.id },
            { senderId: friend.id, recipientId: ctx.session.user.id },
          ],
        },
        select: { status: true },
      });
      if (!acceptedFriendship || !canRemoveFriendship(acceptedFriendship.status)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This friendship no longer exists.",
        });
      }
      const result = await prisma.friendRequest.deleteMany({
        where: {
          status: ACCEPTED_FRIENDSHIP_STATUS,
          OR: [
            { senderId: ctx.session.user.id, recipientId: friend.id },
            { senderId: friend.id, recipientId: ctx.session.user.id },
          ],
        },
      });
      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This friendship no longer exists.",
        });
      }
      return { success: true };
    }),
});
