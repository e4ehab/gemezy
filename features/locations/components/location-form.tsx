"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
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
import { useCreateLocation } from "@/features/locations/hooks/use-locations";
import { uploadLocationImages } from "@/features/locations/lib/cloudinary-upload";
import {
  isGoogleMapsShareUrl,
  normalizeLocationName,
} from "@/features/locations/utils";

export function LocationForm() {
  const router = useRouter();
  const createLocation = useCreateLocation();
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
    const callbacks = {
      onSuccess: () => {
        toast.success("Location saved to your collection");
        router.push("/locations");
      },
      onError: (error: { message: string }) =>
        toast.error(error.message || "Could not save this location"),
    };

    if (source === "CURRENT") {
      if (!coordinates) {
        toast.error("Find your current location before saving");
        return;
      }
      createLocation.mutate({ ...common, source, ...coordinates }, callbacks);
      return;
    }

    createLocation.mutate(
      { ...common, source, mapsUrl: mapsShareUrl.trim() },
      callbacks,
    );
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
            isUploadingImages ||
            hasInvalidTags ||
            (source === "MAPS" && !isGoogleMapsShareUrl(mapsShareUrl.trim()))
          }
          className="min-h-11 w-full sm:w-auto"
        >
          {isUploadingImages ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SparklesIcon />
          )}
          {isUploadingImages
            ? "Uploading photos..."
            : createLocation.isPending
              ? "Saving your gem..."
              : "Save location"}
        </Button>
      </div>
    </form>
  );
}
