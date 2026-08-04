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

// ---------------------------------------------------------------------------
// Generalized period support (week/month/quarter/semiannual/year) for the
// analytics + shipments dashboards. Month-specific helpers above are kept
// as-is (used by the commission admin page) and reused internally here.
// ---------------------------------------------------------------------------

export type Period = "week" | "month" | "quarter" | "semiannual" | "year";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getBrazilLocalYMD(date: Date): { y: number; m: number; d: number } {
  const [y, m, d] = formatDateKeyBrazil(date).split("-").map(Number);
  return { y, m, d };
}

/** ISO week number (Mon-based, week 1 contains the year's first Thursday) for a calendar date. */
function isoWeekOf(y: number, m: number, d: number): { isoYear: number; isoWeek: number } {
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const isoWeek = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { isoYear: date.getUTCFullYear(), isoWeek };
}

/** Calendar date (Y/M/D) of the Monday starting ISO week `isoWeek` of `isoYear`. */
function isoWeekMonday(isoYear: number, isoWeek: number): { y: number; m: number; d: number } {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = jan4.getUTCDay() || 7;
  const week1Monday = jan4.getTime() - (jan4DayNum - 1) * 86_400_000;
  const monday = new Date(week1Monday + (isoWeek - 1) * 7 * 86_400_000);
  return { y: monday.getUTCFullYear(), m: monday.getUTCMonth() + 1, d: monday.getUTCDate() };
}

function quarterOfMonth(month: number): number {
  return Math.ceil(month / 3);
}

/** Current period key for `period`, e.g. "2026-W31", "2026-08", "2026-Q3", "2026-H1", "2026". */
export function getCurrentPeriodKeyBrazil(period: Period): string {
  const { y, m, d } = getBrazilLocalYMD(new Date());
  switch (period) {
    case "week": {
      const { isoYear, isoWeek } = isoWeekOf(y, m, d);
      return `${isoYear}-W${pad2(isoWeek)}`;
    }
    case "month":
      return getCurrentMonthKeyBrazil();
    case "quarter":
      return `${y}-Q${quarterOfMonth(m)}`;
    case "semiannual":
      return `${y}-H${m <= 6 ? 1 : 2}`;
    case "year":
      return `${y}`;
  }
}

/** Is `key` a well-formed key for `period`? */
export function isValidPeriodKey(period: Period, key: string): boolean {
  switch (period) {
    case "week":
      return /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(key);
    case "month":
      return isValidMonthKey(key);
    case "quarter":
      return /^\d{4}-Q[1-4]$/.test(key);
    case "semiannual":
      return /^\d{4}-H[1-2]$/.test(key);
    case "year":
      return /^\d{4}$/.test(key);
  }
}

/** UTC instant boundaries for `key` under `period`, in Brazil's timezone. */
export function getPeriodRangeBrazil(period: Period, key: string): { start: Date; end: Date } {
  switch (period) {
    case "week": {
      const [isoYearStr, weekStr] = key.split("-W");
      const { y, m, d } = isoWeekMonday(Number(isoYearStr), Number(weekStr));
      const start = new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00-03:00`);
      const end = new Date(start.getTime() + 7 * 86_400_000);
      return { start, end };
    }
    case "month":
      return getMonthRangeBrazil(key);
    case "quarter": {
      const [yearStr, qStr] = key.split("-Q");
      const year = Number(yearStr);
      const startMonth = (Number(qStr) - 1) * 3 + 1;
      const start = getMonthRangeBrazil(`${year}-${pad2(startMonth)}`).start;
      const end = getMonthRangeBrazil(`${year}-${pad2(startMonth + 2)}`).end;
      return { start, end };
    }
    case "semiannual": {
      const [yearStr, hStr] = key.split("-H");
      const year = Number(yearStr);
      const [startMonth, endMonth] = hStr === "1" ? [1, 6] : [7, 12];
      const start = getMonthRangeBrazil(`${year}-${pad2(startMonth)}`).start;
      const end = getMonthRangeBrazil(`${year}-${pad2(endMonth)}`).end;
      return { start, end };
    }
    case "year": {
      const year = Number(key);
      const start = getMonthRangeBrazil(`${year}-01`).start;
      const end = getMonthRangeBrazil(`${year}-12`).end;
      return { start, end };
    }
  }
}

/** The key for the period immediately preceding `key`, for period-over-period deltas. */
export function getPreviousPeriodKeyBrazil(period: Period, key: string): string {
  switch (period) {
    case "week": {
      const [isoYearStr, weekStr] = key.split("-W");
      const { y, m, d } = isoWeekMonday(Number(isoYearStr), Number(weekStr));
      const prevMonday = new Date(Date.UTC(y, m - 1, d) - 7 * 86_400_000);
      const { isoYear, isoWeek } = isoWeekOf(
        prevMonday.getUTCFullYear(),
        prevMonday.getUTCMonth() + 1,
        prevMonday.getUTCDate(),
      );
      return `${isoYear}-W${pad2(isoWeek)}`;
    }
    case "month": {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      return month === 1 ? `${year - 1}-12` : `${year}-${pad2(month - 1)}`;
    }
    case "quarter": {
      const [yearStr, qStr] = key.split("-Q");
      const year = Number(yearStr);
      const q = Number(qStr);
      return q === 1 ? `${year - 1}-Q4` : `${year}-Q${q - 1}`;
    }
    case "semiannual": {
      const [yearStr, hStr] = key.split("-H");
      const year = Number(yearStr);
      return hStr === "1" ? `${year - 1}-H2` : `${year}-H1`;
    }
    case "year":
      return `${Number(key) - 1}`;
  }
}

/** Boundaries of the period immediately preceding `key`, for period-over-period deltas. */
export function getPreviousPeriodRangeBrazil(period: Period, key: string): { start: Date; end: Date } {
  return getPeriodRangeBrazil(period, getPreviousPeriodKeyBrazil(period, key));
}

const VALID_PERIODS: Period[] = ["week", "month", "quarter", "semiannual", "year"];

/**
 * Resolves raw `?period=&periodKey=` search params into a valid pair,
 * defaulting to the current month and falling back to the current period of
 * whichever granularity is requested if the key doesn't parse (e.g. a
 * leftover month key after switching the granularity select to "quarter").
 */
export function resolvePeriodParamsBrazil(
  periodParam: string | undefined,
  periodKeyParam: string | undefined,
): { period: Period; periodKey: string } {
  const period = VALID_PERIODS.includes(periodParam as Period) ? (periodParam as Period) : "month";
  const periodKey =
    periodKeyParam && isValidPeriodKey(period, periodKeyParam)
      ? periodKeyParam
      : getCurrentPeriodKeyBrazil(period);
  return { period, periodKey };
}

const PERIOD_LABELS_PT: Record<Period, string> = {
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
  semiannual: "Semestre",
  year: "Ano",
};

export function periodLabelPt(period: Period): string {
  return PERIOD_LABELS_PT[period];
}

/**
 * The last `count` period keys (including the current one), most recent
 * first, each paired with a Portuguese label for a <select> option.
 */
export function getRecentPeriodOptionsBrazil(
  period: Period,
  count: number,
): Array<{ key: string; label: string }> {
  if (period === "month") return getRecentMonthOptionsBrazil(count);

  const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TZ,
    day: "2-digit",
    month: "2-digit",
  });

  const options: Array<{ key: string; label: string }> = [];
  let key = getCurrentPeriodKeyBrazil(period);

  for (let i = 0; i < count; i++) {
    let label: string;
    if (period === "week") {
      const { start, end } = getPeriodRangeBrazil(period, key);
      const lastDay = new Date(end.getTime() - 86_400_000);
      label = `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(lastDay)}`;
    } else if (period === "quarter") {
      const [year, q] = key.split("-Q");
      label = `${q}º trimestre de ${year}`;
    } else if (period === "semiannual") {
      const [year, h] = key.split("-H");
      label = `${h}º semestre de ${year}`;
    } else {
      label = key;
    }

    options.push({ key, label });
    key = getPreviousPeriodKeyBrazil(period, key);
  }

  return options;
}
