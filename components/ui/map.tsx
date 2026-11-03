"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
const Context = createContext<google.maps.Map | null>(null);
let loading: Promise<void> | undefined;
function loadGoogleMaps() {
  if (typeof google !== "undefined" && google.maps?.Map)
    return Promise.resolve();
  return (loading ??= new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Google Maps ist noch nicht konfiguriert."));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=de`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined;
      reject(new Error("Google Maps konnte nicht geladen werden."));
    };
    document.head.appendChild(script);
  }));
}
export function Map({
  center,
  zoom = 13,
  className,
  children,
}: {
  center: [number, number];
  zoom?: number;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef({ center, zoom });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(() => {
        if (active && ref.current)
          setMap(
            new google.maps.Map(ref.current, {
              center: {
                lat: initial.current.center[0],
                lng: initial.current.center[1],
              },
              zoom: initial.current.zoom,
              streetViewControl: false,
              mapTypeControl: false,
            }),
          );
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className={cn("relative h-full min-h-80 w-full", className)}>
      <div ref={ref} className="absolute inset-0" />
      {error && (
        <p
          role="alert"
          className="absolute inset-0 grid place-content-center bg-slate-100 p-6 text-sm"
        >
          {error}
        </p>
      )}
      <Context.Provider value={map}>{children}</Context.Provider>
    </div>
  );
}
export function MapMarker({
  position,
  children,
}: {
  position: [number, number];
  children?: ReactNode;
}) {
  const map = useContext(Context);
  useEffect(() => {
    if (!map) return;
    const marker = new google.maps.Marker({
      map,
      position: { lat: position[0], lng: position[1] },
      title: typeof children === "string" ? children : "Restaurant",
    });
    return () => marker.setMap(null);
  }, [map, position, children]);
  return null;
}
export function MapClickHandler({
  onSelect,
}: {
  onSelect: (latitude: number, longitude: number) => void;
}) {
  const map = useContext(Context);
  useEffect(() => {
    const listener = map?.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (event.latLng) onSelect(event.latLng.lat(), event.latLng.lng());
      },
    );
    return () => listener?.remove();
  }, [map, onSelect]);
  return null;
}
export function MapView({ center }: { center: [number, number] }) {
  const map = useContext(Context);
  useEffect(() => {
    map?.panTo({ lat: center[0], lng: center[1] });
  }, [map, center]);
  return null;
}
