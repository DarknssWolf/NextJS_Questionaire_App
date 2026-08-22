import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { type EvaluationStatus } from '@/enums/evaluation';
import { getEvaluationStatusVariant } from '@/lib/evaluation-utils';
import { Calendar, ClipboardList, Scan } from 'lucide-react';

export interface SuppliersOverviewProps {
  registrationDate: string;
  lastEvaluationDate: string;
  dueDate?: string | null;
  evaluationStatus: EvaluationStatus;
  industry: string;
  spendCategory: string;
  mainProductType: string;
  fteHeadcount: number;
  annualSpend: number;
  peakSeason: string;
  lowSeason: string;
}

export default function SuppliersOverview({
  registrationDate,
  lastEvaluationDate,
  dueDate,
  evaluationStatus,
  industry,
  spendCategory,
  mainProductType,
  fteHeadcount,
  annualSpend,
  peakSeason,
  lowSeason,
}: SuppliersOverviewProps) {
  const displayValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return 'No Data';
    }
    return String(value);
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Supplier Overview</h2>

        <div className="mb-6 grid grid-cols-1 gap-6 text-sm md:grid-cols-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Registered:</span>
            <span className="font-medium">{registrationDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Due Date</span>
            <span className="font-medium">{displayValue(dueDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">{lastEvaluationDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">
              Current Evaluation Status:
            </span>
            <Badge
              variant={getEvaluationStatusVariant(evaluationStatus)}
              className="justify-center whitespace-nowrap"
            >
              {evaluationStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Industry:</span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(industry)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Spend Category:
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(spendCategory)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Main Product Type:
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(mainProductType)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  FTE Headcount (2025):
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(fteHeadcount)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Annual Spend:
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(annualSpend)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Peak Season:
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(peakSeason)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-header border-0 shadow-none">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Low Season:
                </span>
                <Scan className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {displayValue(lowSeason)}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
