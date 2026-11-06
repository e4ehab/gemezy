import { createLoader } from "nuqs/server";
import { locationsParams } from "@/features/locations/params";

export const locationsParamsLoader = createLoader(locationsParams);
