import { QUESTION_TYPES, type QuestionType } from '@/types/questionnaire-data';
import { z } from 'zod';

const TYPE_LABELS = QUESTION_TYPES.join(', ');

const truthy = ['yes', 'y', 'true', '1'];
const falsy = ['no', 'n', 'false', '0'];

export const QuestionnaireRowSchema = z.object({
  'Question ID': z
    .string()
    .trim()
    .min(
      1,
      'Question ID is required — it identifies the question across rows.'
    ),

  Section: z
    .string()
    .trim()
    .min(
      1,
      'Section is required — questions are grouped by it, in first-seen order.'
    ),

  Question: z.string().trim().min(1, 'Question text is required.'),

  'Help Text': z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ''),

  Type: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine(
      (value): value is QuestionType =>
        (QUESTION_TYPES as readonly string[]).includes(value),
      {
        message: `Type must be one of: ${TYPE_LABELS}.`,
      }
    ),

  Required: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ?? '').toLowerCase())
    .refine(
      (value) =>
        value === '' || truthy.includes(value) || falsy.includes(value),
      {
        message: `Required must be yes or no (also accepted: ${[...truthy, ...falsy].join(', ')}), or left blank for yes.`,
      }
    ),

  'Option ID': z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ''),

  Option: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ''),

  'Option Score': z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine(
      (value) =>
        value === '' || Number.isInteger(Number(value.replace(',', '.'))),
      { message: 'Option Score must be a whole number (or blank for 0).' }
    ),
});

export type QuestionnaireRow = z.infer<typeof QuestionnaireRowSchema>;

export const QUESTIONNAIRE_CSV_COLUMNS = Object.keys(
  QuestionnaireRowSchema.shape
) as (keyof typeof QuestionnaireRowSchema.shape)[];

export const QUESTION_COLUMNS = [
  'Question ID',
  'Section',
  'Question',
  'Help Text',
  'Type',
  'Required',
] as const;

export const OPTION_COLUMNS = ['Option ID', 'Option', 'Option Score'] as const;

export const QUESTIONNAIRE_CSV_DELIMITER = ';';

export const QUESTIONNAIRE_CSV_SAMPLE_PATH = '/csv/sample-questionnaire.csv';

export function isRequiredValue(value: string): boolean {
  return value === '' || truthy.includes(value);
}

export function parseOptionScore(value: string): number {
  if (value === '') return 0;
  return Number(value.replace(',', '.'));
}

export interface QuestionnaireParseResult {
  fileName: string;
  rows: Record<string, string>[];
  errors: { row: number; field: string; message: string }[];
}
