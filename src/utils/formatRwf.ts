/**
 * Rwandan Franc display, e.g. `1,000 RWF` or `200,000 RWF`.
 */
export function formatRwf(value: unknown): string {
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value ?? '').replace(/,/g, '').trim());
  if (Number.isNaN(n)) return '0 RWF';
  const whole = Math.round(n);
  return `${whole.toLocaleString('en-US')} RWF`;
}
