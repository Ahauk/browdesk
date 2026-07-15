// Money input helpers: display as "$1,800" while typing, parse back to a number.

export function formatMoney(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return "$" + parseInt(digits, 10).toLocaleString("es-MX");
}

export function parseMoney(formatted: string): number {
  const digits = formatted.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
