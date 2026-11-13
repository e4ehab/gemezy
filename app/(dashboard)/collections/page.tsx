import { requireAuth } from "@/lib/auth-utils";
import { SavedCollectionsView } from "@/features/collections/components/saved-collections-view";

export default async function CollectionsPage() {
  await requireAuth();
  return <SavedCollectionsView />;
}
