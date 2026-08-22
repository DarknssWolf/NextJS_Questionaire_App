'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Pie, PieChart } from 'recharts';
import { RISK_CHART_COLORS } from '@/lib/chart-colors';

type HighRiskData = {
  name: string;
  value: number;
  fill: string;
};

interface HighRiskSupplierChartProps {
  data?: HighRiskData[];
  loading?: boolean;
}

const HighRiskSupplierChart = ({
  data = [],
  loading = false,
}: HighRiskSupplierChartProps) => {
  const safeData = Array.isArray(data) ? data : [];

  const chartData =
    safeData.length > 0
      ? safeData
      : [
          {
            name: 'No Data Available',
            value: 1,
            fill: RISK_CHART_COLORS.unknown,
          },
        ];

  const chartConfig = chartData.reduce(
    (config, item) => {
      if (item?.name) {
        config[item.name] = {
          label: item.name,
        };
      }
      return config;
    },
    {} as Record<string, { label: string }>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-brand-dark text-lg font-bold">
          High Risk Supplier by Spend Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div>Loading chart data...</div>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] w-full"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              />
              <ChartLegend
                content={<ChartLegendContent payload={[]} />}
                className="flex-wrap gap-2 [&>*]:min-w-0 [&>*]:basis-1/4 [&>*]:justify-start"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export { HighRiskSupplierChart };
