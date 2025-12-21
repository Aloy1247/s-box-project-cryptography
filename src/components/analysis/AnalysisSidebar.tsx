import { useAppStore } from '../../store/useAppStore';

interface MetricCardProps {
    label: string;
    abbr: string;
    value: number | string | null;
    description: string;
}

function MetricCard({ abbr, value, description }: MetricCardProps) {
    const displayValue = value !== null
        ? (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(4)) : value)
        : '-';

    return (
        <div className="group p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border spotlight-border flex flex-col justify-between h-full min-h-[60px] cursor-default">
            <div className="flex justify-between items-start">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover-text-glow text-glow-transition">{abbr}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white leading-none group-hover-text-glow text-glow-transition">{displayValue}</div>
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-1" title={description}>{description}</div>
        </div>
    );
}

export function AnalysisSidebar() {
    const { analysis, fixedPoints, status } = useAppStore();

    const getStatusBadge = () => {
        if (status === 'analyzing') {
            return <span className="inline-flex items-center rounded-full bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">Analyzing</span>;
        }
        if (analysis) {
            const isSecure = analysis.nl >= 100;
            return isSecure
                ? <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Secure</span>
                : <span className="inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">Review</span>;
        }
        return <span className="inline-flex items-center rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10">Pending</span>;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Analysis Report</h3>
                <div className="flex items-center gap-2">
                    {getStatusBadge()}
                    {analysis && <span className="text-[10px] text-slate-500">Updated just now</span>}
                </div>
            </div>

            {/* Metrics */}
            <div className="p-3 space-y-3 flex-1 overflow-visible">
                <div>
                    <h4 className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider mb-2">Cryptographic Properties</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <MetricCard abbr="NL" label="Non-Linearity" value={analysis?.nl ?? null} description="Non-Linearity" />
                        <MetricCard abbr="SAC" label="Strict Avalanche Criterion" value={analysis?.sac ?? null} description="Strict Avalanche" />
                        <MetricCard abbr="BIC-NL" label="BIC Non-Linearity" value={analysis?.bicNl ?? null} description="Bit Indep. NL" />
                        <MetricCard abbr="BIC-SAC" label="BIC SAC" value={analysis?.bicSac ?? null} description="Bit Indep. SAC" />
                        <MetricCard abbr="LAP" label="Linear Approx. Prob." value={analysis?.lap ?? null} description="Linear Approx." />
                        <MetricCard abbr="DAP" label="Diff. Approx. Prob." value={analysis?.dap ?? null} description="Diff. Approx." />
                        <MetricCard abbr="DU" label="Differential Uniformity" value={analysis?.du ?? null} description="Diff. Uniformity" />
                        <MetricCard abbr="AD" label="Algebraic Degree" value={analysis?.ad ?? null} description="Algebraic Deg." />
                        <MetricCard abbr="TO" label="Transparency Order" value={analysis?.to ?? null} description="Transparency" />
                        <MetricCard abbr="CI" label="Correlation Immunity" value={analysis?.ci ?? null} description="Correlation Imm." />
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Fixed Points */}
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border spotlight-border">
                    <h4 className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Fixed Points</h4>
                    <div className="flex gap-1 flex-wrap">
                        {analysis ? (
                            fixedPoints.length > 0 ? (
                                fixedPoints.map((fp) => (
                                    <span key={fp} className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-mono text-slate-600 dark:text-slate-200 hover-text-glow text-glow-transition cursor-default">
                                        0x{fp.toString(16).toUpperCase().padStart(2, '0')}
                                    </span>
                                ))
                            ) : (
                                <>
                                    <span className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-mono text-slate-600 dark:text-slate-200">None</span>
                                    <span className="text-[10px] text-slate-400 self-center">(S(x) = x)</span>
                                </>
                            )
                        ) : (
                            <span className="text-[10px] text-slate-400">No analysis yet</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
