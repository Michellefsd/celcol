// src/utils/asArray.ts
export function asArray<T = any>(input: any, innerKey?: string): T[] {
  if (Array.isArray(input)) return input as T[];
  if (innerKey && input && Array.isArray(input[innerKey])) return input[innerKey] as T[];
  return []; // nunca envolver objeto suelto
}
