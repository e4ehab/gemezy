import Link from "next/link";
import { ArrowLeftIcon, MapPinIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LocationForm } from "@/features/locations/components/location-form";
import { requireAuth } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

export default async function NewLocationPage() {
  await requireAuth();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:space-y-7 sm:p-8 lg:p-10">
      <div className="space-y-5">
        <Link href="/locations" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeftIcon />
          My locations
        </Link>
        <header className="space-y-2">

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Save a new place</h1>
          <p className="max-w-xl text-muted-foreground">
            Add where you are or find a place on Google Maps, then give your new gem a name.
          </p>
        </header>
      </div>
      <LocationForm />
    </main>
  );
}
