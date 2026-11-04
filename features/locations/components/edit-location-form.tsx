"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { LocationDetailsFields } from "@/features/locations/components/location-details-fields";
import {
  LocationImagesField,
  type LocationImageItem,
} from "@/features/locations/components/location-images-field";
import { LocationVisibilityField } from "@/features/locations/components/location-visibility-field";
import type { LocationVisibility } from "@/features/locations/constants";
import {
  LocationSourceField,
  type Coordinates,
  type LocationSource,
} from "@/features/locations/components/location-source-field";
import {
  useSuspenseLocation,
  useUpdateLocation,
} from "@/features/locations/hooks/use-locations";
import { uploadLocationImages } from "@/features/locations/lib/cloudinary-upload";
import {
  isGoogleMapsShareUrl,
  normalizeLocationName,
} from "@/features/locations/utils";
import { cn } from "@/lib/utils";

export function EditLocationForm({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: location } = useSuspenseLocation(slug);
  const updateLocation = useUpdateLocation();
  const [source, setSource] = useState<LocationSource>(
    location.latitude !== null && location.longitude !== null ? "CURRENT" : "MAPS",
  );
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    location.latitude !== null && location.longitude !== null
      ? { latitude: location.latitude, longitude: location.longitude }
      : null,
  );
  const [name, setName] = useState(location.name);
  const [locationName, setLocationName] = useState(location.locationName);
  const [description, setDescription] = useState(location.description ?? "");
  const [tagsInput, setTagsInput] = useState(location.tags.join(", "));
  const [mapsShareUrl, setMapsShareUrl] = useState(
    isGoogleMapsShareUrl(location.mapsUrl) ? location.mapsUrl : "",
  );
  const [images, setImages] = useState<LocationImageItem[]>(() =>
    (location.images ?? []).map((url, index) => ({
      id: `saved-${index}-${url}`,
      type: "saved" as const,
      url,
    })),
  );
  const [imagePosition, setImagePosition] = useState({
    x: location.imagePositionX,
    y: location.imagePositionY,
  });
  const [visibility, setVisibility] = useState<LocationVisibility>(location.visibility);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const tags = [
    ...new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
  const hasInvalidTags = tags.length > 10 || tags.some((tag) => tag.length > 30);

  const saveChanges = async (event: React.FormEvent<HTMLFormElement>) => {
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
    let uploadedImages: string[];
    try {
      uploadedImages = await uploadLocationImages(
        images.flatMap((image) => (image.type === "file" ? [image.file] : [])),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload location images");
      setIsUploadingImages(false);
      return;
    }
    setIsUploadingImages(false);

    try {
      let uploadedIndex = 0;
      const orderedImageUrls = images.map((image) =>
        image.type === "saved" ? image.url : uploadedImages[uploadedIndex++],
      );
      const common = {
        slug,
        name: name.trim(),
        locationName,
        description: description.trim() || undefined,
        tags,
        images: orderedImageUrls,
        imagePositionX: imagePosition.x,
        imagePositionY: imagePosition.y,
        visibility,
      };
      let updatedLocation;
      if (source === "CURRENT") {
        const selectedCoordinates = coordinates;
        if (!selectedCoordinates) {
          toast.error("Find your current location before saving");
          return;
        }
        updatedLocation = await updateLocation.mutateAsync({
          ...common,
          source,
          ...selectedCoordinates,
        });
      } else {
        updatedLocation = await updateLocation.mutateAsync({
          ...common,
          source,
          mapsUrl: mapsShareUrl.trim(),
        });
      }
      toast.success("Location updated");
      router.replace(`/locations/${updatedLocation.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this location");
    }
  };

  return (
    <form onSubmit={saveChanges} className="space-y-6">
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
        onNameChange={setName}
        locationName={locationName}
        onLocationNameChange={(value) => setLocationName(normalizeLocationName(value))}
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

      <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/locations/${slug}`}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "min-h-11 w-full justify-start sm:-ml-2 sm:w-auto",
          )}
        >
          <ArrowLeftIcon />
          Cancel
        </Link>
        <Button
          type="submit"
          size="lg"
          disabled={
            updateLocation.isPending ||
            isUploadingImages ||
            hasInvalidTags ||
            (source === "MAPS" && !isGoogleMapsShareUrl(mapsShareUrl.trim()))
          }
          className="min-h-11 w-full sm:w-auto"
        >
          {updateLocation.isPending || isUploadingImages ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isUploadingImages
            ? "Uploading photos..."
            : updateLocation.isPending
              ? "Saving changes..."
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
