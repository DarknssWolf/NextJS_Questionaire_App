'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { CHART_SERIES, CHART_UI } from '@/lib/chart-colors';

interface PillarsScoreChartProps {
  chartData: Array<{
    name: string;
    'Non Compliant': number;
    Partial: number;
    Compliant: number;
  }>;
  years?: string[];
}

export function PillarsScoreChart({ chartData }: PillarsScoreChartProps) {
  const chartConfig = {
    'Non Compliant': {
      label: 'Non Compliant',
      color: CHART_SERIES.compliance.nonCompliant,
    },
    Partial: {
      label: 'Partial',
      color: CHART_SERIES.compliance.partial,
    },
    Compliant: {
      label: 'Compliant',
      color: CHART_SERIES.compliance.compliant,
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-brand-dark text-lg font-bold">
          Compliance by section
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 30,
            }}
            barCategoryGap={15}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke={CHART_UI.grid}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value: number) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_UI.tick }}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_UI.tick }}
              width={100}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: CHART_UI.cursor }}
            />
            <Bar
              dataKey="Non Compliant"
              stackId="a"
              fill={chartConfig['Non Compliant'].color}
              radius={[4, 0, 0, 4]}
            />
            <Bar
              dataKey="Partial"
              stackId="a"
              fill={chartConfig.Partial.color}
              radius={0}
            />
            <Bar
              dataKey="Compliant"
              stackId="a"
              fill={chartConfig.Compliant.color}
              radius={[0, 4, 4, 0]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const key = String(value);
                const config = chartConfig[key as keyof typeof chartConfig];
                return config ? config.label : key;
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
