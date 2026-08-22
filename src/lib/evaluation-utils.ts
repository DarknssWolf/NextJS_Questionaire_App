import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { mapPercentToRisk } from '@/lib/scoring';

export function getEvaluationStatusVariant(
  status: EvaluationStatus
): 'statusInProgress' | 'statusCompleted' | 'statusNotStarted' {
  switch (status) {
    case EvaluationStatus.NOT_STARTED:
      return 'statusNotStarted';
    case EvaluationStatus.IN_PROGRESS:
      return 'statusInProgress';
    case EvaluationStatus.COMPLETED:
      return 'statusCompleted';
    default:
      return 'statusNotStarted';
  }
}

export function getEvaluationScoreVariant(
  scorePercent: number
): 'riskLow' | 'riskMedium' | 'riskHigh' {
  const risk = mapPercentToRisk(scorePercent);
  if (risk === 'low') return 'riskLow';
  if (risk === 'medium') return 'riskMedium';
  return 'riskHigh';
}

export function getEvaluationRiskLevelVariant(
  riskLevel: EvaluationRiskLevel
): 'riskLow' | 'riskMedium' | 'riskHigh' | 'statusNotAssessed' {
  if (riskLevel === EvaluationRiskLevel.LOW) return 'riskLow';
  if (riskLevel === EvaluationRiskLevel.MEDIUM) return 'riskMedium';
  if (riskLevel === EvaluationRiskLevel.HIGH) return 'riskHigh';
  if (riskLevel === EvaluationRiskLevel.NOT_ASSESSED)
    return 'statusNotAssessed';
  return 'statusNotAssessed';
}

export function getRiskLevelLabel(riskLevel: EvaluationRiskLevel): string {
  const labels: Record<EvaluationRiskLevel, string> = {
    [EvaluationRiskLevel.LOW]: 'Low Risk',
    [EvaluationRiskLevel.MEDIUM]: 'Medium Risk',
    [EvaluationRiskLevel.HIGH]: 'High Risk',
    [EvaluationRiskLevel.NOT_ASSESSED]: 'Not Assessed',
    [EvaluationRiskLevel.ALL]: 'All Levels',
  };

  return labels[riskLevel];
}
