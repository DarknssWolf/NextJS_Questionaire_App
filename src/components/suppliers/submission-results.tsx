import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type SubmissionResult } from '@/server/services/submission-results.service';
import { type RiskLevel } from '@/types/risk';
import { CheckCircle2, MinusCircle } from 'lucide-react';

const RISK_BADGE = {
  low: 'riskLow',
  medium: 'riskMedium',
  high: 'riskHigh',
} as const satisfies Record<RiskLevel, string>;

const RISK_LABEL = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
} as const satisfies Record<RiskLevel, string>;

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '—';
}

export function SubmissionResults({ result }: { result: SubmissionResult }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">{result.supplierName}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {result.questionnaireName} · version {result.version}
              </p>
            </div>
            <Badge variant={RISK_BADGE[result.riskLevel]}>
              {RISK_LABEL[result.riskLevel]}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-3xl font-bold">{result.percent}%</span>
              <span className="text-muted-foreground">
                {result.score} of {result.maxScore} points
              </span>
            </div>
            <Progress value={result.percent} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {result.status.replace(/_/g, ' ')}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{formatDate(result.submittedAt)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-medium">{formatDate(result.dueDate)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Sections</dt>
              <dd className="font-medium">{result.sections.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <CardTitle>Section scores</CardTitle>
          <div className="flex flex-col gap-4">
            {result.sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{section.title}</span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {section.score} / {section.maxScore}
                    </span>
                    <Badge variant={RISK_BADGE[section.riskLevel]}>
                      {section.percent}%
                    </Badge>
                  </span>
                </div>
                <Progress value={section.percent} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {result.sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <p className="text-muted-foreground text-sm">
                  {section.description}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-4">
              {section.answers.map((answer) => (
                <li
                  key={answer.questionId}
                  className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="flex items-start gap-2 font-medium">
                      {answer.given.length > 0 ? (
                        <CheckCircle2 className="text-risk-green-foreground mt-0.5 size-4 shrink-0" />
                      ) : (
                        <MinusCircle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      )}
                      {answer.text}
                    </span>
                    {answer.maxScore > 0 && (
                      <span className="text-muted-foreground shrink-0 text-sm">
                        {answer.score} / {answer.maxScore}
                      </span>
                    )}
                  </div>

                  {answer.given.length > 0 ? (
                    <ul className="flex flex-col gap-1 pl-6 text-sm">
                      {answer.given.map((value, index) => (
                        <li key={`${answer.questionId}-${index}`}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground pl-6 text-sm italic">
                      Not answered
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
