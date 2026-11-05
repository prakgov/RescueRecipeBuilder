import { differenceInCalendarDays, parseISO } from 'date-fns';

/** Whole days from `today` until the item's expiry date (negative = already expired). */
export function daysLeft(expiryISO, today = new Date()) {
  if (!expiryISO) return null;
  return differenceInCalendarDays(parseISO(expiryISO), today);
}

/**
 * Expiry status buckets used for badges and for match weighting.
 *  - expired:  past its date (still shown; the user decides if it's usable)
 *  - urgent:   0–2 days left
 *  - soon:     3–5 days left
 *  - fresh:    6+ days, or no date entered
 */
export function expiryStatus(expiryISO, today = new Date()) {
  const d = daysLeft(expiryISO, today);
  if (d === null) return 'fresh';
  if (d < 0) return 'expired';
  if (d <= 2) return 'urgent';
  if (d <= 5) return 'soon';
  return 'fresh';
}

/** Score weight per fridge item: items that need using first count for more. */
export const STATUS_WEIGHT = { expired: 2, urgent: 3, soon: 2, fresh: 1 };

export function expiryWeight(expiryISO, today = new Date()) {
  return STATUS_WEIGHT[expiryStatus(expiryISO, today)];
}

export const STATUS_LABEL = {
  expired: 'Expired',
  urgent: 'Use now',
  soon: 'Use soon',
  fresh: 'Fresh',
};

export const STATUS_VARIANT = {
  expired: 'secondary',
  urgent: 'danger',
  soon: 'warning',
  fresh: 'success',
};
