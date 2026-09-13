"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { AdminRestaurantPayload, RestaurantItem, RestaurantPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />,
});

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export function RestaurantForm({
  restaurant,
  includeOwner = false,
  submitting = false,
  onSubmit,
  onCancel,
}: {
  restaurant?: RestaurantItem | null;
  includeOwner?: boolean;
  submitting?: boolean;
  onSubmit: (payload: RestaurantPayload | AdminRestaurantPayload) => void;
  onCancel?: () => void;
}) {
  const isEditing = Boolean(restaurant);
  const [title, setTitle] = useState(restaurant?.title ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [shortDescription, setShortDescription] = useState(restaurant?.shortDescription ?? "");
  const [price, setPrice] = useState(restaurant?.price?.toString() ?? "0");
  const [image, setImage] = useState(restaurant?.images?.[0] ?? "");
  const [address, setAddress] = useState(restaurant?.location?.address ?? "");
  const [city, setCity] = useState(restaurant?.location?.city ?? "");
  const [country, setCountry] = useState(restaurant?.location?.country ?? "");
  const [latitude, setLatitude] = useState(restaurant?.location?.latitude ?? 51.1657);
  const [longitude, setLongitude] = useState(restaurant?.location?.longitude ?? 10.4515);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    },
    [uploadPreview]
  );

  const selectImageFile = (file?: File) => {
    setIsDraggingImage(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Bitte wählen Sie eine gültige Bilddatei aus.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Das Bild darf maximal 20 MB groß sein.");
      return;
    }

    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setImageFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setImageError("");
    setPreviewFailed(false);
  };

  const clearSelectedFile = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setImageFile(null);
    setUploadPreview("");
    setPreviewFailed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectImageFile(event.target.files?.[0]);
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectImageFile(event.dataTransfer.files?.[0]);
  };

  const previewSource = uploadPreview || (isHttpUrl(image.trim()) ? image.trim() : "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!imageFile && ((!isEditing && !isHttpUrl(image.trim())) || (image.trim() && !isHttpUrl(image.trim())))) {
      setImageError("Bitte laden Sie ein Bild hoch oder geben Sie eine gültige Bild-URL ein.");
      return;
    }

    const originalImages = restaurant?.images ?? [];
    const currentImageUrl = image.trim();
    const existingImages = imageFile
      ? originalImages.slice(1)
      : currentImageUrl === originalImages[0]
        ? originalImages
        : [currentImageUrl, ...originalImages.slice(1)].filter(Boolean);
    const payload: RestaurantPayload = {
      title,
      description,
      shortDescription,
      price: Number(price) || 0,
      images: existingImages,
      imageFiles: imageFile ? [imageFile] : [],
      location: { address, city, country, latitude, longitude },
    };
    onSubmit(
      includeOwner && !isEditing
        ? {
            ...payload,
            owner: { name: ownerName, email: ownerEmail, password: ownerPassword, phoneNumber: ownerPhone },
          }
        : payload
    );
  };

  const labelClass = "flex flex-col gap-2 text-xs font-semibold text-[#334155]";
  return (
    <form onSubmit={submit} className="space-y-6">
      {includeOwner && !isEditing && (
        <fieldset className="grid gap-4 rounded-2xl border border-[#FEEFB3] bg-[#FFFBE9] p-5 sm:grid-cols-2">
          <legend className="px-2 text-sm font-bold text-[#1E1E1E]">Zugang des Restaurantbesitzers</legend>
          <label className={labelClass}>
            <span>Name</span>
            <Input required placeholder="Name des Besitzers" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </label>
          <label className={labelClass}>
            <span>E-Mail</span>
            <Input required type="email" placeholder="owner@example.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          </label>
          <label className={labelClass}>
            <span>Passwort</span>
            <Input required minLength={6} type="password" placeholder="Mindestens 6 Zeichen" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
          </label>
          <label className={labelClass}>
            <span>Telefon</span>
            <Input placeholder="+49 123 456789" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </label>
        </fieldset>
      )}
      <section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-[#FBFCFD]">
        <div className="border-b border-[#E8EDF2] bg-white px-5 py-4">
          <h3 className="text-sm font-bold text-[#1E1E1E]">Restaurantdaten</h3>
          <p className="mt-1 text-xs text-[#718096]">
            Stammdaten und Titelbild übersichtlich an einem Ort bearbeiten.
          </p>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span>Restaurantname</span>
              <Input
                required
                placeholder="z. B. Sonnengarten Restaurant"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className={labelClass}>
              <span>Startpreis (€)</span>
              <Input
                min="0"
                step="0.01"
                type="number"
                placeholder="0,00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span>Kurzbeschreibung</span>
              <Input
                placeholder="Kurze Zusammenfassung für Karten und Listen"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span>Detaillierte Beschreibung</span>
              <textarea
                required
                placeholder="Beschreiben Sie Ihr Restaurant..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-36 w-full resize-y rounded-xl border border-[#90CAF9] bg-white p-4 text-sm text-[#1E1E1E] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0097A7]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#334155]">Titelbild</p>
                <p className="mt-0.5 text-[11px] text-[#718096]">JPG, PNG oder WebP · max. 20 MB</p>
              </div>
              {previewSource && (
                <button
                  type="button"
                  disabled={submitting}
                  aria-label={imageFile ? "Neue Datei entfernen" : "Bild entfernen"}
                  onClick={() => {
                    setImageError("");
                    if (imageFile) clearSelectedFile();
                    else {
                      setImage("");
                      setPreviewFailed(false);
                    }
                  }}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title={imageFile ? "Neue Datei entfernen" : "Bild entfernen"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingImage(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={handleImageDrop}
              className={`relative aspect-[16/10] overflow-hidden rounded-2xl border-2 border-dashed transition ${
                isDraggingImage
                  ? "border-[#0097A7] bg-[#E8F8FA]"
                  : "border-[#B8DDE4] bg-white"
              }`}
            >
              {previewSource && !previewFailed ? (
                <Image
                  key={previewSource}
                  src={previewSource}
                  alt="Vorschau des Restaurantbildes"
                  fill
                  unoptimized={previewSource.startsWith("blob:")}
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover"
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F8FA] text-[#0097A7]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#334155]">
                    {previewFailed ? "Bild konnte nicht geladen werden" : "Bild hier ablegen"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#718096]">oder vom Gerät auswählen</p>
                </div>
              )}
              {previewSource && !previewFailed && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-8">
                  <p className="truncate text-[11px] font-medium text-white">
                    {imageFile?.name ?? "Aktuelles Titelbild"}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleImageFileChange}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#0097A7] text-[#00879D] hover:bg-[#E8F8FA]"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              <span>{imageFile ? "Andere Datei wählen" : "Bild hochladen"}</span>
            </Button>

            {imageError && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {imageError}
              </p>
            )}
            {isEditing && (!image || imageFile) && (
              <p className="text-xs text-[#718096]">
                Das bisherige Titelbild wird erst beim Speichern entfernt. Abbrechen behält das gespeicherte Bild. Nicht mehr verwendete Cloudinary-Dateien werden anschließend gelöscht.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-[#FBFCFD]">
        <div className="border-b border-[#E8EDF2] bg-white px-5 py-4">
          <h3 className="text-sm font-bold text-[#1E1E1E]">Restaurantstandort</h3>
          <p className="mt-1 text-xs text-[#718096]">
            Die Markierung bestimmt, wo das Restaurant in der App angezeigt und für Check-ins gefunden wird.
          </p>
        </div>
        <div className="space-y-5 p-5">
          <LocationPickerMap
            value={{ latitude, longitude, address, city, country }}
            onChange={(location) => {
              setLatitude(location.latitude);
              setLongitude(location.longitude);
              if (location.address) setAddress(location.address);
              if (location.city) setCity(location.city);
              if (location.country) setCountry(location.country);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span>Adresse</span>
              <Input
                required
                placeholder="Straße und Hausnummer"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
            <label className={labelClass}>
              <span>Stadt</span>
              <Input
                required
                placeholder="z. B. Berlin"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className={labelClass}>
              <span>Land</span>
              <Input
                required
                placeholder="z. B. Deutschland"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </label>
          </div>
        </div>
      </section>
      <div className="-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-[#E8EDF2] bg-white px-6 py-4 sm:-mx-8 sm:-mb-8 sm:flex-row sm:justify-end sm:gap-3 sm:px-8">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="sm:min-w-32">
            <span>Abbrechen</span>
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="sm:min-w-48">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span>
            {isEditing
              ? "Änderungen speichern"
              : includeOwner
              ? "Restaurant direkt erstellen"
              : "Zur Genehmigung einreichen"}
          </span>
        </Button>
      </div>
    </form>
  );
}
