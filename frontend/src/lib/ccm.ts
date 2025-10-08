// src/lib/ccm.ts
/*import { fetchJson } from '@/services/api';

type SignedUrlResp = { url: string };

export async function getSignedCcmUrl(otId: number, opts?: { preview?: boolean }) {
  const q = opts?.preview ? '?preview=1' : '';
  const { url } = await fetchJson<SignedUrlResp>(`/ordenes-trabajo/${otId}/conformidad-pdf-url${q}`);
  return url;
}
*/