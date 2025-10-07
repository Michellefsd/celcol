export const OT_FIELD_LABELS: Record<string, string> = {
  accionTomada: 'Reporte',
  // …otros si querés
};

export function otFieldLabel(key: string, fallback?: string) {
  return OT_FIELD_LABELS[key] ?? (fallback ?? key);
}
