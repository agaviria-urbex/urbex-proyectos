'use client';

import { useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import * as L from 'leaflet';
import type { GeoData } from '../../types';
import 'leaflet/dist/leaflet.css';

interface MapWithLegendProps {
  geoData: GeoData;
  centroide?: {
    marker: string;
    latitud: number;
    longitud: number;
  };
  center?: [number, number];
  zoom?: number;
}

function createCustomIcon(iconUrl: string) {
  return new L.Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export function MapWithLegend({
  geoData,
  centroide,
  center = [4.687115, -74.056937],
  zoom = 11,
}: MapWithLegendProps) {
  const mapRef = useRef<L.Map | null>(null);

  const getColorScale = () => {
    if (!geoData?.features) {
      return { ticks: [0, 25, 50, 75, 100] };
    }

    const conteos = geoData.features
      .map((feature) => feature.properties?.conteo || 0)
      .filter((c) => c > 0);

    if (conteos.length === 0) {
      return { ticks: [0, 2, 4, 6, 8, 10] };
    }

    const max = Math.max(...conteos);
    let ticks: number[];
    if (max <= 10) {
      ticks = Array.from({ length: max + 1 }, (_, i) => i);
    } else if (max <= 100) {
      const step = Math.max(1, Math.floor(max / 5));
      ticks = Array.from({ length: 6 }, (_, i) => i * step);
    } else {
      ticks = Array.from({ length: 6 }, (_, i) => Math.floor((i * max) / 5));
    }

    return { ticks: Array.from(new Set(ticks)).sort((a, b) => a - b) };
  };

  const styleFeature = (feature?: GeoJSON.Feature) => ({
    color: (feature?.properties as { color?: string } | undefined)?.color || '#00ff00',
    weight: 1,
    fillOpacity: 0.4,
  });

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties as
      | { nombre?: string; conteo?: number }
      | undefined;
    if (props?.nombre && props?.conteo !== undefined) {
      const isBarrio = props.nombre.includes('SANTA');
      const tipo = isBarrio ? 'Barrio catastral' : 'Localidad';
      layer.bindPopup(
        `<b>${tipo}:</b> ${props.nombre}<br><b>Registros:</b> ${props.conteo.toLocaleString('es-CO')}`
      );
    }
  };

  const { ticks } = getColorScale();

  return (
    <div className="relative h-full">
      <div className="absolute right-4 top-4 z-[1000] rounded-lg border border-gray-300 bg-white p-4 text-sm shadow-lg">
        <div className="mb-2 font-bold">Registros</div>
        <div
          className="mb-2 h-5 w-48 rounded"
          style={{
            background:
              'linear-gradient(to right, #440154, #443983, #31688e, #35b779, #fde725)',
          }}
        />
        <div className="flex w-48 justify-between text-xs">
          {ticks.map((tick) => (
            <span key={tick}>{tick.toLocaleString('es-CO')}</span>
          ))}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {geoData?.features && (
          <GeoJSON
            data={geoData as GeoJSON.FeatureCollection}
            style={styleFeature}
            onEachFeature={onEachFeature}
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
