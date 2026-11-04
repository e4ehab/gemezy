import assert from "node:assert/strict";
import test from "node:test";
import {
  getLegacyLocationRouteSlugs,
  getLocationPublicShareSlugs,
  getLocationRouteSlugs,
  normalizeLocationName,
} from "./utils";

test("normalizes LocationName values for URL use", () => {
  assert.equal(normalizeLocationName("Cafe by the River"), "cafe-by-the-river");
  assert.equal(normalizeLocationName("  "), "");
});

test("uses unique LocationName values for personal and public routes", () => {
  const locations = [
    {
      name: "Cafe",
      locationName: "cafe-downtown",
      publicId: "LOC@00000001",
      shareId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    {
      name: "Cafe",
      locationName: "cafe-by-the-river",
      publicId: "LOC@00000002",
      shareId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
  ];

  const routeSlugs = getLocationRouteSlugs(locations);
  const shareSlugs = getLocationPublicShareSlugs(locations);

  assert.equal(routeSlugs.get(locations[0].publicId), "cafe-downtown");
  assert.equal(routeSlugs.get(locations[1].publicId), "cafe-by-the-river");
  assert.equal(shareSlugs.get(locations[0].shareId), "cafe-downtown");
  assert.equal(shareSlugs.get(locations[1].shareId), "cafe-by-the-river");
});

test("keeps previously generated location routes resolvable", () => {
  const locations = [
    { name: "Cafe", publicId: "LOC@00000001" },
    { name: "Cafe", publicId: "LOC@00000002" },
  ];
  const legacySlugs = getLegacyLocationRouteSlugs(locations);

  assert.equal(legacySlugs.get(locations[0].publicId), "cafe-00000001");
  assert.equal(legacySlugs.get(locations[1].publicId), "cafe-00000002");
});
