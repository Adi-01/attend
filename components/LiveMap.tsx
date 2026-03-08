"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for missing marker icons in Leaflet with Next.js
const customUserIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const siteIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-5 h-5 bg-red-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper component to smoothly pan the map as the user moves
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

interface LiveMapProps {
  userLat: number;
  userLng: number;
  siteLat: number;
  siteLng: number;
  radius: number; // 500m
}

export default function LiveMap({
  userLat,
  userLng,
  siteLat,
  siteLng,
  radius,
}: LiveMapProps) {
  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-neutral-700 shadow-inner z-0 relative">
      <MapContainer
        center={[userLat, userLng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        {/* Dark Mode Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapUpdater center={[userLat, userLng]} />

        {/* Site Location & Geofence Circle */}
        <Marker position={[siteLat, siteLng]} icon={siteIcon} />
        <Circle
          center={[siteLat, siteLng]}
          radius={radius}
          pathOptions={{
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.1,
          }}
        />

        {/* User's Live Location */}
        <Marker position={[userLat, userLng]} icon={customUserIcon} />
      </MapContainer>
    </div>
  );
}
