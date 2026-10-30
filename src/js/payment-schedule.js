// Integer cents keep the three instalments equal to the agreed total.
export function paymentSchedule(value) {
  if (typeof value !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) return null;
  const [euros, fraction = ''] = value.split('.');
  const total = Number(euros) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(total) || total < 50000 || total > 1000000000) return null;
  const deposit = Math.round(total / 2);
  const milestone = Math.round(total / 4);
  return { total, deposit, milestone, final: total - deposit - milestone };
}
