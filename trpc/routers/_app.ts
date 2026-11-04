import { createTRPCRouter } from '../init';
import { locationsRouter } from '@/features/locations/server/routers';
import { profileRouter } from '@/features/profile/server/routers';
import { friendsRouter } from '@/features/friends/server/routers';

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
  profile: profileRouter,
  friends: friendsRouter,
});

export type AppRouter = typeof appRouter;
