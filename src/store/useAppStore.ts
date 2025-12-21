import { create } from 'zustand';
import type {
    AppState,
    SelectionMode,
    Matrix8x8,
    SBox16x16,
    AnalysisMetrics,
    AESState,
    ImageEncryptionState
} from '../types';

interface AppActions {
    // Selection actions
    setMode: (mode: SelectionMode) => void;
    selectMatrix: (matrixId: string) => void;
    setCustomMatrix: (matrix: Matrix8x8, fileName: string) => void;
    clearCustomMatrix: () => void;
    setConstant: (constant: string) => void;
    setSearchQuery: (query: string) => void;
    setViewMode: (mode: 'engineering' | 'paper') => void;
    toggleDarkMode: () => void;
    setShowHelp: (show: boolean) => void;
    setCurrentPage: (page: 'sbox-research' | 'aes-encrypt' | 'steganography' | 'about') => void;

    // Analysis actions
    setAnalyzing: () => void;
    setResults: (
        matrix: Matrix8x8,
        sbox: SBox16x16,
        analysis: AnalysisMetrics,
        fixedPoints: number[],
        calculationTimeMs: number
    ) => void;
    setError: (error: string) => void;
    reset: () => void;

    // Page State Actions
    setAESState: (state: Partial<AESState>) => void;
    setImageEncryptionState: (state: Partial<ImageEncryptionState>) => void;
}

const initialState: AppState = {
    mode: 'predefined',
    selectedMatrixId: null,
    customMatrix: null,
    customFileName: null,
    constant: '63',

    displayMatrix: null,
    sbox: null,
    analysis: null,
    fixedPoints: [],
    calculationTimeMs: null,

    // Initial Page States
    aes: {
        inputData: '',
        key: '',
        sbox: 'KAES',
        output: '',
        status: 'ready',
        errorMsg: ''
    },
    imageEncryption: {
        sbox: 'KAES',
        key: '',
        encryptInput: null,
        encryptPreview: null,
        encryptResult: null,
        encryptStatus: 'ready',
        encryptError: '',
        decryptInput: null,
        decryptPreview: null,
        decryptResult: null,
        decryptStatus: 'ready',
        decryptError: '',
        metrics: {
            entropy: null, npcr: null, uaci: null,
            correlationH: null, correlationV: null, correlationD: null,
        }
    },

    status: 'idle',
    error: null,
    searchQuery: '',
    viewMode: 'engineering',
    darkMode: true,
    showHelp: false,
    currentPage: 'sbox-research',
};

export const useAppStore = create<AppState & AppActions>((set) => ({
    ...initialState,

    setMode: (mode) => set({
        mode,
        // Clear selection when switching modes
        selectedMatrixId: mode === 'predefined' ? null : null,
        customMatrix: mode === 'custom' ? null : null,
        customFileName: mode === 'custom' ? null : null,
    }),

    selectMatrix: (matrixId) => set({
        selectedMatrixId: matrixId,
        customMatrix: null,
        customFileName: null,
        status: 'ready',
        error: null,
    }),

    setCustomMatrix: (matrix, fileName) => set({
        customMatrix: matrix,
        customFileName: fileName,
        selectedMatrixId: null,
        status: 'ready',
        error: null,
    }),

    clearCustomMatrix: () => set({
        customMatrix: null,
        customFileName: null,
        status: 'idle',
    }),

    setConstant: (constant) => set({ constant }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setViewMode: (viewMode) => set({ viewMode }),

    toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        // Apply to document
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { darkMode: newDarkMode };
    }),

    setShowHelp: (showHelp) => set({ showHelp }),

    setCurrentPage: (currentPage) => set({ currentPage }),

    setAnalyzing: () => set({
        status: 'analyzing',
        error: null,
    }),

    setResults: (matrix, sbox, analysis, fixedPoints, calculationTimeMs) => set({
        displayMatrix: matrix,
        sbox,
        analysis,
        fixedPoints,
        calculationTimeMs,
        status: 'ready',
        error: null,
    }),

    setError: (error) => set({
        status: 'error',
        error,
    }),

    setAESState: (newState) => set((state) => ({
        aes: { ...state.aes, ...newState }
    })),

    setImageEncryptionState: (newState) => set((state) => ({
        imageEncryption: { ...state.imageEncryption, ...newState }
    })),

    reset: () => set(initialState),
}));
