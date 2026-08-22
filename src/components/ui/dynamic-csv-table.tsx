import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export type CsvCell = string | number | null;

export type CsvRow = Record<string, CsvCell>;

type EditorRow = CsvRow & { _id: string; _originalIndex?: number };

export const csvText = (row: CsvRow, key: string): string => {
  const value = row[key];
  return typeof value === 'string' ? value : (value?.toString() ?? '');
};

export const csvNumber = (row: CsvRow, key: string): number => {
  const value = row[key];
  return typeof value === 'number' ? value : Number(value ?? NaN);
};

export interface CSVTableData {
  headers: string[];
  rows: CsvRow[];
}

const withRowIds = (data: CSVTableData | undefined): EditorRow[] =>
  (data?.rows ?? []).map((row, index) => ({
    ...row,
    _id: `row_${index}`,
    _originalIndex: index,
  }));

interface DynamicCSVTableEditorProps {
  data: CSVTableData;
  onInsert?: (data: CsvRow[]) => Promise<void>;
  onError: (error: string) => void;
  onRevalidate?: (data: CsvRow[]) => void;
  hasValidationErrors?: boolean;
  duplicateRows?: Set<number>;
  readOnly?: boolean;
}

const DynamicCSVTableEditor = ({
  data,
  onInsert,
  onError,
  onRevalidate,
  hasValidationErrors = false,
  duplicateRows = new Set(),
  readOnly = false,
}: DynamicCSVTableEditorProps) => {
  const [tableData, setTableData] = useState<EditorRow[]>(() =>
    withRowIds(data)
  );
  const [headers, setHeaders] = useState<string[]>(data?.headers ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [editedRows, setEditedRows] = useState(new Set<string>());

  const [seededFrom, setSeededFrom] = useState(data);
  if (seededFrom !== data) {
    setSeededFrom(data);
    setHeaders(data?.headers ?? []);
    setTableData(withRowIds(data));
    setEditedRows(new Set());
  }

  const handleCellChange = (rowId: string, column: string, value: CsvCell) => {
    setTableData((prevData) =>
      prevData.map((row) =>
        row._id === rowId ? { ...row, [column]: value } : row
      )
    );

    setEditedRows((prev) => new Set(prev.add(rowId)));
  };

  const handleInsertData = async () => {
    if (!onInsert) {
      onError('Insert function not provided');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData = tableData.map(({ _id, _originalIndex, ...row }) => row);

      await onInsert(cleanData);

      setEditedRows(new Set());
    } catch (error) {
      onError(
        `Failed to insert data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addRow = () => {
    const newId = `row_${Date.now()}`;
    const newRow: EditorRow = { _id: newId };

    headers.forEach((header) => {
      newRow[header] = '';
    });

    setTableData((prev) => [...prev, newRow]);
  };

  const removeRow = (rowId: string) => {
    setTableData((prev) => prev.filter((row) => row._id !== rowId));
    setEditedRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
  };

  const exportToCSV = () => {
    const cleanData = tableData.map(({ _id, _originalIndex, ...row }) => row);

    const csvHeader = headers.join(';');
    const csvRows = cleanData.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || '';
          return typeof value === 'string' &&
            (value.includes(';') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(';')
    );

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevalidate = () => {
    if (onRevalidate) {
      const cleanData = tableData.map(({ _id, _originalIndex, ...row }) => row);
      onRevalidate(cleanData);
    }
  };

  if (!data?.rows) {
    return (
      <div className="p-4 text-center text-gray-500">No data provided</div>
    );
  }

  if (headers.length === 0) {
    return <div className="p-4 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <div className={`w-full`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {tableData.length} rows, {headers.length} columns
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <Button variant="outline" size="pillCompact" onClick={addRow}>
                Add Row
              </Button>
              {onRevalidate && (
                <Button
                  variant="brandOutline"
                  size="pillCompact"
                  onClick={handleRevalidate}
                  title="Re-validate all data"
                >
                  Validate Data
                </Button>
              )}
              <Button
                variant="brandSolid"
                size="pillCompact"
                onClick={handleInsertData}
                disabled={
                  isLoading || tableData.length === 0 || hasValidationErrors
                }
                title={
                  hasValidationErrors
                    ? 'Fix validation errors before saving'
                    : 'Save data to database'
                }
              >
                {isLoading ? 'Saving...' : 'Save to Database'}
              </Button>
            </>
          )}
          <Button variant="outline" size="pillCompact" onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted">
            <tr>
              {!readOnly && (
                <th className="w-16 px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  X
                </th>
              )}
              <th className="w-16 px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Row #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border bg-card divide-y">
            {tableData.map((row, index) => {
              const rowNumber = index + 1;
              const isDuplicate = duplicateRows.has(rowNumber);

              return (
                <tr
                  key={row._id}
                  className={`hover:bg-gray-50 ${
                    editedRows.has(row._id) ? 'bg-risk-yellow/20' : ''
                  } ${
                    isDuplicate
                      ? 'border-risk-red bg-risk-red/20 border-l-4'
                      : ''
                  }`}
                >
                  {!readOnly && (
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(row._id)}
                        className="text-sm text-red-500 hover:text-red-700"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                  <td className="px-2 py-2 text-center">
                    <span className="text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                  </td>
                  {headers.map((header) => (
                    <td key={`${row._id}_${header}`} className="px-3 py-2">
                      {readOnly ? (
                        <span className="text-sm text-gray-900">
                          {row[header] || ''}
                        </span>
                      ) : (
                        <Input
                          type="text"
                          value={row[header] || ''}
                          onChange={(e) =>
                            handleCellChange(row._id, header, e.target.value)
                          }
                          className="h-8 text-sm"
                          placeholder={`Enter ${header}`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tableData.length === 0 && (
        <div className="py-8 text-center text-gray-500">No data to display</div>
      )}
    </div>
  );
};

export default DynamicCSVTableEditor;
