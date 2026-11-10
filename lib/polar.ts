
import { createPolarCore } from "@polar-sh/sdk/2026-04";

const server = process.env.POLAR_SERVER ?? "sandbox";

if (server !== "sandbox" && server !== "production") {
  throw new Error('POLAR_SERVER must be either "sandbox" or "production".');
}

export const polarClient = createPolarCore({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  environment: server,
});
