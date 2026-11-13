import { createTRPCRouter } from '../init';
import { locationsRouter } from '@/features/locations/server/routers';
import { profileRouter } from '@/features/profile/server/routers';
import { friendsRouter } from '@/features/friends/server/routers';
import { notificationsRouter } from '@/features/notifications/server/routers';
import { exploreRouter } from '@/features/explore/server/router';
import { collectionsRouter } from '@/features/collections/server/router';

export const appRouter = createTRPCRouter({
  explore: exploreRouter,
  collections: collectionsRouter,
  locations: locationsRouter,
  profile: profileRouter,
  friends: friendsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
