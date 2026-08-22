'use server';

import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { HIGH_RISK_CATEGORY_COLORS } from '@/lib/chart-colors';
import { mapPercentToRisk, scorePercent } from '@/lib/scoring';
import { db } from '@/server/db';
import { companySupplierTable } from '@/server/db/schema/companySupplierTable';
import { countryTable } from '@/server/db/schema/countryTable';
import { emailLogTable } from '@/server/db/schema/emailLogTable';
import { questionnairesTable } from '@/server/db/schema/questionnairesTable';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import { scoreSubmission } from '@/server/services/scoring.service';
import { EmailType } from '@/types/emailType';
import { isSubmitted } from '@/types/questionnaire-data';
import { type RiskLevel } from '@/types/risk';
import { and, count, desc, eq, inArray } from 'drizzle-orm';

interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
}

const EMPTY_DISTRIBUTION: RiskDistribution = { high: 0, medium: 0, low: 0 };

async function getSubmittedSubmissions(companyId: number) {
  return await db
    .select({
      id: submissionsTable.id,
      supplierId: submissionsTable.supplierId,
      questionnaireId: submissionsTable.questionnaireId,
      score: submissionsTable.score,
      maxScore: submissionsTable.maxScore,
      submittedAt: submissionsTable.submittedAt,
      status: submissionsTable.status,
    })
    .from(submissionsTable)
    .innerJoin(
      companySupplierTable,
      eq(companySupplierTable.supplierId, submissionsTable.supplierId)
    )
    .where(
      and(
        eq(companySupplierTable.companyId, companyId),
        inArray(submissionsTable.status, [
          'submitted',
          'auto_submitted',
          'manually_submitted',
        ])
      )
    )
    .orderBy(desc(submissionsTable.submittedAt));
}

function latestPerSupplierPerYear<
  T extends { supplierId: number; submittedAt: Date | null },
>(submissions: T[]): T[] {
  const latest = new Map<string, T>();

  for (const submission of submissions) {
    if (!submission.submittedAt) continue;
    const key = `${submission.supplierId}-${submission.submittedAt.getFullYear()}`;
    const existing = latest.get(key);
    if (!existing || submission.submittedAt > existing.submittedAt!) {
      latest.set(key, submission);
    }
  }

  return [...latest.values()];
}

function toRiskDistribution(percentages: number[]): RiskDistribution {
  const distribution = { ...EMPTY_DISTRIBUTION };
  for (const percent of percentages) {
    distribution[mapPercentToRisk(percent)] += 1;
  }
  return distribution;
}

function toEvaluationRiskLevel(risk: RiskLevel): EvaluationRiskLevel {
  if (risk === 'low') return EvaluationRiskLevel.LOW;
  if (risk === 'medium') return EvaluationRiskLevel.MEDIUM;
  return EvaluationRiskLevel.HIGH;
}

export async function calculateCompanyScoreTrends(companyId: number): Promise<{
  sections: string[];
  chartData: Array<Record<string, string | number>>;
}> {
  try {
    if (!companyId || companyId <= 0) return { sections: [], chartData: [] };

    const submissions = latestPerSupplierPerYear(
      await getSubmittedSubmissions(companyId)
    );
    if (submissions.length === 0) return { sections: [], chartData: [] };

    // Per-section scores are not persisted, so submitted submissions are re-scored here.
    const scored = await Promise.all(
      submissions.map(async (submission) => ({
        year: submission.submittedAt!.getFullYear(),
        perSection: (await scoreSubmission(submission.id)).perSection,
      }))
    );

    const sectionTitles: string[] = [];
    for (const { perSection } of scored) {
      for (const section of perSection) {
        if (!sectionTitles.includes(section.title)) {
          sectionTitles.push(section.title);
        }
      }
    }

    const byYear = new Map<number, Map<string, number[]>>();
    for (const { year, perSection } of scored) {
      const yearBucket = byYear.get(year) ?? new Map<string, number[]>();
      for (const section of perSection) {
        const percentages = yearBucket.get(section.title) ?? [];
        percentages.push(scorePercent(section.score, section.maxScore));
        yearBucket.set(section.title, percentages);
      }
      byYear.set(year, yearBucket);
    }

    const chartData = [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, sectionScores]) => {
        const row: Record<string, string | number> = { year: String(year) };
        for (const title of sectionTitles) {
          const percentages = sectionScores.get(title) ?? [];
          row[title] =
            percentages.length > 0
              ? Math.round(
                  percentages.reduce((sum, value) => sum + value, 0) /
                    percentages.length
                )
              : 0;
        }
        return row;
      });

    return { sections: sectionTitles, chartData };
  } catch (error) {
    console.error('Error calculating company score trends:', error);
    return { sections: [], chartData: [] };
  }
}

export async function calculateCompanyAggregatedScoreDetails(
  companyId: number
): Promise<{
  aggregatedScoreDetails: {
    score: number;
    changePercentage: number;
    riskLevel: EvaluationRiskLevel;
    findings: { distribution: RiskDistribution };
    evaluationStatus: EvaluationStatus;
  };
  supplierCompliance: {
    percentage: number;
    compliant: number;
    total: number;
    distribution: RiskDistribution;
  };
} | null> {
  try {
    if (!companyId || companyId <= 0) return null;

    const [{ total: totalSuppliers }] = await db
      .select({ total: count() })
      .from(companySupplierTable)
      .where(eq(companySupplierTable.companyId, companyId));

    const submissions = latestPerSupplierPerYear(
      await getSubmittedSubmissions(companyId)
    );

    const latestPerSupplier = new Map<number, number>();
    for (const submission of [...submissions].sort(
      (a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime()
    )) {
      if (!latestPerSupplier.has(submission.supplierId)) {
        latestPerSupplier.set(
          submission.supplierId,
          scorePercent(submission.score ?? 0, submission.maxScore ?? 0)
        );
      }
    }

    const percentages = [...latestPerSupplier.values()];
    const averagePercent =
      percentages.length > 0
        ? Math.round(
            percentages.reduce((sum, value) => sum + value, 0) /
              percentages.length
          )
        : 0;

    const distribution = toRiskDistribution(percentages);
    const compliant = distribution.low;

    const currentYear = new Date().getFullYear();
    const thisYear = percentages.length > 0 ? averagePercent : 0;
    const lastYearScores = submissions
      .filter((s) => s.submittedAt!.getFullYear() === currentYear - 1)
      .map((s) => scorePercent(s.score ?? 0, s.maxScore ?? 0));
    const lastYearAverage =
      lastYearScores.length > 0
        ? lastYearScores.reduce((sum, value) => sum + value, 0) /
          lastYearScores.length
        : 0;

    return {
      aggregatedScoreDetails: {
        score: averagePercent,
        changePercentage:
          lastYearAverage > 0
            ? Math.round(((thisYear - lastYearAverage) / lastYearAverage) * 100)
            : 0,
        riskLevel:
          percentages.length > 0
            ? toEvaluationRiskLevel(mapPercentToRisk(averagePercent))
            : EvaluationRiskLevel.NOT_ASSESSED,
        findings: { distribution },
        evaluationStatus:
          percentages.length === 0
            ? EvaluationStatus.NOT_STARTED
            : percentages.length < totalSuppliers
              ? EvaluationStatus.IN_PROGRESS
              : EvaluationStatus.COMPLETED,
      },
      supplierCompliance: {
        percentage:
          totalSuppliers > 0
            ? Math.round((compliant / totalSuppliers) * 100)
            : 0,
        compliant,
        total: totalSuppliers,
        distribution,
      },
    };
  } catch (error) {
    console.error('Error calculating company aggregated score:', error);
    return null;
  }
}

export async function calculateCompanySectionCompliance(
  companyId: number
): Promise<{
  chartData: Array<{
    name: string;
    'Non Compliant': number;
    Partial: number;
    Compliant: number;
  }>;
}> {
  try {
    if (!companyId || companyId <= 0) return { chartData: [] };

    const submissions = latestPerSupplierPerYear(
      await getSubmittedSubmissions(companyId)
    );
    if (submissions.length === 0) return { chartData: [] };

    const perSectionPercentages = new Map<string, number[]>();
    for (const submission of submissions) {
      const { perSection } = await scoreSubmission(submission.id);
      for (const section of perSection) {
        const bucket = perSectionPercentages.get(section.title) ?? [];
        bucket.push(scorePercent(section.score, section.maxScore));
        perSectionPercentages.set(section.title, bucket);
      }
    }

    return {
      chartData: [...perSectionPercentages.entries()].map(
        ([name, percentages]) => {
          const distribution = toRiskDistribution(percentages);
          return {
            name,
            'Non Compliant': distribution.high,
            Partial: distribution.medium,
            Compliant: distribution.low,
          };
        }
      ),
    };
  } catch (error) {
    console.error('Error calculating section compliance:', error);
    return { chartData: [] };
  }
}

export async function getCompletedEvaluationsThisYear(
  companyId: number
): Promise<number> {
  try {
    if (!companyId || companyId <= 0) return 0;

    const currentYear = new Date().getFullYear();
    const submissions = await getSubmittedSubmissions(companyId);

    return new Set(
      submissions
        .filter(
          (submission) => submission.submittedAt?.getFullYear() === currentYear
        )
        .map((submission) => submission.supplierId)
    ).size;
  } catch (error) {
    console.error('Error counting completed evaluations:', error);
    return 0;
  }
}

export async function getPendingEvaluations(
  companyId: number
): Promise<number> {
  try {
    if (!companyId || companyId <= 0) return 0;

    const submissions = await db
      .select({
        supplierId: submissionsTable.supplierId,
        status: submissionsTable.status,
      })
      .from(submissionsTable)
      .innerJoin(
        companySupplierTable,
        eq(companySupplierTable.supplierId, submissionsTable.supplierId)
      )
      .where(eq(companySupplierTable.companyId, companyId))
      .orderBy(desc(submissionsTable.id));

    const latest = new Map<number, string>();
    for (const submission of submissions) {
      if (!latest.has(submission.supplierId)) {
        latest.set(submission.supplierId, submission.status);
      }
    }

    return [...latest.values()].filter(
      (status) => !isSubmitted(status as never)
    ).length;
  } catch (error) {
    console.error('Error counting pending evaluations:', error);
    return 0;
  }
}

export async function getTotalSuppliers(companyId: number): Promise<number> {
  try {
    if (!companyId || companyId <= 0) return 0;

    const [result] = await db
      .select({ total: count() })
      .from(companySupplierTable)
      .where(eq(companySupplierTable.companyId, companyId));

    return result?.total ?? 0;
  } catch (error) {
    console.error('Error getting total suppliers count:', error);
    return 0;
  }
}

export async function getSuppliersByCountry(companyId: number): Promise<
  Array<{
    countryId: number;
    countryName: string;
    supplierCount: number;
    riskDistribution: RiskDistribution & { notAssessed: number };
    riskPercentages: {
      highPercentage: number;
      mediumPercentage: number;
      lowPercentage: number;
    };
    overallRiskLevel: EvaluationRiskLevel;
  }>
> {
  try {
    if (!companyId || companyId <= 0) return [];

    const suppliers = await db
      .select({
        id: supplierTable.id,
        countryId: countryTable.id,
        countryName: countryTable.name,
      })
      .from(supplierTable)
      .innerJoin(
        companySupplierTable,
        eq(supplierTable.id, companySupplierTable.supplierId)
      )
      .leftJoin(countryTable, eq(supplierTable.countryId, countryTable.id))
      .where(eq(companySupplierTable.companyId, companyId));

    const submissions = await getSubmittedSubmissions(companyId);
    const percentBySupplier = new Map<number, number>();
    for (const submission of submissions) {
      if (!percentBySupplier.has(submission.supplierId)) {
        percentBySupplier.set(
          submission.supplierId,
          scorePercent(submission.score ?? 0, submission.maxScore ?? 0)
        );
      }
    }

    const byCountry = new Map<
      number,
      { name: string; supplierIds: number[] }
    >();
    for (const supplier of suppliers) {
      if (supplier.countryId === null) continue;
      const bucket = byCountry.get(supplier.countryId) ?? {
        name: supplier.countryName ?? 'Unknown',
        supplierIds: [],
      };
      bucket.supplierIds.push(supplier.id);
      byCountry.set(supplier.countryId, bucket);
    }

    return [...byCountry.entries()].map(([countryId, bucket]) => {
      const assessed = bucket.supplierIds
        .map((id) => percentBySupplier.get(id))
        .filter((percent): percent is number => percent !== undefined);

      const distribution = toRiskDistribution(assessed);
      const notAssessed = bucket.supplierIds.length - assessed.length;
      const total = bucket.supplierIds.length || 1;

      return {
        countryId,
        countryName: bucket.name,
        supplierCount: bucket.supplierIds.length,
        riskDistribution: { ...distribution, notAssessed },
        riskPercentages: {
          highPercentage: Math.round((distribution.high / total) * 100),
          mediumPercentage: Math.round((distribution.medium / total) * 100),
          lowPercentage: Math.round((distribution.low / total) * 100),
        },
        overallRiskLevel:
          assessed.length === 0
            ? EvaluationRiskLevel.NOT_ASSESSED
            : toEvaluationRiskLevel(
                mapPercentToRisk(
                  Math.round(
                    assessed.reduce((sum, value) => sum + value, 0) /
                      assessed.length
                  )
                )
              ),
      };
    });
  } catch (error) {
    console.error('Error grouping suppliers by country:', error);
    return [];
  }
}

export async function getTopHighRiskSpendCategories(
  companyId: number
): Promise<{
  chartData: Array<{ name: string; value: number; fill: string }>;
}> {
  try {
    if (!companyId || companyId <= 0) return { chartData: [] };

    const suppliers = await db
      .select({
        id: supplierTable.id,
        spendCategory: spendCategoryTable.category1,
      })
      .from(supplierTable)
      .innerJoin(
        companySupplierTable,
        eq(supplierTable.id, companySupplierTable.supplierId)
      )
      .leftJoin(
        spendCategoryTable,
        eq(supplierTable.spendCategoryId, spendCategoryTable.id)
      )
      .where(eq(companySupplierTable.companyId, companyId));

    const submissions = await getSubmittedSubmissions(companyId);
    const percentBySupplier = new Map<number, number>();
    for (const submission of submissions) {
      if (!percentBySupplier.has(submission.supplierId)) {
        percentBySupplier.set(
          submission.supplierId,
          scorePercent(submission.score ?? 0, submission.maxScore ?? 0)
        );
      }
    }

    const highRiskByCategory = new Map<string, number>();
    for (const supplier of suppliers) {
      const percent = percentBySupplier.get(supplier.id);
      if (percent === undefined || mapPercentToRisk(percent) !== 'high')
        continue;

      const category = supplier.spendCategory ?? 'Uncategorised';
      highRiskByCategory.set(
        category,
        (highRiskByCategory.get(category) ?? 0) + 1
      );
    }

    return {
      chartData: [...highRiskByCategory.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, HIGH_RISK_CATEGORY_COLORS.length)
        .map(([name, value], index) => ({
          name,
          value,
          fill: HIGH_RISK_CATEGORY_COLORS[index],
        })),
    };
  } catch (error) {
    console.error('Error calculating high-risk spend categories:', error);
    return { chartData: [] };
  }
}

export async function calculateSupplierPastEvaluations(
  supplierId: number
): Promise<
  Array<{
    id: number;
    year: number;
    questionnaireName: string;
    version: number;
    startDate: string;
    completionDate: string;
    overallScorePercent: number;
    sections: Array<{ title: string; percent: number }>;
  }>
> {
  try {
    const submissions = await db
      .select({
        id: submissionsTable.id,
        score: submissionsTable.score,
        maxScore: submissionsTable.maxScore,
        createdAt: submissionsTable.createdAt,
        submittedAt: submissionsTable.submittedAt,
        questionnaireName: questionnairesTable.name,
        version: questionnairesTable.version,
      })
      .from(submissionsTable)
      .innerJoin(
        questionnairesTable,
        eq(questionnairesTable.id, submissionsTable.questionnaireId)
      )
      .where(
        and(
          eq(submissionsTable.supplierId, supplierId),
          inArray(submissionsTable.status, [
            'submitted',
            'auto_submitted',
            'manually_submitted',
          ])
        )
      )
      .orderBy(desc(submissionsTable.submittedAt));

    return await Promise.all(
      submissions.map(async (submission) => {
        const { perSection } = await scoreSubmission(submission.id);

        return {
          id: submission.id,
          year: (submission.submittedAt ?? submission.createdAt).getFullYear(),
          questionnaireName: submission.questionnaireName,
          version: submission.version,
          startDate: submission.createdAt.toISOString().slice(0, 10),
          completionDate:
            submission.submittedAt?.toISOString().slice(0, 10) ?? '',
          overallScorePercent: scorePercent(
            submission.score ?? 0,
            submission.maxScore ?? 0
          ),
          sections: perSection.map((section) => ({
            title: section.title,
            percent: scorePercent(section.score, section.maxScore),
          })),
        };
      })
    );
  } catch (error) {
    console.error('Error loading past evaluations:', error);
    return [];
  }
}

export async function calculateSupplierEvaluationStatus(
  supplierId: number
): Promise<EvaluationStatus> {
  try {
    const [submission] = await db
      .select({ status: submissionsTable.status })
      .from(submissionsTable)
      .where(eq(submissionsTable.supplierId, supplierId))
      .orderBy(desc(submissionsTable.submittedAt), desc(submissionsTable.id))
      .limit(1);

    switch (submission?.status) {
      case 'submitted':
      case 'manually_submitted':
        return EvaluationStatus.COMPLETED;
      case 'auto_submitted':
        return EvaluationStatus.AUTO_SUBMITTED;
      case 'in_progress':
        return EvaluationStatus.IN_PROGRESS;
      default:
        break;
    }

    const [invite] = await db
      .select({ id: emailLogTable.id })
      .from(emailLogTable)
      .where(
        and(
          eq(emailLogTable.supplierId, supplierId),
          eq(emailLogTable.emailType, EmailType.EVALUATION_INVITATION)
        )
      )
      .limit(1);

    return invite ? EvaluationStatus.INVITE_SENT : EvaluationStatus.NOT_STARTED;
  } catch (error) {
    console.error(`Error resolving status for supplier ${supplierId}:`, error);
    return EvaluationStatus.NOT_STARTED;
  }
}
