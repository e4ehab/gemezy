import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { SharedLocationView } from "@/features/locations/components/shared-location-view";
import {
  getLegacyLocationPublicShareSlugs,
  getPublicLocationSharePath,
} from "@/features/locations/utils";

type SharedLocationPageProps = {
  params: Promise<{ locationSlug: string }>;
};

const isValidShareId = (value: string) => /^[a-f0-9]{32}$/i.test(value);

async function getViewerId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
}

async function canViewFriendsOnlyLocation(ownerId: string, viewerId?: string) {
  if (!viewerId) return false;
  if (ownerId === viewerId) return true;

  const [friendship, block] = await Promise.all([
    prisma.friendRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: ownerId, recipientId: viewerId },
          { senderId: viewerId, recipientId: ownerId },
        ],
      },
      select: { id: true },
    }),
    prisma.friendBlock.findFirst({
      where: {
        OR: [
          { blockerId: ownerId, blockedId: viewerId },
          { blockerId: viewerId, blockedId: ownerId },
        ],
      },
      select: { id: true },
    }),
  ]);

  return Boolean(friendship) && !block;
}

const sharedLocationSelect = {
  shareId: true,
  name: true,
  locationName: true,
  images: true,
  mapsUrl: true,
  imagePositionX: true,
  imagePositionY: true,
  visibility: true,
  userId: true,
} as const;

async function findSharedLocation(locationSlug: string, viewerId?: string) {
  const allowedVisibilities: ("PUBLIC" | "FRIENDS_ONLY")[] = viewerId
    ? ["PUBLIC", "FRIENDS_ONLY"]
    : ["PUBLIC"];

  if (isValidShareId(locationSlug)) {
    const location = await prisma.savedLocation.findFirst({
      where: {
        shareId: locationSlug,
        visibility: { in: allowedVisibilities },
      },
      select: sharedLocationSelect,
    });

    if (!location) return null;
    if (
      location.visibility === "FRIENDS_ONLY" &&
      !(await canViewFriendsOnlyLocation(location.userId, viewerId))
    ) {
      return null;
    }

    return {
      shareId: location.shareId,
      name: location.name,
      locationName: location.locationName,
      images: location.images,
      mapsUrl: location.mapsUrl,
      imagePositionX: location.imagePositionX,
      imagePositionY: location.imagePositionY,
      visibility: location.visibility,
      shareSlug: location.locationName,
    };
  }

  const publicLocations = await prisma.savedLocation.findMany({
    where: { visibility: "PUBLIC" },
    select: { shareId: true, name: true, locationName: true },
  });
  const legacyShareSlugs = getLegacyLocationPublicShareSlugs(publicLocations);
  const matchedLocation = publicLocations.find(
    ({ shareId, locationName }) =>
      locationName === locationSlug ||
      legacyShareSlugs.get(shareId) === locationSlug,
  );

  if (matchedLocation) {
    const location = await prisma.savedLocation.findFirst({
      where: { shareId: matchedLocation.shareId, visibility: "PUBLIC" },
      select: sharedLocationSelect,
    });
    if (location) {
      return {
        shareId: location.shareId,
        name: location.name,
        locationName: location.locationName,
        images: location.images,
        mapsUrl: location.mapsUrl,
        imagePositionX: location.imagePositionX,
        imagePositionY: location.imagePositionY,
        visibility: location.visibility,
        shareSlug: location.locationName,
      };
    }
  }

  if (!viewerId) return null;
  const friendsOnlyLocation = await prisma.savedLocation.findFirst({
    where: {
      locationName: locationSlug,
      visibility: "FRIENDS_ONLY",
    },
    select: sharedLocationSelect,
  });
  if (
    !friendsOnlyLocation ||
    !(await canViewFriendsOnlyLocation(friendsOnlyLocation.userId, viewerId))
  ) {
    return null;
  }

  return {
    shareId: friendsOnlyLocation.shareId,
    name: friendsOnlyLocation.name,
    locationName: friendsOnlyLocation.locationName,
    images: friendsOnlyLocation.images,
    mapsUrl: friendsOnlyLocation.mapsUrl,
    imagePositionX: friendsOnlyLocation.imagePositionX,
    imagePositionY: friendsOnlyLocation.imagePositionY,
    visibility: friendsOnlyLocation.visibility,
    shareSlug: friendsOnlyLocation.locationName,
  };
}

export async function generateMetadata({
  params,
}: SharedLocationPageProps): Promise<Metadata> {
  const { locationSlug } = await params;
  const location = await findSharedLocation(locationSlug, await getViewerId());
  return {
    title: location ? `${location.name} | Gemezy` : "Shared location | Gemezy",
    description: location ? `View ${location.name} on Gemezy.` : undefined,
    robots: location?.visibility === "PUBLIC"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function SharedLocationPage({ params }: SharedLocationPageProps) {
  const { locationSlug } = await params;
  const location = await findSharedLocation(locationSlug, await getViewerId());
  if (!location) notFound();

  if (location.shareSlug && locationSlug !== location.shareSlug) {
    redirect(getPublicLocationSharePath(location.shareSlug));
  }

  return <SharedLocationView location={location} />;
}
