"use client";

import { ReactNode, useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { cn } from "@/lib/utils";

export function Map({
  center,
  zoom = 13,
  className,
  children,
}: {
  center: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className={cn("relative z-0 h-full min-h-80 w-full rounded-2xl", className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  );
}

export function MapMarker({
  position,
  children,
}: {
  position: LatLngExpression;
  children?: ReactNode;
}) {
  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0097A7", fillOpacity: 1 }}
    >
      {children ? <Popup>{children}</Popup> : null}
    </CircleMarker>
  );
}

export function MapClickHandler({
  onSelect,
}: {
  onSelect: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function MapView({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  useEffect(() => {
    const container = map.getContainer();
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  return null;
}
