const BRAZIL_TZ = "America/Sao_Paulo";

/**
 * Current calendar month boundaries in Brazil's timezone (fixed UTC-3, no DST
 * since 2019), returned as real UTC instants suitable for a Prisma range query.
 */
export function getCurrentMonthRangeBrazil(): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);

  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const end = new Date(`${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01T00:00:00-03:00`);

  return { start, end };
}
