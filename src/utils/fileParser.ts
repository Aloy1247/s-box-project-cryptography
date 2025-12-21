import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Matrix8x8 } from '../types';

export interface ParseResult {
    success: boolean;
    matrix?: Matrix8x8;
    error?: string;
}

// Validate that matrix is 8x8 and binary
function validateMatrix(data: unknown[][]): ParseResult {
    if (data.length !== 8) {
        return {
            success: false,
            error: `Matrix must be 8×8. Found ${data.length} rows.`,
        };
    }

    const matrix: Matrix8x8 = [];

    for (let i = 0; i < 8; i++) {
        const row = data[i];
        if (!row || row.length !== 8) {
            return {
                success: false,
                error: `Row ${i + 1} must have 8 columns. Found ${row?.length || 0}.`,
            };
        }

        const numRow: number[] = [];
        for (let j = 0; j < 8; j++) {
            const val = Number(row[j]);
            if (val !== 0 && val !== 1) {
                return {
                    success: false,
                    error: `All values must be binary (0 or 1). Found "${row[j]}" at position [${i + 1}, ${j + 1}].`,
                };
            }
            numRow.push(val);
        }
        matrix.push(numRow);
    }

    return { success: true, matrix };
}

// Parse CSV file
export function parseCSV(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        Papa.parse(file, {
            complete: (results) => {
                if (results.errors.length > 0) {
                    resolve({
                        success: false,
                        error: `CSV parse error: ${results.errors[0].message}`,
                    });
                    return;
                }

                const data = results.data as unknown[][];
                // Filter out empty rows
                const filtered = data.filter(row => row.some(cell => cell !== '' && cell !== null));
                resolve(validateMatrix(filtered));
            },
            error: (error) => {
                resolve({
                    success: false,
                    error: `Failed to read CSV: ${error.message}`,
                });
            },
        });
    });
}

// Parse XLSX file
export function parseXLSX(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

                // Filter out empty rows
                const filtered = jsonData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
                resolve(validateMatrix(filtered));
            } catch (error) {
                resolve({
                    success: false,
                    error: `Failed to read XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
            }
        };

        reader.onerror = () => {
            resolve({
                success: false,
                error: 'Failed to read file',
            });
        };

        reader.readAsBinaryString(file);
    });
}

// Parse file based on extension
export async function parseMatrixFile(file: File): Promise<ParseResult> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
        return parseCSV(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
        return parseXLSX(file);
    } else {
        return {
            success: false,
            error: `Unsupported file format. Use CSV or XLSX.`,
        };
    }
}
