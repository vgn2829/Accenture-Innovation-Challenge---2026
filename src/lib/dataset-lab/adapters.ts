import type { DatasetFormat } from './types';

export interface AdapterResult {
  format: DatasetFormat;
  rows: Array<Record<string, unknown>>;
  malformedRows: number;
  columns: string[];
  errors: string[];
}

export interface DatasetAdapter {
  readonly format: DatasetFormat;
  parse(input: string): AdapterResult;
}

function columnsFrom(rows: Array<Record<string, unknown>>): string[] {
  return Array.from(new Set(rows.flatMap(row => Object.keys(row))));
}

function depth(value: unknown, current = 0): number {
  if (!value || typeof value !== 'object') return current;
  const values = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  return values.reduce((max, child) => Math.max(max, depth(child, current + 1)), current);
}

export class JsonAdapter implements DatasetAdapter {
  readonly format = 'json' as const;
  parse(input: string): AdapterResult {
    try {
      const parsed: unknown = JSON.parse(input);
      const values = Array.isArray(parsed) ? parsed : [parsed];
      if (depth(parsed) > 8) throw new Error('JSON nesting depth exceeds the prototype limit of 8.');
      const rows = values.filter(value => value && typeof value === 'object' && !Array.isArray(value)) as Array<Record<string, unknown>>;
      return { format: this.format, rows, malformedRows: values.length - rows.length, columns: columnsFrom(rows), errors: rows.length === values.length ? [] : ['Some JSON values were not objects.'] };
    } catch (error) {
      return { format: this.format, rows: [], malformedRows: 1, columns: [], errors: [`Invalid JSON: ${(error as Error).message}`] };
    }
  }
}

export class JsonlAdapter implements DatasetAdapter {
  readonly format = 'jsonl' as const;
  parse(input: string): AdapterResult {
    const rows: Array<Record<string, unknown>> = [];
    let malformedRows = 0;
    const errors: string[] = [];
    input.split(/\r?\n/).filter(line => line.trim()).forEach((line, index) => {
      try {
        const value: unknown = JSON.parse(line);
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('line is not a JSON object');
        if (depth(value) > 8) throw new Error('JSON nesting depth exceeds the prototype limit of 8.');
        rows.push(value as Record<string, unknown>);
      } catch (error) {
        malformedRows += 1;
        if (errors.length < 5) errors.push(`Line ${index + 1}: ${(error as Error).message}`);
      }
    });
    return { format: this.format, rows, malformedRows, columns: columnsFrom(rows), errors };
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { cells.push(cell); cell = ''; continue; }
    cell += char;
  }
  if (quoted) throw new Error('unterminated quoted field');
  cells.push(cell);
  return cells;
}

export class CsvAdapter implements DatasetAdapter {
  readonly format = 'csv' as const;
  parse(input: string): AdapterResult {
    const lines = input.split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return { format: this.format, rows: [], malformedRows: 0, columns: [], errors: ['CSV is empty.'] };
    let headers: string[];
    try { headers = parseCsvLine(lines[0]).map(header => header.normalize('NFKC').trim()); } catch (error) { return { format: this.format, rows: [], malformedRows: 1, columns: [], errors: [(error as Error).message] }; }
    const rows: Array<Record<string, unknown>> = [];
    let malformedRows = 0;
    const errors: string[] = [];
    lines.slice(1).forEach((line, index) => {
      try {
        const cells = parseCsvLine(line);
        if (cells.length !== headers.length) throw new Error(`expected ${headers.length} fields, received ${cells.length}`);
        rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]])));
      } catch (error) {
        malformedRows += 1;
        if (errors.length < 5) errors.push(`Row ${index + 2}: ${(error as Error).message}`);
      }
    });
    return { format: this.format, rows, malformedRows, columns: headers, errors };
  }
}

export function adapterFor(format: DatasetFormat): DatasetAdapter {
  if (format === 'csv') return new CsvAdapter();
  if (format === 'jsonl') return new JsonlAdapter();
  return new JsonAdapter();
}
