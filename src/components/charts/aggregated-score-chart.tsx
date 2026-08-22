import { Badge } from '@/components/ui/badge';
import { Card, CardFooter } from '@/components/ui/card';
import {
  type EvaluationRiskLevel,
  type EvaluationStatus,
} from '@/enums/evaluation';
import {
  getEvaluationRiskLevelVariant,
  getEvaluationStatusVariant,
} from '@/lib/evaluation-utils';
import { ArrowUp, Award } from 'lucide-react';
import { type ReactNode } from 'react';

const RISK_LEVEL_LABELS: Record<EvaluationRiskLevel, string> = {
  Low: 'Low Risk',
  Medium: 'Medium Risk',
  High: 'High Risk',
  'Not Assessed': 'Not Assessed',
  All: 'All Levels',
};

interface AggregatedScoreProps {
  title: string;
  score: number;
  changePercentage: number;
  riskLevel: EvaluationRiskLevel;
  supplierCompliance?: {
    percentage: number;
    compliant: number;
    total: number;
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  findings?: {
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  evaluationStatus?: EvaluationStatus;
  footer?: ReactNode;
}

export function AggregatedScoreChart({
  title,
  score,
  changePercentage,
  riskLevel,
  supplierCompliance,
  findings,
  evaluationStatus,
  footer,
}: AggregatedScoreProps) {
  const totalSuppliers =
    (supplierCompliance?.distribution.high ?? 0) +
    (supplierCompliance?.distribution.medium ?? 0) +
    (supplierCompliance?.distribution.low ?? 0);

  const totalFindings =
    (findings?.distribution.high ?? 0) +
    (findings?.distribution.medium ?? 0) +
    (findings?.distribution.low ?? 0);

  return (
    <Card className="h-full">
      <div className="bg-card h-full space-y-8 rounded-lg p-6 shadow-md">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center">
            <h2 className="text-brand-dark text-lg font-bold">{title}</h2>
            {evaluationStatus && (
              <Badge
                variant={getEvaluationStatusVariant(evaluationStatus)}
                className="ml-2"
              >
                {evaluationStatus}
              </Badge>
            )}
          </div>

          <div className="text-risk-green-foreground mb-6 flex items-center justify-center">
            <ArrowUp className="mr-1 h-4 w-4" />
            <span className="text-sm">
              +{changePercentage}% from last Period
            </span>
          </div>

          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <div className="border-brand-500 absolute inset-0 rounded-full border-8"></div>
            <span className="text-foreground text-5xl font-bold">
              {score.toFixed(1)}
            </span>
          </div>

          <Badge
            variant={getEvaluationRiskLevelVariant(riskLevel)}
            className="mt-4"
          >
            {RISK_LEVEL_LABELS[riskLevel]}
          </Badge>
        </div>

        {supplierCompliance && (
          <div className="border-border border-t pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="text-risk-green-foreground h-5 w-5" />
              <h3 className="text-foreground text-lg font-medium">
                Supplier Compliance
              </h3>
            </div>

            <div className="mb-4">
              <span className="text-brand-dark text-5xl font-bold">
                {supplierCompliance.percentage}%
              </span>
              <p className="text-muted-foreground mt-1 text-sm">
                {supplierCompliance.compliant} out of {supplierCompliance.total}{' '}
                suppliers are compliant
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm">High Risk</span>
                <span className="text-muted-foreground text-sm">
                  {supplierCompliance.distribution.high} suppliers
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-risk-red h-full rounded-full"
                  style={{
                    width: `${(supplierCompliance.distribution.high / totalSuppliers) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm">Medium Risk</span>
                <span className="text-muted-foreground text-sm">
                  {supplierCompliance.distribution.medium} suppliers
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-risk-yellow h-full rounded-full"
                  style={{
                    width: `${(supplierCompliance.distribution.medium / totalSuppliers) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm">Low Risk</span>
                <span className="text-muted-foreground text-sm">
                  {supplierCompliance.distribution.low} suppliers
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-risk-green h-full rounded-full"
                  style={{
                    width: `${(supplierCompliance.distribution.low / totalSuppliers) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {findings && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">High Risk</span>
              <span className="text-muted-foreground text-sm">
                {findings.distribution.high} findings
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-risk-red h-full rounded-full"
                style={{
                  width: `${(findings.distribution.high / totalFindings) * 100}%`,
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">Medium Risk</span>
              <span className="text-muted-foreground text-sm">
                {findings.distribution.medium} findings
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-risk-yellow h-full rounded-full"
                style={{
                  width: `${(findings.distribution.medium / totalFindings) * 100}%`,
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">Low Risk</span>
              <span className="text-muted-foreground text-sm">
                {findings.distribution.low} findings
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-risk-green h-full rounded-full"
                style={{
                  width: `${(findings.distribution.low / totalFindings) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {footer && (
          <div className="pt-4">
            <CardFooter className="flex items-center justify-between pt-4">
              {footer}
            </CardFooter>
          </div>
        )}
      </div>
    </Card>
  );
}
