'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mapPercentToRisk } from '@/lib/scoring';
import { type SuppliersPastEvaluationsProps } from '@/models/Supplier';
import { Eye } from 'lucide-react';
import Link from 'next/link';

const RISK_BADGE = {
  low: 'riskLow',
  medium: 'riskMedium',
  high: 'riskHigh',
} as const;

export default function SuppliersPastEvaluations({
  supplierId,
  evaluations,
}: SuppliersPastEvaluationsProps) {
  const sectionTitles = [
    ...new Set(
      evaluations.flatMap((evaluation) =>
        evaluation.sections.map((section) => section.title)
      )
    ),
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        <h2 className="text-lg font-semibold">Past Evaluations</h2>

        {evaluations.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No past evaluations available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="text-center">Overall Score</TableHead>
                  {sectionTitles.map((title) => (
                    <TableHead key={title} className="text-center">
                      {title}
                    </TableHead>
                  ))}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>{evaluation.year}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {evaluation.startDate}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {evaluation.completionDate}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {evaluation.overallScorePercent}%
                    </TableCell>
                    {sectionTitles.map((title) => {
                      const section = evaluation.sections.find(
                        (candidate) => candidate.title === title
                      );

                      return (
                        <TableCell key={title} className="text-center">
                          {section ? (
                            <Badge
                              variant={
                                RISK_BADGE[mapPercentToRisk(section.percent)]
                              }
                            >
                              {section.percent}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button variant="outline" size="pillCompact" asChild>
                        <Link
                          href={`/suppliers/${supplierId}/evaluation-report/${evaluation.id}`}
                        >
                          <Eye />
                          view
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
