import { Select } from "@/components/ui";
import { type Period, periodLabelPt, getRecentPeriodOptionsBrazil } from "@/lib/dateRanges";

const PERIODS: Period[] = ["week", "month", "quarter", "semiannual", "year"];

/** How many periods back the <select> offers, tuned per granularity so the list stays a sane length. */
const RECENT_OPTIONS_COUNT: Record<Period, number> = {
  week: 12,
  month: 12,
  quarter: 8,
  semiannual: 6,
  year: 5,
};

/**
 * The two <select>s (granularity + specific period) for a GET filter form.
 * Changing "period" resets the period-key list server-side on submit --
 * `periodKey` values from a stale granularity are simply invalid and the
 * page falls back to the current period of the new granularity.
 */
export function PeriodFilterFields({ period, periodKey }: { period: Period; periodKey: string }) {
  const options = getRecentPeriodOptionsBrazil(period, RECENT_OPTIONS_COUNT[period]);

  return (
    <>
      <Select name="period" defaultValue={period} className="w-auto">
        {PERIODS.map((p) => (
          <option key={p} value={p}>
            {periodLabelPt(p)}
          </option>
        ))}
      </Select>
      <Select name="periodKey" defaultValue={periodKey} className="w-auto">
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </Select>
    </>
  );
}
