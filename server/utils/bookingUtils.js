// Pure date/booking helpers (no database access) so they can be unit-tested.
// DATE POLICY: all stay dates are calendar dates (YYYY-MM-DD) interpreted as UTC midnight.
// A stay from 10th to 12th is 2 nights (10th and 11th); the check-out day is not charged.
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NIGHTS = 30;
const CANCEL_WINDOW_HOURS = 24; // cancellation allowed until 24h before check-in

function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null; // rejects 2026-02-30
  return d;
}

function todayUTC(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function nightsBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

// Returns { error } or { from, to, nights }.
function validateStayDates(checkIn, checkOut, now = new Date()) {
  const from = parseDateOnly(checkIn);
  const to = parseDateOnly(checkOut);
  if (!from || !to) return { error: 'Check-in and check-out must be valid dates (YYYY-MM-DD).' };
  if (from < todayUTC(now)) return { error: 'Check-in date cannot be in the past.' };
  const nights = nightsBetween(from, to);
  if (nights < 1) return { error: 'Check-out must be later than check-in.' };
  if (nights > MAX_NIGHTS) return { error: `A single booking cannot exceed ${MAX_NIGHTS} nights.` };
  return { from, to, nights };
}

// Existing booking overlaps request when existing.from < request.to AND existing.to > request.from.
// Only active (status "booked") bookings consume inventory.
function overlapQuery(from, to) {
  return { status: 'booked', fromDate: { $lt: to }, toDate: { $gt: from } };
}

function calcTotal(nights, rent) {
  return Math.round(nights * rent * 100) / 100;
}

function cancellationStatus(booking, now = new Date()) {
  if (booking.status === 'cancelled') return { allowed: false, reason: 'This booking is already cancelled.' };
  const hoursLeft = (new Date(booking.fromDate).getTime() - now.getTime()) / 36e5;
  if (hoursLeft < CANCEL_WINDOW_HOURS) {
    return { allowed: false, reason: `Bookings can only be cancelled at least ${CANCEL_WINDOW_HOURS} hours before check-in.` };
  }
  return { allowed: true, reason: null };
}

const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

module.exports = { DAY_MS, MAX_NIGHTS, CANCEL_WINDOW_HOURS, parseDateOnly, todayUTC, nightsBetween, validateStayDates, overlapQuery, calcTotal, cancellationStatus, isObjectId };
