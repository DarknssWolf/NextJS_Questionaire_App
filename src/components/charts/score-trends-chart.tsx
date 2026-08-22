'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_SERIES, CHART_UI, getRiskChartColor } from '@/lib/chart-colors';

type ScoreTrendsChartProps = {
  cardTitle: string;
  sections: string[];
  chartData?: Array<Record<string, string | number>>;
};

export function ScoreTrendsChart({
  cardTitle,
  sections,
  chartData,
}: ScoreTrendsChartProps) {
  const chartConfig = Object.fromEntries(
    sections.map((section) => [
      section,
      { label: section, color: CHART_SERIES.compliance.compliant },
    ])
  ) satisfies ChartConfig;

  return (
    <Card className="text-brand-dark flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <CardTitle className="text-brand-dark text-lg font-bold">
          {cardTitle}
        </CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: getRiskChartColor(80),
              }}
            ></div>
            <span className="text-sm text-slate-600">Low Risk</span>
          </div>
          <div className="flex items-center space-x-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: getRiskChartColor(50),
              }}
            ></div>
            <span className="text-sm text-slate-600">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: getRiskChartColor(20),
              }}
            ></div>
            <span className="text-sm text-slate-600">High Risk</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <ChartContainer config={chartConfig} className="h-[80%] w-full">
          <BarChart data={chartData} barGap={4} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={CHART_UI.grid}
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_UI.tick }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_UI.tick }}
              domain={[0, 100]}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              dx={-10}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: CHART_UI.cursor }}
            />
            {sections.map((section) => (
              <Bar
                key={section}
                dataKey={section}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                {chartData?.map((entry, index) => (
                  <Cell
                    key={`${section}-${index}-${entry.year}`}
                    fill={getRiskChartColor(Number(entry[section] ?? 0))}
                  />
                ))}
                <LabelList
                  dataKey={section}
                  position="top"
                  style={{
                    fill: CHART_UI.label,
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                  formatter={(value: unknown) =>
                    typeof value === 'number' && value > 0 ? section : ''
                  }
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
