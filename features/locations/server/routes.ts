
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const workflowsRouter = createTRPCRouter({

    // get all workflows for the authenticated user
    getMany: protectedProcedure
        .query(({ ctx }) => {
            return prisma.workflow.findMany({
                where: { userId: ctx.auth.user.id },
                orderBy: { createdAt: "desc" }, // newest first
            });
        }),

});