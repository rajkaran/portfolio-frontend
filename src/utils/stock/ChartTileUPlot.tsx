function tzOffsetMinutes(date: Date, tz: string) {
  // compute offset by formatting parts in target tz
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);

  const y = get('year');
  const m = get('month');
  const d = get('day');
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');

  // This is the wall-clock time in tz, interpreted as UTC => compare to real UTC
  const asIfUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return (asIfUTC - date.getTime()) / 60000;
}

function epochSecondsForTzWallClock(y: number, m: number, d: number, hh: number, mm: number, tz: string) {
  // Start with "as if it's UTC"
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  // Shift by tz offset so wall-clock matches tz
  const offMin = tzOffsetMinutes(guess, tz);
  return Math.floor((guess.getTime() - offMin * 60000) / 1000);
}

export function getSessionBounds(dayISO: string, tz: string, padMin = 5) {
  // dayISO = "yyyy-MM-dd"
  const [y, m, d] = dayISO.split('-').map(Number);

  const start = epochSecondsForTzWallClock(y, m, d, 9, 30, tz);
  const end = epochSecondsForTzWallClock(y, m, d, 16, 0, tz);

  return {
    min: start - padMin * 60,
    max: end + padMin * 60,
  };
}
