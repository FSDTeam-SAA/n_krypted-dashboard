"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PhotoCategory } from "@/lib/api";

export const photoLabels: Record<PhotoCategory, string> = {
  interior: "Innenbereich",
  exterior: "Außenbereich",
  other: "Weitere Restaurantbereiche",
};

export interface RestaurantPhoto {
  id: string;
  url?: string;
  file?: File;
  category: PhotoCategory;
}

function PhotoPreview({ photo }: { photo: RestaurantPhoto }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!photo.file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(photo.file);
    return () => {
      reader.onload = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [photo.file]);
  const source = photo.url || preview;
  return source ? (
    <Image src={source} alt={photoLabels[photo.category]} fill sizes="160px"
      unoptimized={Boolean(photo.file)} className="object-cover" />
  ) : null;
}

export function RestaurantPhotosEditor({ photos, onChange, disabled = false }: {
  photos: RestaurantPhoto[];
  onChange: (photos: RestaurantPhoto[]) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <section className="space-y-5 rounded-2xl border border-[#E8EDF2] bg-[#FBFCFD] p-5">
      <div>
        <h3 className="text-sm font-bold">Restaurantfotos</h3>
        <p className="mt-1 text-xs text-slate-500">Bis zu 4 Fotos pro Bereich. Das erste gespeicherte Foto erscheint auf der Restaurantkarte. Gerichtsfotos werden beim jeweiligen Gericht verwaltet.</p>
      </div>
      {(Object.entries(photoLabels) as [PhotoCategory, string][]).map(([category, label]) => {
        const items = photos.filter((photo) => photo.category === category);
        return (
          <fieldset key={category} disabled={disabled} className="space-y-3">
            <legend className="text-sm font-semibold">{label} ({items.length}/4)</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((photo) => (
                <div key={photo.id} className="space-y-2 rounded-xl border bg-white p-2">
                  <div className="relative h-28 overflow-hidden rounded-lg"><PhotoPreview photo={photo} /></div>
                  <select aria-label="Fotobereich" value={photo.category} className="w-full rounded border p-1 text-xs"
                    onChange={(event) => {
                      const target = event.target.value as PhotoCategory;
                      if (photos.filter((item) => item.category === target).length >= 4) {
                        setError("Maximal 4 Fotos pro Bereich."); return;
                      }
                      setError("");
                      onChange(photos.map((item) => item.id === photo.id ? { ...item, category: target } : item));
                    }}>
                    {Object.entries(photoLabels).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                  </select>
                  <button type="button" className="text-xs text-red-600" onClick={() => {
                    setError(""); onChange(photos.filter((item) => item.id !== photo.id));
                  }}>Entfernen</button>
                </div>
              ))}
            </div>
            <label className="block text-xs font-medium">
              Fotos hinzufügen (JPG, PNG, WebP, AVIF · max. 20 MB)
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={disabled || items.length >= 4} className="mt-2 block w-full text-xs"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  event.target.value = "";
                  if (files.some((file) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 20 * 1024 * 1024)) {
                    setError("Bitte gültige Bilddateien bis 20 MB auswählen."); return;
                  }
                  if (items.length + files.length > 4) { setError("Maximal 4 Fotos pro Bereich."); return; }
                  setError("");
                  onChange([...photos, ...files.map((file) => ({ id: crypto.randomUUID(), file, category }))]);
                }} />
            </label>
          </fieldset>
        );
      })}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
