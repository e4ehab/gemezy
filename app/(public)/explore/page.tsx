import { ExploreView } from "@/features/explore/views/explore-view";

type ExplorePageProps = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  return <ExploreView search={params.search} page={params.page} />;
}