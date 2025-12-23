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

// Parse raw data from CSV
function parseRawCSV(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error(`CSV parse error: ${results.errors[0].message}`));
                    return;
                }
                const data = results.data as unknown[][];
                const filtered = data.filter(row => row.some(cell => cell !== '' && cell !== null));
                resolve(filtered);
            },
            error: (error) => reject(new Error(`Failed to read CSV: ${error.message}`)),
        });
    });
}

// Parse raw data from XLSX
function parseRawXLSX(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
                const filtered = jsonData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
                resolve(filtered);
            } catch (error) {
                reject(new Error(`Failed to read XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsBinaryString(file);
    });
}

// Validate that S-box is 16x16 and values 0-255
function validateSBox(data: unknown[][]): ParseResult {
    if (data.length !== 16) {
        return { success: false, error: `S-box must be 16×16. Found ${data.length} rows.` };
    }
    const sbox: number[][] = [];
    for (let i = 0; i < 16; i++) {
        const row = data[i];
        if (!row || row.length !== 16) {
            return { success: false, error: `Row ${i + 1} must have 16 columns.` };
        }
        const numRow: number[] = [];
        for (let j = 0; j < 16; j++) {
            const val = Number(row[j]);
            if (isNaN(val) || val < 0 || val > 255) {
                return { success: false, error: `Invalid value at [${i + 1},${j + 1}]: ${row[j]}` };
            }
            numRow.push(val);
        }
        sbox.push(numRow);
    }
    return { success: true, matrix: sbox };
}

// Parse file based on extension (Matrix 8x8)
export async function parseMatrixFile(file: File): Promise<ParseResult> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
        let data: unknown[][] = [];
        if (ext === 'csv') data = await parseRawCSV(file);
        else if (ext === 'xlsx' || ext === 'xls') data = await parseRawXLSX(file);
        else return { success: false, error: 'Unsupported file format.' };

        return validateMatrix(data);
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Parse error' };
    }
}

// Parse file based on extension (S-Box 16x16)
export async function parseSBoxFile(file: File): Promise<ParseResult> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
        let data: unknown[][] = [];
        if (ext === 'csv') data = await parseRawCSV(file);
        else if (ext === 'xlsx' || ext === 'xls') data = await parseRawXLSX(file);
        else return { success: false, error: 'Unsupported file format.' };

        return validateSBox(data);
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Parse error' };
    }
}

// Keep old exports just in case (optional, but refactoring replaced them)
export const parseCSV = async (file: File) => parseMatrixFile(file);
export const parseXLSX = async (file: File) => parseMatrixFile(file);
