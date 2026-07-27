import type { RetailerData, RetailerRow } from './types';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listRetailers: () => req<RetailerRow[]>('/api/retailers'),
  createRetailer: (name: string) => req<RetailerRow>('/api/retailers', { method: 'POST', body: JSON.stringify({ name }) }),
  updateRetailer: (id: string, patch: Partial<RetailerRow>) =>
    req<RetailerRow>(`/api/retailers/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteRetailer: (id: string) => req<{ ok: true }>(`/api/retailers/${id}`, { method: 'DELETE' }),
  getData: (id: string) => req<RetailerData>(`/api/retailers/${id}/data`),
  putData: (id: string, data: RetailerData) =>
    req<{ ok: true }>(`/api/retailers/${id}/data`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadImage: async (retailerId: string, file: Blob, filename: string): Promise<{ key: string; url: string }> => {
    const form = new FormData();
    form.append('file', file, filename);
    const res = await fetch(`${BASE}/api/retailers/${retailerId}/images`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('画像のアップロードに失敗しました');
    const body = (await res.json()) as { key: string; url: string };
    return { key: body.key, url: BASE + body.url };
  },
};

export { BASE as API_BASE };
