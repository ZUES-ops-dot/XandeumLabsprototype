export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; body: unknown | null };

export async function apiGetResult<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      headers: {
        accept: 'application/json'
      }
    });

    if (res.ok) {
      return { ok: true, data: (await res.json()) as T };
    }

    let body: unknown | null = null;
    try {
      body = (await res.json()) as unknown;
    } catch {
      body = null;
    }

    return { ok: false, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const result = await apiGetResult<T>(path);
  if (result.ok) return result.data;
  throw new Error(`API error ${result.status} for ${path}`);
}
