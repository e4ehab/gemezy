import { parseAsInteger, parseAsString } from "nuqs/server";

export const LOCATIONS_PAGE_SIZE = 10;

export const locationsParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};
