// A palette change must edit this file alongside globals.css.

export const CHART_SERIES = {
  compliance: {
    nonCompliant: 'rgba(201, 133, 126, 0.85)', // mirrors --risk-red (#c9857e)
    partial: 'rgba(220, 190, 126, 0.85)', // mirrors --risk-yellow (#dcbe7e)
    compliant: 'rgba(191, 216, 186, 0.85)', // mirrors --risk-green (#bfd8ba)
  },
} as const;

export const RISK_CHART_COLORS = {
  low: '#bfd8ba', // mirrors --risk-green / --color-accent-success
  medium: '#dcbe7e', // mirrors --risk-yellow
  high: '#c9857e', // mirrors --risk-red
  unknown: '#d9d6d8', // mirrors --color-brand-100 (empty/no-data fill)
} as const;

export const RISK_SCORE_THRESHOLDS = { low: 75, medium: 25 } as const;

export function getRiskChartColor(value: number): string {
  if (value >= RISK_SCORE_THRESHOLDS.low) return RISK_CHART_COLORS.low;
  if (value >= RISK_SCORE_THRESHOLDS.medium) return RISK_CHART_COLORS.medium;
  return RISK_CHART_COLORS.high;
}

export const CHART_UI = {
  grid: '#dedbd6', // mirrors --base-200 (gridline)
  tick: '#5f5f6d', // mirrors --base-600 (axis labels — 5.1:1 on Canvas)
  label: '#32323a', // mirrors --base-800 (bar value labels)
  pieLabel: '#5f5f6d', // mirrors --base-600
  pieStroke: '#ffffff', // mirrors --card (White — pies sit on White cards)
  cursor: 'rgba(28, 28, 28, 0.06)', // Charcoal (--foreground) at 6%
} as const;

export const HIGH_RISK_CATEGORY_COLORS = [
  '#a85c54', // no token yet (--risk-red, shaded)
  '#b96f67', // no token yet
  '#c9857e', // mirrors --risk-red exactly
  '#deada7', // no token yet (--risk-red, tinted)
] as const;

export const SER_CATEGORY_COLORS = {
  critical: '#c9857e', // mirrors --risk-red
  needsWork: '#dcbe7e', // mirrors --risk-yellow
  good: '#bfd8ba', // mirrors --risk-green
} as const;

export const CANVAS_COLORS = {
  ink: '#1c1c1c', // mirrors --foreground (Charcoal)
  guide: '#b4b2b6', // mirrors --base-400
} as const;
