"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  LocationSourceField,
  type Coordinates,
  type LocationSource,
} from "@/features/locations/components/location-source-field";
import { LocationDetailsFields } from "@/features/locations/components/location-details-fields";
import {
  LocationImagesField,
  type LocationImageItem,
} from "@/features/locations/components/location-images-field";
import { LocationVisibilityField } from "@/features/locations/components/location-visibility-field";
import type { LocationVisibility } from "@/features/locations/constants";
import {
  useCreateLocation,
  usePurchaseLocationPromotion,
} from "@/features/locations/hooks/use-locations";
import { uploadLocationImages } from "@/features/locations/lib/cloudinary-upload";
import {
  isGoogleMapsShareUrl,
  normalizeLocationName,
} from "@/features/locations/utils";
import { PromotionPlanSelector } from "@/features/locations/components/promotion-plan-selector";
import type { PromotionPlan } from "@/features/locations/constants/promotion-plans";

export function LocationForm() {
  const router = useRouter();
  const createLocation = useCreateLocation();
  const purchaseLocationPromotion = usePurchaseLocationPromotion();
  const [source, setSource] = useState<LocationSource>("CURRENT");
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationNameEdited, setLocationNameEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [mapsShareUrl, setMapsShareUrl] = useState("");
  const [images, setImages] = useState<LocationImageItem[]>([]);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [visibility, setVisibility] = useState<LocationVisibility>("PRIVATE");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [promotionPlan, setPromotionPlan] = useState<PromotionPlan>("FREE");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const tags = [
    ...new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
  const hasInvalidTags = tags.length > 10 || tags.some((tag) => tag.length > 30);

  const saveLocation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasInvalidTags) {
      toast.error("Use up to 10 tags, with no more than 30 characters per tag");
      return;
    }
    if (source === "CURRENT" && !coordinates) {
      toast.error("Find your current location before saving");
      return;
    }
    if (source === "MAPS" && !isGoogleMapsShareUrl(mapsShareUrl.trim())) {
      toast.error("Paste a valid Google Maps share link before saving");
      return;
    }

    setIsUploadingImages(true);
    let imageUrls: string[];
    try {
      imageUrls = await uploadLocationImages(
        images.flatMap((image) => (image.type === "file" ? [image.file] : [])),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload location images");
      setIsUploadingImages(false);
      return;
    }
    setIsUploadingImages(false);

    let uploadedIndex = 0;
    const orderedImageUrls = images.map((image) =>
      image.type === "saved" ? image.url : imageUrls[uploadedIndex++],
    );
    const common = {
      name: name.trim(),
      locationName,
      description: description.trim() || undefined,
      tags,
      images: orderedImageUrls,
      imagePositionX: imagePosition.x,
      imagePositionY: imagePosition.y,
      visibility,
    };
    const locationInput =
      source === "CURRENT" && coordinates
        ? { ...common, source, ...coordinates }
        : source === "MAPS"
          ? { ...common, source, mapsUrl: mapsShareUrl.trim() }
          : null;

    if (!locationInput) {
      toast.error("Find your current location before saving");
      return;
    }

    try {
      const location = await createLocation.mutateAsync(locationInput);
      if (promotionPlan === "FREE") {
        toast.success("Location saved to your collection");
        router.push("/locations");
        return;
      }

      setIsStartingCheckout(true);
      try {
        await purchaseLocationPromotion.purchase({
          locationId: location.id,
          locationSlug: location.locationName,
          plan: promotionPlan,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Location saved as Free. ${error.message}`
            : "Location saved as Free, but checkout could not start. You can try again later.",
        );
        router.push("/locations");
      } finally {
        setIsStartingCheckout(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save this location",
      );
    }
  };

  return (
    <form onSubmit={saveLocation} className="space-y-6">
      <LocationSourceField
        source={source}
        onSourceChange={setSource}
        coordinates={coordinates}
        onCoordinatesChange={setCoordinates}
        mapsShareUrl={mapsShareUrl}
        onMapsShareUrlChange={setMapsShareUrl}
      />
      <LocationDetailsFields
        name={name}
        onNameChange={(value) => {
          setName(value);
          if (!locationNameEdited) setLocationName(normalizeLocationName(value));
        }}
        locationName={locationName}
        onLocationNameChange={(value) => {
          setLocationName(normalizeLocationName(value));
          setLocationNameEdited(true);
        }}
        description={description}
        onDescriptionChange={setDescription}
        tagsInput={tagsInput}
        onTagsInputChange={setTagsInput}
        tags={tags}
        hasInvalidTags={hasInvalidTags}
      />
      <LocationImagesField
        images={images}
        onImagesChange={setImages}
        imagePositionX={imagePosition.x}
        imagePositionY={imagePosition.y}
        onImagePositionChange={setImagePosition}
      />
      <LocationVisibilityField value={visibility} onChange={setVisibility} />

      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
        <legend className="px-1 font-semibold">Choose a promotion</legend>
        <p className="text-sm text-muted-foreground">
          Select Free or choose a one-time promotion. Paid options continue to
          Polar checkout after your location is saved; prices are shown there.
        </p>
        <PromotionPlanSelector
          value={promotionPlan}
          onChange={setPromotionPlan}
          disabled={createLocation.isPending || isStartingCheckout}
        />
      </fieldset>

      <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
        <Link
          href="/locations"
          className={`${buttonVariants({ variant: "ghost" })} min-h-11 w-full justify-start sm:w-auto`}
        >
          <ArrowLeftIcon />
          Cancel
        </Link>
        <Button
          type="submit"
          size="lg"
          disabled={
            createLocation.isPending ||
            isStartingCheckout ||
            isUploadingImages ||
            hasInvalidTags ||
            (source === "MAPS" && !isGoogleMapsShareUrl(mapsShareUrl.trim()))
          }
          className="min-h-11 w-full sm:w-auto"
        >
          {isUploadingImages || isStartingCheckout ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SparklesIcon />
          )}
          {isUploadingImages
            ? "Uploading photos..."
            : isStartingCheckout
              ? "Opening checkout..."
            : createLocation.isPending
              ? "Saving your gem..."
              : promotionPlan === "FREE"
                ? "Save location"
                : "Save & continue to payment"}
        </Button>
      </div>
    </form>
  );
}
