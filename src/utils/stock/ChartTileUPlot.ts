import type { Market } from "../../types/stock/ticker.types";

export function marketTz(market: Market) {
  if (market === 'canada') return 'America/Toronto';
  if (market === 'usa') return 'America/New_York';
  return 'Asia/Kolkata'; // india
}

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

function tzNowParts(tz: string) {
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
  const parts = dtf.formatToParts(new Date());
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour'), mm: get('minute'), ss: get('second') };
}

function dateForTzWallClock(y: number, m: number, d: number, hh: number, mm: number, tz: string) {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offMin = tzOffsetMinutes(guess, tz);

  // DST sanity guard
  // Most market timezones are within [-12h, +14h]. Anything beyond that is "wrong".
  if (!Number.isFinite(offMin) || Math.abs(offMin) > 14 * 60) {
    console.warn(`[tz] suspicious offset`, { tz, offMin, y, m, d, hh, mm });
    // safest fallback: assume no offset (UTC) rather than exploding
    return guess;
  }

  return new Date(guess.getTime() - offMin * 60000);
}

function tzYmd(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

function isWeekendInTz(date: Date, tz: string) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(date);
  return wd === 'Sat' || wd === 'Sun';
}

export function nextMarketOpenDate(tz: string) {
  // Use tz wall-clock for comparisons
  const np = tzNowParts(tz);
  const nowTz = dateForTzWallClock(np.y, np.m, np.d, np.hh, np.mm, tz);

  // today at 09:30 in market tz
  let open = dateForTzWallClock(np.y, np.m, np.d, 9, 30, tz);

  // if it's already past 09:30 (in that tz), schedule tomorrow
  // if already past open, start from tomorrow
  if (nowTz.getTime() >= open.getTime()) {
    open = new Date(open.getTime() + 24 * 60 * 60 * 1000);
    const tp = tzYmd(open, tz);
    open = dateForTzWallClock(tp.y, tp.m, tp.d, 9, 30, tz);
  }

  // weekend skip only for canada/usa
  while (isWeekendInTz(open, tz)) {
    open = new Date(open.getTime() + 24 * 60 * 60 * 1000);
    const np = tzYmd(open, tz);
    open = dateForTzWallClock(np.y, np.m, np.d, 9, 30, tz);
  }

  return open;
}

