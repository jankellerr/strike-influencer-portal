const BRAZIL_TZ = "America/Sao_Paulo";

/** "YYYY-MM" key for the given month, e.g. "2026-07". */
export function getCurrentMonthKeyBrazil(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;

  return `${year}-${month}`;
}

/**
 * Calendar month boundaries for a "YYYY-MM" key in Brazil's timezone (fixed
 * UTC-3, no DST since 2019), returned as real UTC instants suitable for a
 * Prisma range query.
 */
export function getMonthRangeBrazil(monthKey: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const end = new Date(`${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01T00:00:00-03:00`);

  return { start, end };
}

/** Is `monthKey` a well-formed "YYYY-MM" string? */
export function isValidMonthKey(monthKey: string): boolean {
  return /^\d{4}-\d{2}$/.test(monthKey);
}

/** Current calendar month boundaries in Brazil's timezone. */
export function getCurrentMonthRangeBrazil(): { start: Date; end: Date } {
  return getMonthRangeBrazil(getCurrentMonthKeyBrazil());
}

/** "YYYY-MM-DD" calendar date for `date` in Brazil's timezone, e.g. for a date input's value. */
export function formatDateKeyBrazil(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * The last `count` month keys (including the current one), most recent
 * first, each paired with a Portuguese label for a <select> option.
 */
export function getRecentMonthOptionsBrazil(
  count: number,
): Array<{ key: string; label: string }> {
  const currentKey = getCurrentMonthKeyBrazil();
  const [currentYear, currentMonth] = currentKey.split("-").map(Number);

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TZ,
    month: "long",
    year: "numeric",
  });

  const options: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const totalMonths = currentYear * 12 + (currentMonth - 1) - i;
    const year = Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const label = formatter.format(new Date(`${key}-15T12:00:00-03:00`));
    options.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  return options;
}
