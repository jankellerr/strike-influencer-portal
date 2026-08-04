export interface TrendBarChartPoint {
  key: string;
  /** Short x-axis tick, e.g. "2026-08", "2026-Q3", "2026-W31". */
  tick: string;
  /** Full description for the hover tooltip, e.g. "Agosto de 2026". */
  label: string;
  value: number;
}

/**
 * Single-series trend bar chart. Past periods render in the de-emphasis
 * (muted) tone; the most recent period is the accent color, per the stat-tile
 * sparkline convention (12-point sparkline muted, current period accented).
 * `points` must be chronological, oldest first.
 */
export function TrendBarChart({
  points,
  formatValue,
  ariaLabel,
}: {
  points: TrendBarChartPoint[];
  formatValue: (value: number) => string;
  ariaLabel: string;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-strike-muted">Sem dados no período.</p>;
  }

  const width = 720;
  const height = 220;
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingBottom = 26;
  const paddingTop = 24;
  const baselineY = height - paddingBottom;
  const chartHeight = baselineY - paddingTop;
  const chartWidth = width - paddingLeft - paddingRight;

  const slot = chartWidth / points.length;
  const barWidth = Math.min(24, slot - 6);
  const maxValue = Math.max(...points.map((p) => p.value), 0) || 1;
  const maxIndex = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const lastIndex = points.length - 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
      <line
        x1={paddingLeft}
        y1={baselineY}
        x2={width - paddingRight}
        y2={baselineY}
        stroke="var(--strike-border)"
        strokeWidth={1}
      />
      {points.map((point, i) => {
        const x = paddingLeft + i * slot + (slot - barWidth) / 2;
        const barHeight = Math.max((point.value / maxValue) * chartHeight, 1);
        const y = baselineY - barHeight;
        const radius = Math.min(4, barHeight / 2, barWidth / 2);
        const isCurrent = i === lastIndex;
        const showLabel = isCurrent || i === maxIndex;

        const path = `M${x},${baselineY} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + barWidth - radius},${y} Q${x + barWidth},${y} ${x + barWidth},${y + radius} L${x + barWidth},${baselineY} Z`;

        return (
          <g key={point.key}>
            <title>{`${point.label}: ${formatValue(point.value)}`}</title>
            <path d={path} fill={isCurrent ? "var(--strike-yellow)" : "var(--strike-muted)"} opacity={isCurrent ? 1 : 0.55} />
            {showLabel && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-strike-black"
                fontSize={10}
                fontWeight={600}
              >
                {formatValue(point.value)}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height - paddingBottom + 14}
              textAnchor="middle"
              className="fill-strike-muted"
              fontSize={9}
            >
              {point.tick}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
