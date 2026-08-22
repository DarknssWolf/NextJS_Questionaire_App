'use server';

import { createQuestionnaireVersion } from '@/server/services/questionnaire-admin.service';
import {
  QUESTIONNAIRE_CSV_COLUMNS,
  QUESTIONNAIRE_CSV_DELIMITER,
  QuestionnaireRowSchema,
  type QuestionnaireParseResult,
  isRequiredValue,
  parseOptionScore,
} from '@/types/questionnaire-csv';
import {
  type ParsedQuestion,
  type QuestionnaireTarget,
  type QuestionnaireValidationError,
  isScoreable,
} from '@/types/questionnaire-data';
import { parse } from 'csv-parse/sync';
const HEADER_OFFSET = 2;

function csvRowNumber(index: number): number {
  return index + HEADER_OFFSET;
}

export async function parseQuestionnaireCsv(
  formData: FormData
): Promise<QuestionnaireParseResult> {
  const fileError = (
    message: string,
    fileName = ''
  ): QuestionnaireParseResult => ({
    fileName,
    rows: [],
    errors: [{ row: 0, field: 'file', message }],
  });

  try {
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return fileError('No file was provided.');
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return fileError(
        'Please upload a .csv file. Excel workbooks are not supported — export as CSV first.',
        file.name
      );
    }

    const fileName = file.name;
    const text = await file.text();

    if (text.trim() === '') {
      return fileError('The file is empty.', fileName);
    }

    const headerLine = text.split(/\r?\n/, 1)[0] ?? '';

    if (!headerLine.includes(QUESTIONNAIRE_CSV_DELIMITER)) {
      const hint = headerLine.includes(',')
        ? ' The header looks comma-delimited — re-export it with semicolons (in Excel: Save As → CSV, or set the list separator to ";").'
        : '';
      return fileError(
        `This file does not look semicolon-delimited.${hint}`,
        fileName
      );
    }

    const rows = parse(text, {
      columns: true,
      delimiter: QUESTIONNAIRE_CSV_DELIMITER,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    }) as Record<string, string>[];

    if (rows.length === 0) {
      return fileError('The file has a header row but no data rows.', fileName);
    }

    const headers = Object.keys(rows[0]);
    const missing = QUESTIONNAIRE_CSV_COLUMNS.filter(
      (column) => !headers.includes(column)
    );

    if (missing.length > 0) {
      return {
        fileName,
        rows: [],
        errors: [
          {
            row: 1,
            field: 'headers',
            message: `Missing required ${missing.length === 1 ? 'column' : 'columns'}: ${missing.join('; ')}. Expected header: ${QUESTIONNAIRE_CSV_COLUMNS.join(QUESTIONNAIRE_CSV_DELIMITER)}`,
          },
        ],
      };
    }

    const cleaned = rows.map((row) => {
      const kept: Record<string, string> = {};
      for (const column of QUESTIONNAIRE_CSV_COLUMNS) {
        kept[column] = row[column] ?? '';
      }
      return kept;
    });

    return {
      fileName,
      rows: cleaned,
      errors: validateRows(cleaned),
    };
  } catch (error) {
    console.error('Questionnaire CSV parse error:', error);
    return fileError(
      error instanceof Error ? error.message : 'The file could not be read.'
    );
  }
}

export async function validateQuestionnaireRows(
  rows: Record<string, string>[]
): Promise<QuestionnaireValidationError[]> {
  return [...validateRows(rows), ...detectQuestionConflicts(rows).errors];
}

function validateRows(
  rows: Record<string, string>[]
): QuestionnaireValidationError[] {
  const result = QuestionnaireRowSchema.array().safeParse(rows);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    row: csvRowNumber(issue.path[0] as number),
    field: String(issue.path[1] ?? 'row'),
    message: issue.message,
  }));
}

function detectQuestionConflicts(rows: Record<string, string>[]): {
  questions: ParsedQuestion[];
  errors: QuestionnaireValidationError[];
} {
  const errors: QuestionnaireValidationError[] = [];
  const order: string[] = [];
  const groups = new Map<
    string,
    { row: Record<string, string>; rowNumber: number }[]
  >();

  rows.forEach((row, index) => {
    const id = (row['Question ID'] ?? '').trim();
    if (id === '') return;

    if (!groups.has(id)) {
      groups.set(id, []);
      order.push(id);
    }
    groups.get(id)!.push({ row, rowNumber: csvRowNumber(index) });
  });

  const questions: ParsedQuestion[] = [];

  for (const id of order) {
    const entries = groups.get(id)!;
    const [first] = entries;

    const conflicting: string[] = [];
    for (const column of [
      'Section',
      'Question',
      'Help Text',
      'Type',
      'Required',
    ] as const) {
      const values = new Set(
        entries.map((entry) => (entry.row[column] ?? '').trim().toLowerCase())
      );
      if (values.size > 1) conflicting.push(column);
    }

    if (conflicting.length > 0) {
      const rowList = entries.map((entry) => entry.rowNumber).join(', ');
      errors.push({
        row: entries[1]?.rowNumber ?? first.rowNumber,
        field: 'Question ID',
        message: `Question ID "${id}" is used for more than one question — rows ${rowList} disagree on: ${conflicting.join(', ')}. Give each question its own ID, or make these rows identical if they are options of one question.`,
      });
      continue;
    }

    const type = (first.row.Type ?? '').trim().toLowerCase();
    const optionRows = entries.filter(
      (entry) => (entry.row.Option ?? '').trim() !== ''
    );

    const seenOptionIds = new Map<string, number>();
    for (const entry of optionRows) {
      const optionId = (entry.row['Option ID'] ?? '').trim();
      if (optionId === '') continue;
      const previous = seenOptionIds.get(optionId);
      if (previous !== undefined) {
        errors.push({
          row: entry.rowNumber,
          field: 'Option ID',
          message: `Option ID "${optionId}" appears twice for question "${id}" (also on row ${previous}).`,
        });
      } else {
        seenOptionIds.set(optionId, entry.rowNumber);
      }
    }

    if (isScoreable(type as ParsedQuestion['type'])) {
      for (const entry of optionRows) {
        if ((entry.row['Option ID'] ?? '').trim() === '') {
          errors.push({
            row: entry.rowNumber,
            field: 'Option ID',
            message: `Option ID is required on option rows (question "${id}").`,
          });
        }
      }
    }

    questions.push({
      externalId: id,
      sectionTitle: (first.row.Section ?? '').trim(),
      text: (first.row.Question ?? '').trim(),
      helpText: (first.row['Help Text'] ?? '').trim() || undefined,
      type: type as ParsedQuestion['type'],
      required: isRequiredValue(
        (first.row.Required ?? '').trim().toLowerCase()
      ),
      options: optionRows.map((entry) => ({
        label: (entry.row.Option ?? '').trim(),
        score: parseOptionScore((entry.row['Option Score'] ?? '').trim()),
      })),
    });
  }

  return { questions, errors };
}

export async function summariseQuestionnaireRows(
  rows: Record<string, string>[]
): Promise<{
  sections: { title: string; questionCount: number }[];
  questionCount: number;
  optionCount: number;
}> {
  const { questions } = detectQuestionConflicts(rows);

  const sections: { title: string; questionCount: number }[] = [];
  for (const question of questions) {
    const existing = sections.find(
      (section) => section.title === question.sectionTitle
    );
    if (existing) {
      existing.questionCount += 1;
    } else {
      sections.push({ title: question.sectionTitle, questionCount: 1 });
    }
  }

  return {
    sections,
    questionCount: questions.length,
    optionCount: questions.reduce((sum, q) => sum + q.options.length, 0),
  };
}

export async function importQuestionnaire(
  rows: Record<string, string>[],
  target: QuestionnaireTarget
): Promise<{
  success: boolean;
  message: string;
  questionnaireId?: number;
  version?: number;
  errors?: QuestionnaireValidationError[];
}> {
  if (rows.length === 0) {
    return { success: false, message: 'There are no rows to import.' };
  }

  const fieldErrors = validateRows(rows);
  const { questions, errors: conflictErrors } = detectQuestionConflicts(rows);
  const errors = [...fieldErrors, ...conflictErrors];

  if (errors.length > 0) {
    return {
      success: false,
      message: `Nothing was imported: ${errors.length} ${errors.length === 1 ? 'problem' : 'problems'} found in the file.`,
      errors: errors.sort((a, b) => a.row - b.row),
    };
  }

  return await createQuestionnaireVersion(target, questions);
}
