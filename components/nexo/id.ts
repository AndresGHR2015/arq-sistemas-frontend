// Session-only identifiers also work in the HTTP development preview.
let sequence = 0;
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `demo-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
}
