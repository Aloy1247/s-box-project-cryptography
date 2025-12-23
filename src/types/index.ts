// Matrix types
export type Matrix8x8 = number[][];
export type SBox16x16 = number[][];

// Affine matrix definition from JSON
export interface AffineMatrixDef {
    id: string;
    name: string;
    author: string;
    tags: string[];
    matrix: Matrix8x8 | null;
    constant: string | null;
}

// Analysis metrics from backend
export interface AnalysisMetrics {
    nl: number;           // Non-Linearity
    sac: number;          // Strict Avalanche Criterion
    bicNl: number;        // BIC Non-Linearity
    bicSac: number;       // BIC SAC
    lap: number;          // Linear Approximation Probability
    dap: number;          // Differential Approximation Probability
    du: number;           // Differential Uniformity
    ad: number;           // Algebraic Degree
    to: number;           // Transparency Order
    ci: number;           // Correlation Immunity
}

// API request for analysis
export interface AnalyzeRequest {
    matrixId: string | null;
    customMatrix: Matrix8x8 | null;
    customSBox?: SBox16x16 | null;
    constant: string;
}

// API response for analysis
export interface AnalyzeResponse {
    matrix: Matrix8x8;
    sbox: SBox16x16;
    analysis: AnalysisMetrics;
    fixedPoints: number[];
    calculationTimeMs: number;
}

// AES Page State
export interface AESState {
    inputData: string;
    key: string;
    sbox: string;
    output: string;
    status: 'ready' | 'processing' | 'done' | 'error';
    errorMsg: string;
}

// Image Encryption Metrics
export interface ImageEncryptionMetrics {
    entropy: number | null;
    npcr: number | null;
    uaci: number | null;
    correlationH: number | null;
    correlationV: number | null;
    correlationD: number | null;
    histogramOriginal?: { r: number[]; g: number[]; b: number[] };
    histogramEncrypted?: { r: number[]; g: number[]; b: number[] };
}

// Image Encryption Page State
export interface ImageEncryptionState {
    sbox: string;
    key: string;

    // Encrypt
    encryptInput: File | null;
    encryptPreview: string | null;
    encryptResult: string | null;
    encryptStatus: 'ready' | 'processing' | 'done' | 'error';
    encryptError: string;

    // Decrypt
    decryptInput: File | null;
    decryptPreview: string | null;
    decryptResult: string | null;
    decryptStatus: 'ready' | 'processing' | 'done' | 'error';
    decryptError: string;

    // Analysis
    metrics: ImageEncryptionMetrics;
}

// Application state
export type SelectionMode = 'predefined' | 'custom';

export type AppStatus =
    | 'idle'
    | 'loading'
    | 'analyzing'
    | 'ready'
    | 'error';

export interface AppState {
    // Selection
    mode: SelectionMode;
    selectedMatrixId: string | null;
    customMatrix: Matrix8x8 | null;
    customFileName: string | null;
    customSBox: SBox16x16 | null;
    customSBoxFileName: string | null;
    constant: string;

    // View Mode
    viewMode: 'engineering' | 'paper';

    // Results
    displayMatrix: Matrix8x8 | null;
    sbox: SBox16x16 | null;
    analysis: AnalysisMetrics | null;
    fixedPoints: number[];
    calculationTimeMs: number | null;

    // Page States
    aes: AESState;
    imageEncryption: ImageEncryptionState;

    // UI State
    status: AppStatus;
    error: string | null;
    searchQuery: string;
    darkMode: boolean;
    showHelp: boolean;
    currentPage: 'sbox-research' | 'aes-encrypt' | 'steganography' | 'about';
}
