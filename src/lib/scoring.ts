import {
  type QuestionType,
  isScoreable,
  isSingleChoice,
} from '@/types/questionnaire-data';
import type { RiskLevel } from '@/types/risk';

export function questionMaxScore(
  type: QuestionType,
  optionScores: number[]
): number {
  if (!isScoreable(type) || optionScores.length === 0) return 0;

  if (isSingleChoice(type)) {
    return Math.max(0, ...optionScores);
  }

  return optionScores.reduce((total, score) => total + Math.max(0, score), 0);
}

export function questionScore(
  type: QuestionType,
  selectedOptionScores: number[],
  maxScore: number
): number {
  if (!isScoreable(type) || selectedOptionScores.length === 0) return 0;

  const total = selectedOptionScores.reduce(
    (sum, score) => sum + Math.max(0, score),
    0
  );

  return Math.min(total, maxScore);
}

export function scorePercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

export const RISK_THRESHOLDS = { low: 67, medium: 34 } as const;

export function mapPercentToRisk(percent: number): RiskLevel {
  if (percent >= RISK_THRESHOLDS.low) return 'low';
  if (percent >= RISK_THRESHOLDS.medium) return 'medium';
  return 'high';
}

export function mapScoreToRisk(score: number, maxScore: number): RiskLevel {
  return mapPercentToRisk(scorePercent(score, maxScore));
}
