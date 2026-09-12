export function now(): string {
  return new Date().toISOString();
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().split('-')[0]}`;
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
