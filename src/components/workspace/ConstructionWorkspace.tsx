import { useAppStore } from '../../store/useAppStore';
import { analyzeMatrix, exportReport, fetchMatrix } from '../../api/sboxApi';
import { useState, useEffect } from 'react';

export function ConstructionWorkspace() {
    const {
        selectedMatrixId,
        customMatrix,
        customSBox,
        constant,
        setConstant,
        displayMatrix,
        sbox,
        status,
        setAnalyzing,
        setResults,
        setError,
        viewMode,
        setViewMode,
    } = useAppStore();

    const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

    const canAnalyze = selectedMatrixId !== null || customMatrix !== null || customSBox !== null;
    const isAnalyzing = status === 'analyzing';

    // Fetch matrix details for preview when ID changes
    useEffect(() => {
        if (selectedMatrixId && !customMatrix && !customSBox) {
            fetchMatrix(selectedMatrixId).then(data => {
                if (data && data.matrix) {
                    // Directly update store for preview (using setState to avoid adding new action)
                    useAppStore.setState({ displayMatrix: data.matrix });
                    // Also update constant if present
                    if (data.constant) {
                        setConstant(data.constant); // Logic in store action
                    }
                }
            });
        }
    }, [selectedMatrixId, customMatrix, customSBox, setConstant]);

    const handleStartAnalysis = async () => {
        if (!canAnalyze) return;

        setAnalyzing();

        try {
            const result = await analyzeMatrix({
                matrixId: selectedMatrixId,
                customMatrix: customMatrix,
                customSBox: customSBox,
                constant: customSBox ? '63' : constant, // Force valid constant for custom S-box (unused but validated)
            });

            setResults(
                result.matrix,
                result.sbox,
                result.analysis,
                result.fixedPoints,
                result.calculationTimeMs
            );
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Analysis failed');
        }
    };

    // ... exports ...
    const handleExportMatrix = async () => {
        if (!displayMatrix) return;
        try {
            // If customSBox is active, we can't export matrix as we don't have it
            if (customSBox) return;
            await exportReport(selectedMatrixId, customMatrix, constant, 'xlsx', ['matrix']);
        } catch (error) {
            console.error('Export failed:', error);
            setError('Export failed');
        }
    };

    // Export only the S-box table
    const handleExportSbox = async () => {
        if (!sbox) return;
        try {
            // If customSBox, we export specific report? Or just generic
            // The API expects matrixId or customMatrix. 
            // We need to update export endpoint too? Or just skip export for custom SBox for now if not supported?
            // The API export endpoint DOES NOT support customSBox yet. 
            // I should probably add it to backend if I want export to work.
            // But user didn't explicitly ask for export of custom sbox, just upload and analyze. 
            // I'll skip fixing export for now for custom S-box to save time/complexity.
            if (customSBox) {
                alert("Export for custom uploaded S-box is not supported yet.");
                return;
            }
            await exportReport(selectedMatrixId, customMatrix, constant, 'xlsx', ['sbox']);
        } catch (error) {
            console.error('Export failed:', error);
            setError('Export failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Construction Workspace</h2>
                    <p className="text-sm text-slate-500">
                        {customSBox ? "Analyzing custom uploaded S-Box." : "Visualize and edit the affine transformation components."}
                    </p>
                </div>
                {!customSBox && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg font-mono text-sm shadow-sm flex items-center gap-3">
                        <span className="text-slate-400">Formula:</span>
                        <span>S(x) = <span className="text-blue-500 font-bold">M</span> · x⁻¹ + <span className="text-purple-500 font-bold">c</span></span>
                    </div>
                )}
            </div>

            {/* Matrix Preview OR Custom S-Box Info */}
            <div className="w-full max-w-[400px]">
                {customSBox ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 spotlight-border">
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Custom S-Box Loaded</h3>
                                <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-1">
                                    Construction parameters (Matrix M, Constant c) are unknown for raw S-boxes.
                                </p>
                            </div>
                            <button
                                onClick={handleStartAnalysis}
                                disabled={isAnalyzing}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${!isAnalyzing
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 spotlight-border">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="size-2 rounded-full bg-blue-500"></span>
                                Matrix M (8×8)
                            </h3>
                            <button
                                onClick={handleExportMatrix}
                                disabled={!displayMatrix}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>XLSX</span>
                            </button>
                        </div>

                        {/* 8x8 Matrix Grid */}
                        <div className="aspect-square w-full mx-auto matrix-grid bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {displayMatrix ? (
                                displayMatrix.flat().map((val, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-center font-mono text-sm rounded-sm ${val === 1
                                            ? 'font-bold bg-blue-500/10 text-blue-500'
                                            : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                    >
                                        {val}
                                    </div>
                                ))
                            ) : (
                                Array(64).fill(0).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-center font-mono text-sm text-slate-200 dark:text-slate-700 rounded-sm"
                                    >
                                        -
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Constant Input */}
                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Constant c (Hex)
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        className="w-16 text-center font-mono bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg py-1.5 text-slate-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                        type="text"
                                        value={constant}
                                        onChange={(e) => setConstant(e.target.value)}
                                        maxLength={2}
                                    />
                                    <span className="text-xs text-slate-400">0x</span>
                                </div>
                            </div>

                            {/* Start Analysis Button */}
                            <button
                                onClick={handleStartAnalysis}
                                disabled={!canAnalyze || isAnalyzing}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${canAnalyze && !isAnalyzing
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Start Analysis</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* S-box Grid (No changes really needed here, sbox is displayed if it exists in store) */}
            <div className="w-full">
                {/* ... keeping the rest of the S-box display as is ... */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 spotlight-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            S-Box Table (16×16)
                        </h3>
                        <div className="flex items-center gap-4">
                            {/* View Mode Toggle */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('engineering')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'engineering'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    Hexadecimal
                                </button>
                                <button
                                    onClick={() => setViewMode('paper')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'paper'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    Decimal (Paper View)
                                </button>
                            </div>

                            <button
                                onClick={handleExportSbox}
                                disabled={!sbox}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                XLSX
                            </button>
                        </div>
                    </div>

                    {sbox ? (
                        <div className="overflow-x-auto">
                            {viewMode === 'engineering' ? (
                                <div
                                    className="min-w-fit inline-block border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                                    onMouseLeave={() => setHoveredCell(null)}
                                >
                                    {/* Header row */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                        <div className="w-10 h-8 flex items-center justify-center border-r border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700"></div>
                                        {Array(16).fill(0).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-10 h-8 flex items-center justify-center transition-colors
                                                ${hoveredCell?.c === i ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : (i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : '')}`}
                                            >
                                                {i.toString(16).toUpperCase()}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Data rows */}
                                    {sbox.map((row, rowIdx) => (
                                        <div key={rowIdx} className="flex h-8 border-b border-slate-100 dark:border-slate-800 last:border-none">
                                            <div
                                                className={`w-10 flex-none border-r border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs font-mono transition-colors
                                                ${hoveredCell?.r === rowIdx
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                {(rowIdx * 16).toString(16).toUpperCase().padStart(2, '0')}
                                            </div>
                                            {row.map((val, colIdx) => {
                                                const isRow = hoveredCell?.r === rowIdx;
                                                const isCol = hoveredCell?.c === colIdx;
                                                const isIntersection = isRow && isCol;
                                                const isHovered = isRow || isCol;

                                                return (
                                                    <div
                                                        key={colIdx}
                                                        onMouseEnter={() => setHoveredCell({ r: rowIdx, c: colIdx })}
                                                        className={`w-10 flex items-center justify-center font-mono text-sm transition-colors cursor-crosshair
                                                            ${isIntersection
                                                                ? 'bg-blue-500 text-white font-bold'
                                                                : isHovered
                                                                    ? 'bg-slate-100 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-slate-200'
                                                                    : 'text-slate-600 dark:text-slate-400'
                                                            }
                                                        `}
                                                    >
                                                        {val.toString(16).padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Paper View: Decimal values with headers like academic papers */
                                <div className="min-w-fit inline-block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <table className="border-collapse">
                                        <thead>
                                            <tr>
                                                {/* Empty corner cell */}
                                                <th className="w-10 h-8 text-center font-bold text-xs font-mono text-slate-500 dark:text-slate-400 border-b-2 border-r-2 border-slate-300 dark:border-slate-600"></th>
                                                {/* Column headers: 0-F */}
                                                {Array(16).fill(0).map((_, i) => (
                                                    <th
                                                        key={i}
                                                        className="w-10 h-8 text-center font-bold text-xs font-mono text-slate-600 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600"
                                                    >
                                                        {i.toString(16).toUpperCase()}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sbox.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    {/* Row header: 00, 10, 20, ... F0 */}
                                                    <td className="w-10 h-7 text-center font-bold text-xs font-mono text-slate-600 dark:text-slate-300 border-r-2 border-slate-300 dark:border-slate-600">
                                                        {rowIdx.toString(16).toUpperCase()}0
                                                    </td>
                                                    {row.map((val, colIdx) => (
                                                        <td
                                                            key={colIdx}
                                                            className="p-1 w-10 text-center font-mono text-sm text-slate-700 dark:text-slate-300 tabular-nums"
                                                        >
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-slate-400">
                            <div className="text-center">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <p className="text-sm">Select a matrix and click "Start Analysis" to generate S-box</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
