import fs from 'fs';
import path from 'path';

const PROJECT_EMPRESA = 'urbex';
const PROJECT_SLUG = 'kia';

export function getUrbexApiConfig() {
  const apiKey = process.env.URBEX_API_KEY || process.env.NEXT_PUBLIC_URBEX_API_KEY || '';
  const baseURL =
    process.env.NEXT_PUBLIC_URBEX_API_URL || 'https://api-prod.urbex.com.co';
  return { apiKey, baseURL };
}

export async function userHasKiaAccess(email: string): Promise<boolean> {
  const { apiKey, baseURL } = getUrbexApiConfig();
  if (!apiKey) return false;

  try {
    const res = await fetch(`${baseURL}/proyectos/listar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      success?: boolean;
      grupo?: string;
      data?: Array<{ empresa?: string; slug?: string }>;
    };

    if (!data.success) return false;
    if (data.grupo?.includes('@urbex')) return true;

    return (data.data ?? []).some(
      (p) => p.empresa === PROJECT_EMPRESA && p.slug === PROJECT_SLUG
    );
  } catch {
    return false;
  }
}

export function loadKiaJson<T>(filename: string): T {
  const filePath = path.join(
    process.cwd(),
    'projects',
    'urbex',
    'kia',
    'data',
    filename
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}
