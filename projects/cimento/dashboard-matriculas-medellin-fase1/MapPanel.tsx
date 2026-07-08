'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_LAYER_CONFIGS } from './layers';
import type { LayerData, LayerId } from './types';

interface MapPanelProps {
  layers: LayerData | null;
  visibleLayers: Record<LayerId, boolean>;
}

function getBounds(collection: GeoJSON.FeatureCollection) {
  const bounds = new mapboxgl.LngLatBounds();
  collection.features.forEach((feature) => {
    if (feature.geometry.type === 'Point') {
      bounds.extend(feature.geometry.coordinates as [number, number]);
    } else if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon) => {
        polygon[0].forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
      });
    }
  });
  return bounds;
}

function buildPopupHtml(props: Record<string, unknown>): string {
  const fields = [
    ['CBML', props.cbml],
    ['Matrícula', props.matricula_inmobiliaria],
    ['Dirección', props.direccion_predio || props.direccion],
    ['Destinación', props.destinacion_principal || props.destinacio],
    ['Estrato', props.estrato],
    ['Área terreno', props.area_terreno ? `${props.area_terreno} m²` : null],
    ['Avalúo', props.avaluototal],
  ];

  const rows = fields
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(
      ([label, value]) =>
        `<div><strong>${label}:</strong> ${String(value)}</div>`
    )
    .join('');

  return `<div style="min-width:180px">${rows || 'Sin atributos'}</div>`;
}

export function MapPanel({ layers, visibleLayers }: MapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN no configurado');
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-75.574, 6.208],
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point);
      if (!features.length) return;
      const html = buildPopupHtml(features[0].properties ?? {});
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    mapRef.current = map;
    initializedRef.current = true;

    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers) return;

    const updateLayers = () => {
      MAP_LAYER_CONFIGS.forEach((config) => {
        const sourceId = `source-${config.id}`;
        const data = layers[config.id];

        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(data);
        } else {
          map.addSource(sourceId, { type: 'geojson', data });

          if (config.geometryType === 'point') {
            map.addLayer({
              id: `layer-${config.id}`,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 6,
                'circle-color': config.color,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff',
              },
            });
          } else {
            map.addLayer({
              id: `layer-${config.id}-fill`,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': config.color,
                'fill-opacity': config.fillOpacity ?? 0.3,
              },
            });
            map.addLayer({
              id: `layer-${config.id}-line`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': config.color,
                'line-width': config.id === 'poligono' ? 3 : 1.5,
              },
            });
          }
        }
      });

      if (layers.poligono.features.length > 0) {
        const bounds = getBounds(layers.poligono);
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 17 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateLayers();
    } else {
      map.on('load', updateLayers);
    }
  }, [layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    MAP_LAYER_CONFIGS.forEach((config) => {
      const visibility = visibleLayers[config.id] ? 'visible' : 'none';
      const layerIds =
        config.geometryType === 'point'
          ? [`layer-${config.id}`]
          : [`layer-${config.id}-fill`, `layer-${config.id}-line`];

      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    });
  }, [visibleLayers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full rounded-lg overflow-hidden" />
      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-600">
          Configura NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para ver el mapa
        </div>
      )}
    </div>
  );
}
