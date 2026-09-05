"use client";

import { useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Map, MapClickHandler, MapMarker, MapView } from "@/components/ui/map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: PickedLocation;
  onChange: (location: PickedLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const center: [number, number] = [value.latitude || 51.1657, value.longitude || 10.4515];

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const result = await response.json();
      onChange({
        latitude,
        longitude,
        address: result.display_name || value.address,
        city: result.address?.city || result.address?.town || result.address?.village || value.city,
        country: result.address?.country || value.country,
      });
    } catch {
      onChange({ ...value, latitude, longitude });
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
      );
      const [result] = await response.json();
      if (result) await reverseGeocode(Number(result.lat), Number(result.lon));
    } finally {
      setSearching(false);
    }
  };

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      void reverseGeocode(coords.latitude, coords.longitude);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void search();
              }
            }}
            placeholder="Adresse oder Ort auf der Karte suchen"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="flex-1 sm:flex-none"
          >
            Suchen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={locate}
            title="Mein Standort"
            aria-label="Meinen Standort verwenden"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="relative z-0 isolate h-64 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-slate-100 shadow-inner sm:h-72">
        <Map center={center} className="min-h-0 rounded-none">
          <MapView center={center} />
          <MapClickHandler onSelect={(lat, lng) => void reverseGeocode(lat, lng)} />
          <MapMarker position={center}>Ausgewählter Restaurantstandort</MapMarker>
        </Map>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-[#F1F9FA] px-3 py-2.5 text-[#58747A]">
        <LocateFixed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0097A7]" />
        <p className="text-[11px] leading-4">
          Klicken Sie auf die Karte, suchen Sie eine Adresse oder verwenden Sie Ihren aktuellen Standort.
        </p>
      </div>
    </div>
  );
}
