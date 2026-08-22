'use client';

import {
  importQuestionnaireAction,
  parseQuestionnaireCsvAction,
  summariseQuestionnaireRowsAction,
  validateQuestionnaireRowsAction,
} from '@/app/admin/questionnaires/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import DynamicCSVTableEditor, {
  type CSVTableData,
  type CsvRow,
  csvText,
} from '@/components/ui/dynamic-csv-table';
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import {
  QUESTIONNAIRE_CSV_COLUMNS,
  QUESTIONNAIRE_CSV_DELIMITER,
  QUESTIONNAIRE_CSV_SAMPLE_PATH,
  type QuestionnaireParseResult,
} from '@/types/questionnaire-csv';
import {
  type QuestionnaireSummary,
  type QuestionnaireTarget,
  type QuestionnaireValidationError,
} from '@/types/questionnaire-data';
import { CheckCircle2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type Step = 'upload' | 'preview' | 'complete';

interface QuestionnaireUploadProps {
  existing: QuestionnaireSummary[];
}

export function QuestionnaireUpload({ existing }: QuestionnaireUploadProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [parseResult, setParseResult] =
    useState<QuestionnaireParseResult | null>(null);
  const [errors, setErrors] = useState<QuestionnaireValidationError[]>([]);
  const [hasRevalidated, setHasRevalidated] = useState(false);
  const [summary, setSummary] = useState<{
    sections: { title: string; questionCount: number }[];
    questionCount: number;
    optionCount: number;
  } | null>(null);

  const lineages = useMemo(() => {
    const seen = new Set<string>();
    return existing.filter((questionnaire) => {
      if (seen.has(questionnaire.key)) return false;
      seen.add(questionnaire.key);
      return true;
    });
  }, [existing]);

  const [mode, setMode] = useState<'new' | 'version'>('new');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [versionOf, setVersionOf] = useState<number | null>(
    lineages[0]?.id ?? null
  );

  const target: QuestionnaireTarget | null =
    mode === 'new'
      ? name.trim() === ''
        ? null
        : {
            kind: 'new',
            name: name.trim(),
            description: description.trim() || undefined,
          }
      : versionOf === null
        ? null
        : { kind: 'version', questionnaireId: versionOf };

  const visibleErrors = useMemo(
    () => (hasRevalidated ? errors : (parseResult?.errors ?? [])),
    [hasRevalidated, errors, parseResult]
  );

  // error.row is a spreadsheet row; the table highlights by 1-based table row, hence the -1.
  const errorRows = useMemo(
    () => new Set(visibleErrors.map((error) => error.row - 1)),
    [visibleErrors]
  );

  const tableData: CSVTableData = useMemo(
    () => ({
      headers: [...QUESTIONNAIRE_CSV_COLUMNS],
      rows: parseResult?.rows ?? [],
    }),
    [parseResult]
  );

  const toRecords = (rows: CsvRow[]): Record<string, string>[] =>
    rows.map((row) => {
      const record: Record<string, string> = {};
      for (const column of QUESTIONNAIRE_CSV_COLUMNS) {
        record[column] = csvText(row, column);
      }
      return record;
    });

  const handleParse = async () => {
    if (!file) {
      toast.error('Choose a CSV file first.');
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await parseQuestionnaireCsvAction(formData);
      setParseResult(result);
      setErrors([]);
      setHasRevalidated(false);

      if (result.rows.length === 0) {
        toast.error(
          result.errors[0]?.message ?? 'The file could not be parsed.'
        );
        return;
      }

      setSummary(await summariseQuestionnaireRowsAction(result.rows));
      setStep('preview');

      if (result.errors.length > 0) {
        toast.warning(
          `Parsed with ${result.errors.length} problem${result.errors.length === 1 ? '' : 's'} — fix them below.`
        );
      } else {
        toast.success('File parsed. Review it below.');
      }
    } catch (error) {
      console.error('Error parsing questionnaire CSV:', error);
      toast.error('The file could not be parsed.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRevalidate = async (rows: CsvRow[]) => {
    const records = toRecords(rows);
    setIsBusy(true);
    try {
      const found = await validateQuestionnaireRowsAction(records);
      setErrors(found);
      setHasRevalidated(true);
      setSummary(await summariseQuestionnaireRowsAction(records));

      if (found.length > 0) {
        toast.warning(
          `${found.length} problem${found.length === 1 ? '' : 's'} remaining.`
        );
      } else {
        toast.success('Everything checks out — ready to publish.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = async (rows: CsvRow[]) => {
    if (!target) {
      toast.error(
        mode === 'new'
          ? 'Give the questionnaire a name first.'
          : 'Choose which questionnaire this is a new version of.'
      );
      return;
    }

    setIsBusy(true);
    try {
      const result = await importQuestionnaireAction(toRecords(rows), target);

      if (!result.success) {
        setErrors(result.errors ?? []);
        setHasRevalidated(true);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setStep('complete');
      setTimeout(() => router.push('/admin/questionnaires'), 1500);
    } catch (error) {
      console.error('Error importing questionnaire:', error);
      toast.error('The questionnaire could not be imported.');
    } finally {
      setIsBusy(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="text-risk-green-foreground size-16" />
        <CardTitle className="text-xl">Questionnaire published</CardTitle>
        <p className="text-muted-foreground">
          It is now the active questionnaire. Taking you back to the list…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {step === 'upload' && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <CardTitle>What are you publishing?</CardTitle>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={mode === 'new' ? 'brandSolid' : 'brandOutline'}
                  size="pill"
                  onClick={() => setMode('new')}
                >
                  A new questionnaire
                </Button>
                <Button
                  variant={mode === 'version' ? 'brandSolid' : 'brandOutline'}
                  size="pill"
                  onClick={() => setMode('version')}
                  disabled={lineages.length === 0}
                  title={
                    lineages.length === 0
                      ? 'There is no existing questionnaire to version yet.'
                      : undefined
                  }
                >
                  A new version of an existing one
                </Button>
              </div>

              {mode === 'new' ? (
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="questionnaire-name">Name</Label>
                    <Input
                      id="questionnaire-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Supplier Evaluation Questionnaire"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="questionnaire-description">
                      Description (optional)
                    </Label>
                    <Input
                      id="questionnaire-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What this questionnaire covers"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="questionnaire-version-of">
                    New version of
                  </Label>
                  <NativeSelect
                    id="questionnaire-version-of"
                    value={versionOf ?? ''}
                    onChange={(event) =>
                      setVersionOf(Number(event.target.value))
                    }
                  >
                    {lineages.map((questionnaire) => (
                      <option key={questionnaire.id} value={questionnaire.id}>
                        {questionnaire.name} (currently v{questionnaire.version}
                        )
                      </option>
                    ))}
                  </NativeSelect>
                  <p className="text-muted-foreground text-sm">
                    The new version becomes active and the current one is
                    archived. Submissions already in progress stay on the
                    version they started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>The spreadsheet</CardTitle>
                <Button variant="brandOutline" size="pillCompact" asChild>
                  <a href={QUESTIONNAIRE_CSV_SAMPLE_PATH} download>
                    <Download />
                    Download sample CSV
                  </a>
                </Button>
              </div>

              <p className="text-muted-foreground text-sm">
                CSV only, <strong>semicolon-delimited</strong> — Excel workbooks
                are not parsed, so export as CSV first. One row per option; a
                question with no options (text or long text) gets a single row
                with the option columns blank. Repeat the question columns on
                every option row of the same <code>Question ID</code>.
              </p>

              <div className="overflow-x-auto">
                <code className="text-muted-foreground text-xs whitespace-pre">
                  {QUESTIONNAIRE_CSV_COLUMNS.join(QUESTIONNAIRE_CSV_DELIMITER)}
                </code>
              </div>

              <FileUploadDropzone
                onFileSelect={setFile}
                selectedFile={file}
                onRemoveFile={() => {
                  setFile(null);
                  setParseResult(null);
                }}
                isUploading={isBusy}
                title="Drag and drop your questionnaire CSV here"
              />

              {parseResult?.rows.length === 0 && (
                <div className="bg-risk-red text-risk-red-foreground rounded-lg p-4">
                  {parseResult.errors.map((error) => (
                    <p key={`${error.field}-${error.message}`}>
                      {error.message}
                    </p>
                  ))}
                </div>
              )}

              <div>
                <Button
                  variant="brandSolid"
                  size="pill"
                  onClick={handleParse}
                  disabled={!file || isBusy}
                >
                  {isBusy ? 'Parsing…' : 'Parse file'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'preview' && parseResult && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Review “{parseResult.fileName}”</CardTitle>
            <Button
              variant="outline"
              size="pillCompact"
              onClick={() => {
                setStep('upload');
                setParseResult(null);
                setErrors([]);
                setHasRevalidated(false);
                setSummary(null);
              }}
            >
              Back to upload
            </Button>
          </div>

          {summary && (
            <Card>
              <CardContent className="flex flex-wrap gap-x-8 gap-y-2 pt-6 text-sm">
                <span>
                  <strong>{summary.sections.length}</strong> sections
                </span>
                <span>
                  <strong>{summary.questionCount}</strong> questions
                </span>
                <span>
                  <strong>{summary.optionCount}</strong> options
                </span>
                <span className="text-muted-foreground">
                  {summary.sections
                    .map(
                      (section) => `${section.title} (${section.questionCount})`
                    )
                    .join(' · ')}
                </span>
              </CardContent>
            </Card>
          )}

          {visibleErrors.length > 0 && (
            <div
              className={cn(
                'bg-risk-red text-risk-red-foreground rounded-lg p-4'
              )}
            >
              <p className="mb-2 font-medium">
                {visibleErrors.length} problem
                {visibleErrors.length === 1 ? '' : 's'} — nothing will be
                imported until these are fixed:
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                {visibleErrors.map((error, index) => (
                  <li key={`${error.row}-${error.field}-${index}`}>
                    Row {error.row}, {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DynamicCSVTableEditor
            data={tableData}
            onInsert={handleImport}
            onRevalidate={(rows) => void handleRevalidate(rows)}
            onError={(message) => toast.error(message)}
            hasValidationErrors={visibleErrors.length > 0}
            duplicateRows={errorRows}
          />
        </div>
      )}
    </div>
  );
}
