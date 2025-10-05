// frontend/src/lib/labels.ts
export const ENTITIES = {
  avion: { singular: 'Aeronave', plural: 'Aeronaves' },
} as const;

type EntityKey = keyof typeof ENTITIES;

export function entityLabel<K extends EntityKey>(
  key: K,
  form: 'singular' | 'plural' = 'singular'
) {
  const entry = ENTITIES[key];
  return entry ? entry[form] : String(key);
}

export function titleFor<K extends EntityKey>(key: K) {
  return entityLabel(key, 'plural');
}
