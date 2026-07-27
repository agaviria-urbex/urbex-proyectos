import type { KiaHeatmapPayload, KiaLeadsPayload } from '../types';

export async function fetchKiaLeads(email: string): Promise<KiaLeadsPayload> {
  const res = await fetch('/api/kia/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Error cargando leads (${res.status})`);
  }
  return json.data as KiaLeadsPayload;
}

export async function fetchKiaHeatmap(email: string): Promise<KiaHeatmapPayload> {
  const res = await fetch('/api/kia/heatmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Error cargando heatmap (${res.status})`);
  }
  return json.data as KiaHeatmapPayload;
}
