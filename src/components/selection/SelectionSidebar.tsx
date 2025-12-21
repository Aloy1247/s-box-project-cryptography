import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { fetchMatrices } from '../../api/sboxApi';
import { parseMatrixFile } from '../../utils/fileParser';
import type { AffineMatrixDef } from '../../types';

export function SelectionSidebar() {
    const {
        mode,
        setMode,
        selectedMatrixId,
        selectMatrix,
        customFileName,
        setCustomMatrix,
        clearCustomMatrix,
        searchQuery,
        setSearchQuery,
    } = useAppStore();

    const [matrices, setMatrices] = useState<AffineMatrixDef[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchMatrices().then(setMatrices);
    }, []);

    const filteredMatrices = matrices.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileUpload = useCallback(async (file: File) => {
        setUploadError(null);
        const result = await parseMatrixFile(file);

        if (result.success && result.matrix) {
            setCustomMatrix(result.matrix, file.name);
        } else {
            setUploadError(result.error || 'Failed to parse file');
        }
    }, [setCustomMatrix]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <>
            {/* Mode Toggle */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'predefined'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        onClick={() => setMode('predefined')}
                    >
                        Predefined
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'custom'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        onClick={() => setMode('custom')}
                    >
                        Custom
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        placeholder="Search matrices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={mode === 'custom'}
                    />
                </div>
            </div>

            {/* Matrix List */}
            <div className={`flex-1 overflow-y-auto px-2 py-2 space-y-1 ${mode === 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
                {filteredMatrices.map((matrix) => (
                    <button
                        key={matrix.id}
                        className={`w-full text-left p-3 rounded-lg border transition-colors spotlight-border ${selectedMatrixId === matrix.id
                            ? 'bg-blue-500/5 hover:bg-blue-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        onClick={() => selectMatrix(matrix.id)}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{matrix.name}</span>
                            {selectedMatrixId === matrix.id && (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            )}
                        </div>
                        {matrix.author && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">{matrix.author}</div>
                        )}
                        {matrix.tags.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                {matrix.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tag === 'Standard' ? 'bg-blue-100 text-blue-700' :
                                            tag === 'Best' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Custom Upload Zone */}
            <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative z-30 ${mode === 'custom' ? 'ring-2 ring-blue-500 ring-inset' : ''
                }`}>
                {customFileName ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{customFileName}</p>
                                <p className="text-xs text-green-600">Valid 8×8 matrix</p>
                            </div>
                            <button
                                onClick={clearCustomMatrix}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <label
                        className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <input
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                            }}
                        />
                        <svg className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs font-medium text-slate-500">
                            {isDragging ? 'Drop file here' : 'Upload Custom Matrix'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">CSV or XLSX, 8×8 binary</p>
                    </label>
                )}

                {uploadError && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                    </div>
                )}
            </div>
        </>
    );
}
