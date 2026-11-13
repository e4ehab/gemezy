'use client';

import { useEffect, useRef, useState } from 'react';
import { CameraIcon, ImagePlusIcon } from 'lucide-react';
import NextImage from 'next/image';
import { authClient } from '@/lib/auth-client';
import { toast } from '@/components/ui/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUpdateProfileImage } from '@/features/profile/hooks/use-profile';
import { uploadProfileImage } from '@/features/profile/lib/profile-image-upload';

const CROP_SIZE = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type CropOffset = { x: number; y: number };
type PointerPoint = { x: number; y: number };
type SelectedImage = { url: string; width: number; height: number };
type CropGesture =
  | {
      type: 'drag';
      pointerId: number;
      pointerX: number;
      pointerY: number;
      offset: CropOffset;
    }
  | {
      type: 'pinch';
      pointerIds: [number, number];
      distance: number;
      zoom: number;
    };

function getBaseScale(image: SelectedImage) {
  return Math.max(CROP_SIZE / image.width, CROP_SIZE / image.height);
}

function clampOffset(image: SelectedImage, zoom: number, offset: CropOffset): CropOffset {
  const scale = getBaseScale(image) * zoom;
  const maxX = Math.max(0, (image.width * scale - CROP_SIZE) / 2);
  const maxY = Math.max(0, (image.height * scale - CROP_SIZE) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  };
}

function getPointerIds(points: Map<number, PointerPoint>): [number, number] | null {
  const [first, second] = Array.from(points.keys());
  return first === undefined || second === undefined ? null : [first, second];
}

function getDistance(first: PointerPoint, second: PointerPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function createCroppedImage(image: SelectedImage, zoom: number, offset: CropOffset) {
  return new Promise<Blob>((resolve, reject) => {
    const element = new Image();
    element.onload = () => {
      const scale = getBaseScale(image) * zoom;
      const sourceSize = CROP_SIZE / scale;
      const sourceX = (image.width - sourceSize) / 2 - offset.x / scale;
      const sourceY = (image.height - sourceSize) / 2 - offset.y / scale;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Could not prepare the cropped profile photo.'));
        return;
      }

      context.drawImage(
        element,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not prepare the cropped profile photo.'));
      }, 'image/jpeg', 0.92);
    };
    element.onerror = () => reject(new Error('Could not read the selected photo.'));
    element.src = image.url;
  });
}

export function ProfileImageEditor({ image, name }: { image: string | null; name: string }) {
  const updateImage = useUpdateProfileImage();
  const { refetch: refreshSession } = authClient.useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerPositionsRef = useRef(new Map<number, PointerPoint>());
  const gestureRef = useRef<CropGesture | null>(null);
  const cropStateRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!selectedImage) return;
    return () => URL.revokeObjectURL(selectedImage.url);
  }, [selectedImage]);

  const initials = name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const scale = selectedImage ? getBaseScale(selectedImage) * zoom : 1;
  const previewStyle = selectedImage
    ? {
        width: selectedImage.width * scale,
        height: selectedImage.height * scale,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
      }
    : undefined;

  const updateCrop = (nextZoom: number, nextOffset: CropOffset) => {
    cropStateRef.current = { zoom: nextZoom, offset: nextOffset };
    setZoom(nextZoom);
    setOffset(nextOffset);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const points = pointerPositionsRef.current;
    if (points.size >= 2) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pointerIds = getPointerIds(points);
    if (pointerIds && selectedImage) {
      const first = points.get(pointerIds[0]);
      const second = points.get(pointerIds[1]);
      if (!first || !second) return;
      gestureRef.current = {
        type: 'pinch',
        pointerIds,
        distance: Math.max(1, getDistance(first, second)),
        zoom: cropStateRef.current.zoom,
      };
      return;
    }

    gestureRef.current = {
      type: 'drag',
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offset: cropStateRef.current.offset,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedImage) return;
    const points = pointerPositionsRef.current;
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = gestureRef.current;
    if (gesture?.type === 'drag' && gesture.pointerId === event.pointerId) {
      const nextOffset = clampOffset(selectedImage, cropStateRef.current.zoom, {
        x: gesture.offset.x + event.clientX - gesture.pointerX,
        y: gesture.offset.y + event.clientY - gesture.pointerY,
      });
      cropStateRef.current = { ...cropStateRef.current, offset: nextOffset };
      setOffset(nextOffset);
      return;
    }

    if (gesture?.type === 'pinch') {
      const first = points.get(gesture.pointerIds[0]);
      const second = points.get(gesture.pointerIds[1]);
      if (!first || !second) return;
      const distance = getDistance(first, second);
      const nextZoom = Math.min(3, Math.max(1, gesture.zoom * distance / gesture.distance));
      updateCrop(
        nextZoom,
        clampOffset(selectedImage, nextZoom, cropStateRef.current.offset),
      );
    }
  };

  const handlePointerEnd = (pointerId: number) => {
    const points = pointerPositionsRef.current;
    points.delete(pointerId);

    if (gestureRef.current?.type === 'pinch' && points.size === 1) {
      const [remainingId, point] = Array.from(points.entries())[0];
      gestureRef.current = {
        type: 'drag',
        pointerId: remainingId,
        pointerX: point.x,
        pointerY: point.y,
        offset: cropStateRef.current.offset,
      };
    } else if (points.size === 0) {
      gestureRef.current = null;
    }
  };

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error('Choose a JPG, PNG, WEBP, or AVIF image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Profile photos must be 10 MB or smaller.');
      return;
    }

    const url = URL.createObjectURL(file);
    const preview = new Image();
    preview.onload = () => {
      setSelectedImage({ url, width: preview.naturalWidth, height: preview.naturalHeight });
      updateCrop(1, { x: 0, y: 0 });
      setDialogOpen(true);
    };
    preview.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('Could not read the selected photo.');
    };
    preview.src = url;
  };

  const saveImage = async () => {
    if (!selectedImage) return;
    try {
      const croppedBlob = await createCroppedImage(selectedImage, zoom, offset);
      const croppedFile = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      const imageUrl = await uploadProfileImage(croppedFile);
      await updateImage.mutateAsync({ image: imageUrl });
      await refreshSession();
      setDialogOpen(false);
      setSelectedImage(null);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your profile photo.');
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    const nextOffset = selectedImage
      ? clampOffset(selectedImage, nextZoom, cropStateRef.current.offset)
      : cropStateRef.current.offset;
    updateCrop(nextZoom, nextOffset);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/avif,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          selectImage(event.currentTarget.files?.[0]);
          event.currentTarget.value = '';
        }}
      />
      <div className="group relative">
        <Avatar className="size-16 border border-border sm:size-20">
          <AvatarImage src={image ?? undefined} alt={name} />
          <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -right-2 -bottom-2 size-9 rounded-full border shadow-sm"
          aria-label="Change profile photo"
          title="Change profile photo"
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon />
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (updateImage.isPending) return;
          setDialogOpen(open);
          if (!open) {
            setSelectedImage(null);
            pointerPositionsRef.current.clear();
            gestureRef.current = null;
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust your profile photo</DialogTitle>
            <DialogDescription>
              Drag to reposition. Pinch to zoom on mobile, or use the zoom slider.
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-5">
              <div
                className="relative mx-auto size-64 touch-none overflow-hidden rounded-lg bg-muted"
                tabIndex={0}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 20 : 5;
                  const movement: Record<string, CropOffset> = {
                    ArrowDown: { x: 0, y: -step },
                    ArrowLeft: { x: step, y: 0 },
                    ArrowRight: { x: -step, y: 0 },
                    ArrowUp: { x: 0, y: step },
                  };
                  const delta = movement[event.key];
                  if (!delta) return;
                  event.preventDefault();
                  updateCrop(
                    cropStateRef.current.zoom,
                    clampOffset(selectedImage, cropStateRef.current.zoom, {
                      x: cropStateRef.current.offset.x + delta.x,
                      y: cropStateRef.current.offset.y + delta.y,
                    }),
                  );
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => handlePointerEnd(event.pointerId)}
                onPointerCancel={(event) => handlePointerEnd(event.pointerId)}
                role="group"
                aria-label="Adjust the profile photo crop. Drag or pinch to zoom, or use the arrow keys."
              >
                <NextImage
                  src={selectedImage.url}
                  width={Math.ceil(selectedImage.width * scale)}
                  height={Math.ceil(selectedImage.height * scale)}
                  unoptimized
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={previewStyle}
                />
                <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
              </div>

              <div className="flex items-center gap-3">
                <ImagePlusIcon className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  aria-label="Zoom photo"
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => handleZoomChange(Number(event.currentTarget.value))}
                  className="h-8 cursor-pointer border-0 px-0"
                />
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={updateImage.isPending}
              >
                Choose a different photo
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedImage(null);
                pointerPositionsRef.current.clear();
                gestureRef.current = null;
              }}
              disabled={updateImage.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveImage} disabled={!selectedImage || updateImage.isPending}>
              {updateImage.isPending ? 'Saving...' : 'Save photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
