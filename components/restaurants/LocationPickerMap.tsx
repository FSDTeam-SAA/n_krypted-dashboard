"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Map, MapClickHandler, MapMarker, MapView } from "@/components/ui/map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from '@/lib/api';

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
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const center = useMemo<[number, number]>(() => [Number.isFinite(value.latitude) ? value.latitude : 51.1657, Number.isFinite(value.longitude) ? value.longitude : 10.4515], [value.latitude, value.longitude]);
  useEffect(() => () => { requestId.current++; }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const request = ++requestId.current;
    setSearching(true);
    setError('');
    try {
      const response = await api.get('/maps/geocode', { params: { latlng: `${latitude},${longitude}` } });
      const result = response.data.data[0];
      if (request !== requestId.current) return;
      onChange({
        latitude,
        longitude,
        address: result?.address || value.address,
        city: result?.city || value.city,
        country: result?.country || value.country,
      });
    } catch {
      if (request !== requestId.current) return;
      onChange({ ...value, latitude, longitude });
      setError('Koordinaten übernommen. Bitte die Adresse im Formular prüfen.');
    } finally {
      if (request === requestId.current) setSearching(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    const request = ++requestId.current;
    setSearching(true);
    try {
      setError('');
      const response = await api.get('/maps/geocode', { params: { address: query } });
      const [result] = response.data.data;
      if (request !== requestId.current) return;
      if (result) onChange(result);
      else setError('Kein Standort gefunden.');
    } catch (e) {
      if (request !== requestId.current) return;
      setError(getApiErrorMessage(e, 'Standortsuche fehlgeschlagen.'));
    } finally {
      if (request === requestId.current) setSearching(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) { setError('Standortbestimmung wird von diesem Browser nicht unterstützt.'); return; }
    const request = ++requestId.current;
    setSearching(true);
    setError('');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request === requestId.current) void reverseGeocode(coords.latitude, coords.longitude);
    }, () => {
      if (request === requestId.current) { setSearching(false); setError('Standort nicht verfügbar. Bitte Berechtigung prüfen oder eine Adresse suchen.'); }
    }, { enableHighAccuracy: true, timeout: 15000 });
  };

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
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
            disabled={searching}
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
