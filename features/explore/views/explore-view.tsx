import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExploreLocationsGrid } from "@/features/collections/components/explore-locations-grid";
import { getExploreLocations } from "@/features/explore/server/queries";

type ExploreViewProps = {
  search?: string | string[];
  page?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getPageHref(search: string, page: number) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export async function ExploreView({ search: searchParam, page: pageParam }: ExploreViewProps) {
  const search = firstParam(searchParam).trim().slice(0, 100);
  const requestedPage = Number.parseInt(firstParam(pageParam), 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const data = await getExploreLocations(search, page);
  const firstVisiblePage = Math.max(
    1,
    Math.min(data.page - 2, data.totalPages - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(5, data.totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
      <header className="space-y-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Discover</p>
          <h1 className="text-3xl font-semibold tracking-tight">Explore public places</h1>
          <p className="text-muted-foreground">
            Find places shared by the Gemezy community.
          </p>
        </div>
      </header>

      {data.items.length > 0 ? (
        <>
          <ExploreLocationsGrid locations={data.items} />

          {data.totalPages > 1 && (
            <nav
              aria-label="Explore pages"
              className="flex flex-wrap items-center justify-center gap-2 border-t border-border py-4"
            >
              <Link
                href={getPageHref(search, Math.max(1, data.page - 1))}
                aria-disabled={!data.hasPreviousPage}
                tabIndex={data.hasPreviousPage ? undefined : -1}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10",
                  !data.hasPreviousPage && "pointer-events-none opacity-50",
                )}
              >
                Previous
              </Link>
              {visiblePages.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={getPageHref(search, pageNumber)}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={pageNumber === data.page ? "page" : undefined}
                  className={cn(
                    buttonVariants({
                      variant: pageNumber === data.page ? "default" : "outline",
                    }),
                    "size-10",
                  )}
                >
                  {pageNumber}
                </Link>
              ))}
              <Link
                href={getPageHref(search, Math.min(data.totalPages, data.page + 1))}
                aria-disabled={!data.hasNextPage}
                tabIndex={data.hasNextPage ? undefined : -1}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10",
                  !data.hasNextPage && "pointer-events-none opacity-50",
                )}
              >
                Next
              </Link>
            </nav>
          )}
        </>
      ) : (
        <Card className="border-dashed bg-card/60">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SparklesIcon className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold">
              {search ? "No matching places" : "No public places yet"}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {search
                ? "Try a different place name, description, address, or tag."
                : "When the community shares places publicly, you’ll find them here."}
            </p>
            {search && (
              <Link href="/explore" className={cn(buttonVariants({ variant: "outline" }), "mt-1")}>
                Clear search
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}