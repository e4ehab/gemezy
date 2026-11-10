import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocationPromotionState,
} from "./constants/promotion-plans";
import {
  cleanPromotionCheckoutReturnUrl,
  getLegacyLocationRouteSlugs,
  getLocationPublicShareSlugs,
  getLocationRouteSlugs,
  normalizeLocationName,
} from "./utils";

test("removes Polar checkout tokens and status from the success URL", () => {
  const url = new URL(
    "https://gemezy.example/locations/cafe?promotion=success&plan=single-elite&customer_session_token=private&checkout_id=order-123&tab=photos",
  );

  cleanPromotionCheckoutReturnUrl(url);

  assert.equal(url.pathname, "/locations/cafe");
  assert.equal(url.search, "?tab=photos");
});

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

test("reports only unexpired paid plans as active", () => {
  const now = new Date("2026-11-07T20:00:00.000Z");
  assert.equal(
    getLocationPromotionState(
      {
        status: "ACTIVE",
        pendingUntil: now,
        expiresAt: new Date("2026-11-08T20:00:00.000Z"),
      },
      now,
    ),
    "ACTIVE",
  );
  assert.equal(
    getLocationPromotionState(
      {
        status: "ACTIVE",
        pendingUntil: now,
        expiresAt: new Date("2026-11-06T20:00:00.000Z"),
      },
      now,
    ),
    "FREE",
  );
});

test("reports unexpired and expired checkouts correctly", () => {
  const now = new Date("2026-11-07T20:00:00.000Z");
  assert.equal(
    getLocationPromotionState(
      {
        status: "PENDING",
        pendingUntil: new Date("2026-11-07T20:30:00.000Z"),
        expiresAt: null,
      },
      now,
    ),
    "PENDING",
  );
  assert.equal(
    getLocationPromotionState(
      {
        status: "PENDING",
        pendingUntil: new Date("2026-11-07T19:30:00.000Z"),
        expiresAt: null,
      },
      now,
    ),
    "FREE",
  );
});
