import prisma from "@/lib/db";
import { getLocationPublicShareSlugs } from "@/features/locations/utils";

export async function getPublicLocationShareSlugMap() {
  const locations = await prisma.savedLocation.findMany({
    where: { visibility: "PUBLIC" },
    select: { locationName: true, shareId: true },
  });

  return getLocationPublicShareSlugs(locations);
}
