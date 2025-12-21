import { useAppStore } from '../../store/useAppStore';
import { useEffect, useState } from 'react';

export function Footer() {
    const { status, calculationTimeMs, currentPage } = useAppStore();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const main = document.querySelector('main');
        if (!main) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = main;
            if (scrollHeight <= clientHeight) {
                setProgress(100);
            } else {
                const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
                setProgress(Math.min(100, Math.max(0, scrolled)));
            }
        };

        main.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        // Also check on resize
        window.addEventListener('resize', handleScroll);

        return () => {
            main.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [currentPage]); // Re-bind when page changes

    const getStatusColor = () => {
        switch (status) {
            case 'ready': return 'bg-green-500';
            case 'analyzing': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'ready': return 'Ready';
            case 'analyzing': return 'Analyzing...';
            case 'error': return 'Error';
            case 'loading': return 'Loading...';
            default: return 'Idle';
        }
    };

    return (
        <footer className="flex-none glass-effect backdrop-blur-md border-t relative">
            {/* Progress Bar */}
            <div
                className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-150 ease-out z-20"
                style={{ width: `${progress}%` }}
            />

            <div className="px-4 py-1.5 flex justify-between items-center text-[11px] text-slate-500 relative z-10">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${getStatusColor()}`}></span>
                        {getStatusText()}
                    </span>
                    <span className="border-l border-slate-200 dark:border-slate-700 pl-4">
                        © {new Date().getFullYear()} UNNES Cryptography Research Group
                    </span>
                    <span className="border-l border-slate-200 dark:border-slate-700 pl-4">
                        Polynomial: x⁸ + x⁴ + x³ + x + 1
                    </span>
                    <span className="border-l border-slate-200 dark:border-slate-700 pl-4">
                        Engine: GF(2⁸) Fast Math
                    </span>
                </div>
                <div>
                    {calculationTimeMs !== null ? (
                        <span>Calculation time: {calculationTimeMs}ms</span>
                    ) : (
                        <span>No calculation yet</span>
                    )}
                </div>
            </div>
        </footer>
    );
}
