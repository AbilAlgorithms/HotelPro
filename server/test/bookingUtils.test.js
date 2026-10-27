// Run with: npm test   (uses Node's built-in test runner; no database needed)
const test = require('node:test');
const assert = require('node:assert');
const u = require('../utils/bookingUtils');

const NOW = new Date('2026-10-27T10:00:00Z');

test('parseDateOnly accepts real dates only', () => {
  assert.ok(u.parseDateOnly('2026-11-02'));
  assert.strictEqual(u.parseDateOnly('2026-02-30'), null);
  assert.strictEqual(u.parseDateOnly('02/11/2026'), null);
  assert.strictEqual(u.parseDateOnly({ $gt: '' }), null);
});

test('nights are check-out minus check-in (no off-by-one)', () => {
  const r = u.validateStayDates('2026-11-10', '2026-11-12', NOW);
  assert.strictEqual(r.nights, 2);
  assert.strictEqual(u.calcTotal(r.nights, 2900), 5800);
});

test('rejects past check-in, reversed and zero-night ranges, and very long stays', () => {
  assert.ok(u.validateStayDates('2026-10-26', '2026-10-28', NOW).error);
  assert.ok(u.validateStayDates('2026-11-12', '2026-11-10', NOW).error);
  assert.ok(u.validateStayDates('2026-11-10', '2026-11-10', NOW).error);
  assert.ok(u.validateStayDates('2026-11-01', '2026-12-31', NOW).error);
  assert.ok(!u.validateStayDates('2026-10-27', '2026-10-28', NOW).error); // today is allowed
});

test('overlap query follows existing.from < req.to AND existing.to > req.from', () => {
  const q = u.overlapQuery(new Date('2026-11-10'), new Date('2026-11-12'));
  assert.deepStrictEqual(Object.keys(q).sort(), ['fromDate', 'status', 'toDate']);
  assert.strictEqual(q.status, 'booked');
  assert.ok(q.fromDate.$lt && q.toDate.$gt);
});

test('cancellation policy: 24h before check-in, no double cancel', () => {
  const far = { status: 'booked', fromDate: new Date('2026-11-10') };
  const soon = { status: 'booked', fromDate: new Date('2026-10-28T00:00:00Z') };
  assert.strictEqual(u.cancellationStatus(far, NOW).allowed, true);
  assert.strictEqual(u.cancellationStatus(soon, NOW).allowed, false);
  assert.strictEqual(u.cancellationStatus({ ...far, status: 'cancelled' }, NOW).allowed, false);
});

test('isObjectId rejects non-strings and bad ids', () => {
  assert.ok(u.isObjectId('64b7f0c2a1b2c3d4e5f60718'));
  assert.ok(!u.isObjectId('123'));
  assert.ok(!u.isObjectId({ $ne: null }));
});
