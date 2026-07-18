/**
 * Yampi returns dates like "2026-07-15 10:11:11.000000" with a separate
 * `timezone` field that's consistently "America/Sao_Paulo" (fixed UTC-3,
 * Brazil abolished DST in 2019) -- append the offset explicitly since the
 * date string itself is naive/unzoned.
 */
export function parseYampiDate(value: { date: string; timezone?: string }): Date {
  const isoLike = value.date.replace(" ", "T").slice(0, 23);
  return new Date(`${isoLike}-03:00`);
}
