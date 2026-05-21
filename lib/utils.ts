import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ShiftDetails {
  start: Date;
  end: Date;
  shiftDateStr: string;
  status: 'Active' | 'Ended' | 'Upcoming';
}

/**
 * Extract date/time components from a UTC Date, as seen in Ljubljana
 * (Europe/Ljubljana) timezone. This is timezone-safe and works in all
 * modern browsers and Node.js environments.
 */
function getSlParts(utcDate: Date): {
  year: number; month: number; day: number; hour: number; minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Ljubljana',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(utcDate);

  const get = (type: string) => {
    const val = parseInt(parts.find(p => p.type === type)?.value ?? '0');
    return isNaN(val) ? 0 : val;
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // guard: some implementations report midnight as 24
    minute: get('minute'),
  };
}

/**
 * Convert a Ljubljana local date/time (year, month 1-based, day, hour, minute)
 * to a proper UTC Date object.
 *
 * Uses iterative convergence: start with a naive UTC estimate, then correct
 * for the Ljubljana UTC offset (which varies with DST). Converges in 2-3 steps.
 */
function ljToUTC(year: number, month: number, day: number, hour: number, minute = 0): Date {
  // Initial estimate: treat the time as if it were UTC
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i++) {
    const sl = getSlParts(new Date(utcMs));
    // Difference between Ljubljana representation of utcMs and the target
    const slMs = Date.UTC(sl.year, sl.month - 1, sl.day, sl.hour, sl.minute, 0);
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMs -= (slMs - targetMs);
    if (slMs === targetMs) break; // converged
  }

  return new Date(utcMs);
}

/**
 * Compute shift start/end boundaries and status for a given shift type.
 *
 * All shift hours are defined in Ljubljana (Europe/Ljubljana) timezone:
 *   Day:     09:00 – 17:00
 *   Evening: 17:00 – 01:00 (crosses midnight)
 *   Night:   01:00 – 09:00
 *
 * @param shiftType - The operator's locked shift
 * @param now       - Current UTC time (MUST be server-synced, not client local)
 */
export function getShiftDetails(
  shiftType: 'Day' | 'Evening' | 'Night',
  now: Date
): ShiftDetails {
  const pad = (n: number) => String(n).padStart(2, '0');

  const getDatesForAnchor = (
    anchorY: number,
    anchorM: number,
    anchorD: number
  ): { start: Date; end: Date; shiftDateStr: string } => {
    const shiftDateStr = `${anchorY}-${pad(anchorM)}-${pad(anchorD)}`;
    let start: Date;
    let end: Date;

    if (shiftType === 'Day') {
      start = ljToUTC(anchorY, anchorM, anchorD, 9);
      end   = ljToUTC(anchorY, anchorM, anchorD, 17);
    } else if (shiftType === 'Evening') {
      start = ljToUTC(anchorY, anchorM, anchorD, 17);
      // End is 01:00 the following Ljubljana calendar day
      const nextUtc = new Date(Date.UTC(anchorY, anchorM - 1, anchorD + 1));
      const next = getSlParts(nextUtc);
      end = ljToUTC(next.year, next.month, next.day, 1);
    } else {
      // Night: 01:00 – 09:00
      start = ljToUTC(anchorY, anchorM, anchorD, 1);
      end   = ljToUTC(anchorY, anchorM, anchorD, 9);
    }

    return { start, end, shiftDateStr };
  };

  // Resolve Ljubljana date parts for yesterday / today / tomorrow
  const todaySl     = getSlParts(now);
  const yesterdaySl = getSlParts(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const tomorrowSl  = getSlParts(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const yesterdayShift = getDatesForAnchor(yesterdaySl.year, yesterdaySl.month, yesterdaySl.day);
  const todayShift     = getDatesForAnchor(todaySl.year,     todaySl.month,     todaySl.day);
  const tomorrowShift  = getDatesForAnchor(tomorrowSl.year,  tomorrowSl.month,  tomorrowSl.day);

  // Is now inside any shift window?
  if (now >= yesterdayShift.start && now < yesterdayShift.end) return { ...yesterdayShift, status: 'Active' };
  if (now >= todayShift.start     && now < todayShift.end)     return { ...todayShift,     status: 'Active' };
  if (now >= tomorrowShift.start  && now < tomorrowShift.end)  return { ...tomorrowShift,  status: 'Active' };

  // Most-recently-ended shift
  const endedShifts = [yesterdayShift, todayShift, tomorrowShift].filter(s => now >= s.end);
  if (endedShifts.length > 0) {
    endedShifts.sort((a, b) => b.end.getTime() - a.end.getTime());
    return { ...endedShifts[0], status: 'Ended' };
  }

  // Next upcoming shift
  return { ...todayShift, status: 'Upcoming' };
}
