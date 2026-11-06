import { useQueryStates } from "nuqs";
import { locationsParams } from "@/features/locations/params";

export function useLocationsParams() {
  return useQueryStates(locationsParams);
}
