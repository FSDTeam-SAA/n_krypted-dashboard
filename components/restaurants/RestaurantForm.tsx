"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminRestaurantPayload, RestaurantItem, RestaurantPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RestaurantPhoto, RestaurantPhotosEditor } from "./RestaurantPhotosEditor";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />,
});

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
  const [photos, setPhotos] = useState<RestaurantPhoto[]>(() =>
    (restaurant?.images ?? []).map((url, index) => ({
      id: String(index), url, category: restaurant?.photoCategories?.[index] ?? "other",
    }))
  );
  const [address, setAddress] = useState(restaurant?.location?.address ?? "");
  const [city, setCity] = useState(restaurant?.location?.city ?? "");
  const [country, setCountry] = useState(restaurant?.location?.country ?? "");
  const [latitude, setLatitude] = useState(restaurant?.location?.latitude ?? 51.1657);
  const [longitude, setLongitude] = useState(restaurant?.location?.longitude ?? 10.4515);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const orderedPhotos = [...photos.filter((photo) => photo.url), ...photos.filter((photo) => photo.file)];
    const payload: RestaurantPayload = {
      title,
      description,
      shortDescription,
      price: Number(price) || 0,
      images: orderedPhotos.flatMap((photo) => photo.url ? [photo.url] : []),
      imageFiles: orderedPhotos.flatMap((photo) => photo.file ? [photo.file] : []),
      photoCategories: orderedPhotos.map((photo) => photo.category),
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

        <div className="grid gap-6 p-5 lg:grid-cols-1">
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

        </div>
      </section>
      <RestaurantPhotosEditor photos={photos} onChange={setPhotos} disabled={submitting} />
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
