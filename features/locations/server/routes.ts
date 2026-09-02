
import prisma from "@/lib/db";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { z } from "zod";

export const workflowsRouter = createTRPCRouter({

    // get all workflows for the authenticated user
    getMany: baseProcedure
        .query(({ ctx }) => {
            return prisma.user.findMany({
                orderBy: { createdAt: "desc" }, // newest first
            });
        }),

});