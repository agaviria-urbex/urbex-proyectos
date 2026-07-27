'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// leaflet.heat has no official types
import 'leaflet.heat';

import type { KiaHeatFilters, KiaHeatmapPayload } from '../../types';
import type { LayerToggles } from './HeatmapFilters';
import {
  fmt,
  fmtV,
  hasDims,
  locNames,
  makeBreaks,
  pointWeight,
  quantile,
  rampColor,
  selValues,
  normSearch,
} from '../../utils/heatmap';

interface HeatmapMapProps {
  data: KiaHeatmapPayload;
  filters: KiaHeatFilters;
  layers: LayerToggles;
  basemap: string;
  searchQuery: string;
  searchToken: number;
  onReady?: (api: {
    fitLocalidad: (name: string) => void;
    invalidate: () => void;
  }) => void;
}

const BASE_URLS: Record<string, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  voyager:
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export function HeatmapMap({
  data,
  filters,
  layers,
  basemap,
  searchQuery,
  searchToken,
  onReady,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    base: L.TileLayer | null;
    loc: L.GeoJSON | null;
    sec: L.GeoJSON | null;
    bounds: L.GeoJSON | L.LayerGroup | null;
    heat: L.Layer | null;
    points: L.MarkerClusterGroup | null;
    locBounds: Record<string, L.Layer>;
    secByName: Record<string, L.Layer>;
    didFit: boolean;
  }>({
    base: null,
    loc: null,
    sec: null,
    bounds: null,
    heat: null,
    points: null,
    locBounds: {},
    secByName: {},
    didFit: false,
  });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const dataRef = useRef(data);
  dataRef.current = data;
  const layersToggleRef = useRef(layers);
  layersToggleRef.current = layers;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const S = data.stats;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      preferCanvas: true,
    }).setView(S.center || [4.65, -74.1], 11);
    L.control.scale({ imperial: false }).addTo(map);
    mapRef.current = map;

    const base = L.tileLayer(BASE_URLS.light, {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
    layersRef.current.base = base;

    const LOCS = locNames(data);
    const locIdx: Record<string, number> = {};
    LOCS.forEach((n, i) => {
      locIdx[n] = i;
    });

    const styleLoc = (f: GeoJSON.Feature) => {
      const st = filtersRef.current;
      const CUR = selValues(dataRef.current, st);
      const CUR_BR = makeBreaks(CUR.vals);
      const name = String(f.properties?.localidad || '');
      const i = locIdx[name];
      const c = i == null ? 0 : CUR.vals[i];
      const col = rampColor(c, CUR_BR);
      return col
        ? { color: '#fff', weight: 1, fillColor: col, fillOpacity: 0.62 }
        : {
            color: '#CFCFCF',
            weight: 0.8,
            fillColor: '#F2F2F2',
            fillOpacity: 0.35,
          };
    };

    const locBounds: Record<string, L.Layer> = {};
    const loc =
      data.localidades &&
      L.geoJSON(data.localidades as GeoJSON.GeoJsonObject, {
        style: styleLoc as L.StyleFunction,
        onEachFeature: (f, l) => {
          const p = f.properties || {};
          const name = String(p.localidad || '');
          locBounds[name] = l;
          l.bindTooltip(
            () => {
              const st = filtersRef.current;
              const CUR = selValues(dataRef.current, st);
              const i = locIdx[name];
              return `<b>${name}</b><br>${
                CUR.unit === '$M'
                  ? fmtV(i == null ? 0 : CUR.vals[i])
                  : fmt(i == null ? 0 : CUR.vals[i])
              } ${CUR.unit === '$M' ? '' : 'carros'}${
                CUR.tag ? ` · ${CUR.tag}` : ''
              }`;
            },
            { sticky: true }
          );
          l.bindPopup(() => {
            const st = filtersRef.current;
            const CUR = selValues(dataRef.current, st);
            const i = locIdx[name];
            const cv = i == null ? 0 : CUR.vals[i];
            const filtered =
              st.brand >= 0 || st.year >= 0 || st.metric === 'val';
            const selLine = filtered
              ? `<span>${CUR.tag || 'Selección'}:</span> <b>${
                  CUR.unit === '$M' ? fmtV(cv) : fmt(cv)
                }</b><br>`
              : '';
            return `<div style="font-weight:700">${name}</div>${selLine}
              <span>Puesto (total):</span> <b>#${p.rank}</b> de ${S.n_localidades}<br>
              <span>Carros (total):</span> <b>${fmt(p.count)}</b> (${p.pct}%)<br>
              ${
                p.valor
                  ? `<span>Valor avalúos:</span> ${fmtV(p.valor)} COP<br>`
                  : ''
              }
              ${
                p.top_marca && p.top_marca !== '—'
                  ? `<span>Marca top:</span> ${p.top_marca}<br>`
                  : ''
              }
              <span>Ubicaciones:</span> ${fmt(p.points)}`;
          });
          l.on('mouseover', () =>
            (l as L.Path).setStyle({ weight: 2.4, color: '#111' })
          );
          l.on('mouseout', () => loc!.resetStyle(l as L.Path));
        },
      });

    layersRef.current.loc = loc;
    layersRef.current.locBounds = locBounds;
    if (loc) loc.addTo(map);

    const SEC_BR = S.breaks || [];
    const secByName: Record<string, L.Layer> = {};
    const sec = L.geoJSON(data.sectors as GeoJSON.GeoJsonObject, {
      style: (f) => {
        const c = (f?.properties?.count as number) || 0;
        const col = rampColor(c, SEC_BR);
        return col
          ? { color: '#fff', weight: 0.5, fillColor: col, fillOpacity: 0.68 }
          : { color: '#D9D9D9', weight: 0.4, fill: false, opacity: 0.5 };
      },
      onEachFeature: (f, l) => {
        const p = f.properties || {};
        const n = String(p.SCANOMBRE || '');
        if (n && !secByName[n]) secByName[n] = l;
        l.bindTooltip(`<b>${n}</b><br>${fmt(p.count || 0)} carros`, {
          sticky: true,
        });
      },
    });
    layersRef.current.sec = sec;
    layersRef.current.secByName = secByName;

    const bounds = data.localidades
      ? L.geoJSON(data.localidades as GeoJSON.GeoJsonObject, {
          style: {
            color: '#111',
            weight: 1.1,
            fill: false,
            opacity: 0.4,
          },
          interactive: false,
        })
      : L.layerGroup();
    layersRef.current.bounds = bounds;

    const fitData = () => {
      try {
        const b = (loc || sec).getBounds();
        if (b.isValid()) {
          map.fitBounds(b, { padding: [16, 16] });
          if (map.getSize().x > 0) layersRef.current.didFit = true;
        }
      } catch {
        /* ignore */
      }
    };
    fitData();

    const invalidate = () => {
      map.invalidateSize(false);
      if (!layersRef.current.didFit) fitData();
    };

    const onResize = () => map.invalidateSize(false);
    window.addEventListener('resize', onResize);
    const ro =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            setTimeout(invalidate, 60);
          })
        : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    setTimeout(invalidate, 300);

    onReady?.({
      fitLocalidad: (name: string) => {
        const l = layersRef.current.locBounds[name];
        if (l && 'getBounds' in l) {
          try {
            map.fitBounds(
              (l as L.Polygon).getBounds(),
              { padding: [20, 20] }
            );
            (l as L.Polygon).openPopup();
          } catch {
            /* ignore */
          }
        }
      },
      invalidate,
    });

    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const prev = layersRef.current.base;
    if (prev) map.removeLayer(prev);
    const next = L.tileLayer(BASE_URLS[basemap] || BASE_URLS.light, {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
    next.bringToBack();
    layersRef.current.base = next;
  }, [basemap]);

  // rebuild heat + points when filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const dims = hasDims(data);
    const st = filters;
    const pts = data.points.filter(
      (p) =>
        (st.quality === 'all' || p[3] === st.quality) &&
        pointWeight(p, st, dims) > 0
    );
    const ws = pts.map((p) => pointWeight(p, st, dims));
    const cap = Math.max(2, quantile(ws, 0.97));

    if (layersRef.current.heat) {
      try {
        map.removeLayer(layersRef.current.heat);
      } catch {
        /* ignore */
      }
    }
    const heat = L.heatLayer(
      pts.map((p, i) => [p[0], p[1], Math.min(1, ws[i] / cap)]),
      {
        radius: 19,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.35,
        gradient: {
          0.2: '#FFEDA0',
          0.4: '#FEB24C',
          0.6: '#FD8D3C',
          0.8: '#EF5136',
          1.0: '#BB162B',
        },
      }
    );
    layersRef.current.heat = heat;
    if (layersToggleRef.current.heat && map.getSize().x > 0) {
      try {
        heat.addTo(map);
      } catch {
        /* ignore */
      }
    }

    if (layersRef.current.points) {
      try {
        map.removeLayer(layersRef.current.points);
      } catch {
        /* ignore */
      }
    }
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 45,
    });
    pts.forEach((p) => {
      const m = L.circleMarker([p[0], p[1]], {
        radius: 4 + Math.min(8, Math.log2(p[2] + 1)),
        color: '#111',
        weight: 1,
        fillColor: p[3] === 'A' ? '#FD8D3C' : '#111',
        fillOpacity: 0.75,
      });
      m.bindPopup(`<div style="font-weight:700">${p[4] || 'Dirección'}</div>
        <span>Carros en esta dirección:</span> <b>${fmt(p[2])}</b><br>
        ${p[5] ? `<span>Valor avalúos:</span> ${fmtV(p[5])} COP<br>` : ''}
        <span>Calidad:</span> ${p[3] === 'A' ? 'Ambiguo' : 'Éxito'}`);
      cluster.addLayer(m);
    });
    layersRef.current.points = cluster;
    if (layersToggleRef.current.points) cluster.addTo(map);

    // refresh choropleth styles
    const loc = layersRef.current.loc;
    if (loc) {
      const LOCS = locNames(data);
      const locIdx: Record<string, number> = {};
      LOCS.forEach((n, i) => {
        locIdx[n] = i;
      });
      const CUR = selValues(data, st);
      const CUR_BR = makeBreaks(CUR.vals);
      loc.setStyle((f) => {
        const name = String(f?.properties?.localidad || '');
        const i = locIdx[name];
        const c = i == null ? 0 : CUR.vals[i];
        const col = rampColor(c, CUR_BR);
        return col
          ? { color: '#fff', weight: 1, fillColor: col, fillOpacity: 0.62 }
          : {
              color: '#CFCFCF',
              weight: 0.8,
              fillColor: '#F2F2F2',
              fillOpacity: 0.35,
            };
      });
    }
  }, [data, filters]);

  // layer toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const r = layersRef.current;
    const sync = (
      layer: L.Layer | null,
      on: boolean
    ) => {
      if (!layer) return;
      if (on && !map.hasLayer(layer)) layer.addTo(map);
      if (!on && map.hasLayer(layer)) map.removeLayer(layer);
    };
    sync(r.loc, layers.loc);
    sync(r.heat, layers.heat);
    sync(r.sec, layers.sec);
    sync(r.points, layers.points);
    sync(r.bounds, layers.bounds);
  }, [layers]);

  // search
  useEffect(() => {
    if (!searchToken) return;
    const map = mapRef.current;
    if (!map || !searchQuery.trim()) return;
    const nq = normSearch(searchQuery);
    const LOCS = locNames(data);
    const ln =
      LOCS.find((n) => normSearch(n) === nq) ||
      LOCS.find((n) => normSearch(n).includes(nq));
    if (ln && layersRef.current.locBounds[ln]) {
      const l = layersRef.current.locBounds[ln] as L.Polygon;
      try {
        map.fitBounds(l.getBounds(), { padding: [20, 20] });
        l.openPopup();
      } catch {
        /* ignore */
      }
      return;
    }
    const names = Object.keys(layersRef.current.secByName);
    const sn =
      names.find((n) => normSearch(n) === nq) ||
      names.find((n) => normSearch(n).includes(nq));
    if (sn) {
      const l = layersRef.current.secByName[sn] as L.Polygon;
      try {
        if (!map.hasLayer(layersRef.current.sec!)) {
          layersRef.current.sec!.addTo(map);
        }
        map.fitBounds(l.getBounds(), { padding: [30, 30] });
        l.openTooltip(l.getBounds().getCenter());
      } catch {
        /* ignore */
      }
    }
  }, [searchToken, searchQuery, data]);

  return (
    <div
      ref={containerRef}
      className="h-[520px] w-full overflow-hidden rounded-lg border bg-gray-100"
    />
  );
}
