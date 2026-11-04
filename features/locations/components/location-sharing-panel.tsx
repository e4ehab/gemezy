"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UsersIcon,
  Globe2Icon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLocationVisibility } from "@/features/locations/hooks/use-locations";
import {
  getLocationSharePath,
  getPublicLocationSharePath,
} from "@/features/locations/utils";
import type { LocationVisibility } from "@/features/locations/constants";

type Visibility = LocationVisibility;

type LocationSharingPanelProps = {
  slug: string;
  shareId: string;
  shareSlug: string | null;
  name: string;
  mapsUrl: string;
  visibility: Visibility;
};

const visibilityInfo = {
  PRIVATE: {
    label: "Private",
    description: "Only you can view this location. Sharing is disabled.",
    icon: ShieldCheckIcon,
  },
  FRIENDS_ONLY: {
    label: "Friends only",
    description: "Only you and your accepted friends can view this location.",
    icon: UsersIcon,
  },
  PUBLIC: {
    label: "Public",
    description: "Anyone can view it, and it may appear in Explore.",
    icon: Globe2Icon,
  },
} satisfies Record<Visibility, { label: string; description: string; icon: typeof UsersIcon }>;

export function LocationSharingPanel({
  slug,
  shareId,
  shareSlug,
  name,
  mapsUrl,
  visibility,
}: LocationSharingPanelProps) {
  const router = useRouter();
  const updateVisibility = useUpdateLocationVisibility();
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const sharePath = shareSlug
    ? getPublicLocationSharePath(shareSlug)
    : getLocationSharePath(shareId);
  const isShareable = visibility !== "PRIVATE";
  const CurrentIcon = visibilityInfo[visibility].icon;

  useEffect(() => {
    if (!isQrOpen || !isShareable) return;
    let cancelled = false;
    QRCode.toDataURL(new URL(sharePath, window.location.origin).toString(), {
      width: 280,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not create a QR code for this location");
      });
    return () => {
      cancelled = true;
    };
  }, [isQrOpen, isShareable, sharePath]);

  const copyShareLink = async () => {
    if (!isShareable) return;
    try {
      await navigator.clipboard.writeText(new URL(sharePath, window.location.origin).toString());
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy the share link");
    }
  };

  const shareOnWhatsApp = () => {
    if (!isShareable) return;
    const publicUrl = new URL(sharePath, window.location.origin).toString();
    const message = `Check out ${name}\n${publicUrl}\nOpen in Google Maps: ${mapsUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleVisibilityChange = async (value: string | null) => {
    if (value !== "PRIVATE" && value !== "PUBLIC" && value !== "FRIENDS_ONLY") return;
    try {
      await updateVisibility.mutateAsync({ slug, visibility: value });
      router.refresh();
      toast.success(
        value === "PRIVATE"
          ? "Location is now private"
          : value === "PUBLIC"
            ? "Location is now public"
            : "Location is now visible to friends only",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update sharing settings");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CurrentIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="font-semibold">Sharing</h2>
            <p className="max-w-lg text-sm text-muted-foreground">
              {visibilityInfo[visibility].description} 
            </p>
          </div>
        </div>
        <Select
          value={visibility}
          onValueChange={handleVisibilityChange}
          disabled={updateVisibility.isPending}
        >
          <SelectTrigger className="min-h-11 w-full sm:w-36" aria-label="Location sharing visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="FRIENDS_ONLY">Friends only</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {updateVisibility.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Updating sharing settings...
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={copyShareLink} disabled={!isShareable}>
          <CopyIcon />
          Copy share link
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={shareOnWhatsApp}
          disabled={!isShareable}
          className="min-h-11 w-full border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 sm:w-auto"
        >
          <MessageCircleIcon />
          Share via WhatsApp
        </Button>
        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
          <DialogTrigger
            render={
              <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={!isShareable}>
                <QrCodeIcon />
                Show QR code
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Share {name}</DialogTitle>
              <DialogDescription>
                Scan this code to open the shared location page.
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-72 items-center justify-center rounded-xl border bg-white p-4">
              {qrDataUrl ? (
                // QR images are generated locally in the browser and never uploaded.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR code for ${name}`} className="size-64" />
              ) : (
                <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button type="button" onClick={copyShareLink}>
              <CheckIcon />
              Copy share link
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
