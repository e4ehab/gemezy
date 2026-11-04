type LocationSlugInput = {
  locationName: string;
  publicId: string;
};

type LegacyLocationSlugInput = {
  name: string;
  publicId: string;
};

export function normalizeLocationName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugifyLocationName(name: string) {
  return normalizeLocationName(name) || 'location';
}

export function getLocationRouteSlugs<T extends LocationSlugInput>(locations: T[]) {
  return new Map(
    locations.map((location) => [location.publicId, location.locationName] as const),
  );
}

export function getLegacyLocationRouteSlugs<T extends LegacyLocationSlugInput>(
  locations: T[],
) {
  const baseSlugCounts = new Map<string, number>();
  for (const location of locations) {
    const baseSlug = slugifyLocationName(location.name);
    baseSlugCounts.set(baseSlug, (baseSlugCounts.get(baseSlug) ?? 0) + 1);
  }

  return new Map(
    locations.map((location) => {
      const baseSlug = slugifyLocationName(location.name);
      const needsSuffix = baseSlug === 'new' || (baseSlugCounts.get(baseSlug) ?? 0) > 1;
      const idSuffix = location.publicId.replace(/^LOC@/, '').toLowerCase();

      return [
        location.publicId,
        needsSuffix ? `${baseSlug}-${idSuffix}` : baseSlug,
      ] as const;
    }),
  );
}

export function getLocationPublicShareSlugs(
  locations: Array<{ locationName: string; shareId: string }>,
) {
  return new Map(
    locations.map((location) => [location.shareId, location.locationName] as const),
  );
}

export function getLegacyLocationPublicShareSlugs(
  locations: Array<{ name: string; shareId: string }>,
) {
  const baseSlugCounts = new Map<string, number>();
  const shortIdCounts = new Map<string, number>();

  for (const location of locations) {
    const baseSlug = slugifyLocationName(location.name);
    const shortId = location.shareId.slice(0, 8);
    baseSlugCounts.set(baseSlug, (baseSlugCounts.get(baseSlug) ?? 0) + 1);
    shortIdCounts.set(
      `${baseSlug}:${shortId}`,
      (shortIdCounts.get(`${baseSlug}:${shortId}`) ?? 0) + 1,
    );
  }

  return new Map(
    locations.map((location) => {
      const baseSlug = slugifyLocationName(location.name);
      if ((baseSlugCounts.get(baseSlug) ?? 0) < 2) {
        return [location.shareId, baseSlug] as const;
      }

      const shortId = location.shareId.slice(0, 8);
      const suffix =
        (shortIdCounts.get(`${baseSlug}:${shortId}`) ?? 0) > 1
          ? location.shareId
          : shortId;

      return [location.shareId, `${baseSlug}-${suffix}`] as const;
    }),
  );
}

export function getPublicLocationSharePath(slug: string) {
  return `/share/locations/${encodeURIComponent(slug)}`;
}

export function isGoogleMapsShareUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;

    return (
      url.hostname === 'share.google' ||
      url.hostname === 'maps.app.goo.gl' ||
      (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps')) ||
      ((url.hostname === 'google.com' || url.hostname.endsWith('.google.com')) &&
        url.pathname.startsWith('/maps'))
    );
  } catch {
    return false;
  }
}

export function getGoogleMapsUrl(location: string) {
  try {
    const url = new URL(location);
    if (isGoogleMapsShareUrl(url.toString())) return url.toString();
  } catch {
    // Plain place names and addresses are valid Google Maps search queries.
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function getLocationSharePath(shareId: string) {
  return `/share/locations/${encodeURIComponent(shareId)}`;
}
