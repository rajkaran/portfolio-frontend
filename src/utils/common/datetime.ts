// Convert ISO -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
export function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Convert "YYYY-MM-DDTHH:mm" local time -> ISO UTC
export function localInputToIso(local: string): string {
  const d = new Date(local);
  return d.toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}
