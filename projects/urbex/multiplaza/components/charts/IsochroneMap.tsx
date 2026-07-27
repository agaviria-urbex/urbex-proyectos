'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IsochroneMapProps {
  geometry: string;
  centroide?: {
    marker: string;
    latitud: number;
    longitud: number;
  };
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function MapController({
  center,
  zoom,
}: {
  center?: [number, number];
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
}

function parsePolygonWKT(wkt: string): [number, number][] {
  try {
    const coordsString = wkt
      .replace(/^POLYGON\s*\(\(/i, '')
      .replace(/\)\)$/, '');
    return coordsString.split(',').map((coord) => {
      const [lng, lat] = coord.trim().split(/\s+/).map(Number);
      return [lat, lng] as [number, number];
    });
  } catch {
    return [];
  }
}

function createCustomIcon(iconUrl: string) {
  return new L.Icon({
    iconUrl,
    iconSize: [128, 128],
    iconAnchor: [64, 64],
    popupAnchor: [0, -64],
  });
}

export function IsochroneMap({
  geometry,
  centroide,
  center = [4.711, -74.0721],
  zoom = 13,
  className = 'h-96',
}: IsochroneMapProps) {
  const polygonCoords = parsePolygonWKT(geometry);

  const polygonCenter: [number, number] =
    polygonCoords.length > 0
      ? [
          polygonCoords.reduce((sum, coord) => sum + coord[0], 0) /
            polygonCoords.length,
          polygonCoords.reduce((sum, coord) => sum + coord[1], 0) /
            polygonCoords.length,
        ]
      : centroide
        ? [centroide.latitud, centroide.longitud]
        : center;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      <MapContainer
        center={polygonCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <MapController center={polygonCenter} zoom={zoom} />

        {polygonCoords.length > 0 && (
          <Polygon
            positions={polygonCoords}
            pathOptions={{
              color: '#a738cd',
              weight: 2,
              opacity: 0.8,
              fillColor: '#a738cd',
              fillOpacity: 0.3,
            }}
          />
        )}

        {centroide && (
          <Marker
            position={[centroide.latitud, centroide.longitud]}
            icon={createCustomIcon(centroide.marker)}
          />
        )}
      </MapContainer>
    </div>
  );
}
