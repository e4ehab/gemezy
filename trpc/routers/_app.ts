import { createTRPCRouter } from '../init';
import { locationsRouter } from '@/features/locations/server/routers';

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
});

export type AppRouter = typeof appRouter;
