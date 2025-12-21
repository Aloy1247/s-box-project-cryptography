import type { AnalyzeRequest, AnalyzeResponse, AffineMatrixDef } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Fetch all predefined matrices
export async function fetchMatrices(): Promise<AffineMatrixDef[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/matrices`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data.matrices.map((m: any) => ({
            id: m.id,
            name: m.name,
            author: m.author,
            tags: m.tags || [],
            matrix: null, // Matrix data loaded separately
            constant: null,
        }));
    } catch (error) {
        console.error('Failed to fetch matrices:', error);
        // Fallback to local JSON if API unavailable
        const response = await fetch('/matrices.json');
        const data = await response.json();
        return data.matrices;
    }
}

// Send matrix for analysis and S-box generation
export async function analyzeMatrix(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.error || error.detail || 'Analysis failed');
    }

    return response.json();
}

// Validate custom matrix file
export async function validateMatrix(file: File): Promise<{
    valid: boolean;
    matrix?: number[][];
    error?: string;
}> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/matrices/validate`, {
        method: 'POST',
        body: formData,
    });

    return response.json();
}

// Export report with selective includes
export async function exportReport(
    matrixId: string | null,
    customMatrix: number[][] | null,
    constant: string,
    format: 'csv' | 'xlsx',
    include: ('matrix' | 'sbox' | 'analysis')[] = ['matrix', 'sbox', 'analysis']
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            matrixId,
            customMatrix,
            constant,
            format,
            include,
        }),
    });

    if (!response.ok) {
        throw new Error('Export failed');
    }

    // Determine filename based on what's being exported
    let filename = 'sbox_report';
    if (include.length === 1) {
        if (include[0] === 'matrix') filename = 'affine_matrix';
        else if (include[0] === 'sbox') filename = 'sbox_table';
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
