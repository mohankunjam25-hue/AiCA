export function formatVal(v: any): string {
  if (Array.isArray(v)) {
    return `[${v.map((item) => (Array.isArray(item) ? `[${item.join(', ')}]` : String(item))).join(', ')}]`;
  }
  if (typeof v === 'object' && v !== null) {
    return JSON.stringify(v);
  }
  return String(v);
}
