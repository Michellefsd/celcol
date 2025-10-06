// src/lib/pdf.ts
import { api, openInNewTab } from '@/services/api';
import { getSignedCcmUrl } from './ccm';


export function previewPdfUrl(otId: number) {
  return api(`/ordenes-trabajo/${otId}/pdf?preview=1`);
}

export function openPreviewPdf(otId: number) {
  openInNewTab(previewPdfUrl(otId));
}

export async function openPreviewCcm(otId: number) {
  const url = await getSignedCcmUrl(otId, { preview: true });
  openInNewTab(url);
}

export async function openCcm(otId: number) {
  const url = await getSignedCcmUrl(otId, { preview: false });
  openInNewTab(url);
}
