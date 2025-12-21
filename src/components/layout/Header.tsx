import { useAppStore } from '../../store/useAppStore';
import { exportReport } from '../../api/sboxApi';
import { useEffect, useState, useRef } from 'react';

export function Header() {
    const {
        status,
        darkMode,
        toggleDarkMode,
        setShowHelp,
        selectedMatrixId,
        customMatrix,
        constant,
        currentPage,
        setCurrentPage
    } = useAppStore();

    const [isTopBarVisible, setIsTopBarVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            // Only care about vertical scrolling of main content areas
            if (!target || (target.tagName !== 'MAIN' && !target.classList?.contains('overflow-y-auto'))) return;

            const currentScrollY = target.scrollTop;
            const threshold = 50; // Min scroll before hiding

            if (currentScrollY < threshold) {
                // At top, always show
                setIsTopBarVisible(true);
            } else if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
                // Determine direction
                // If current > last -> Scrolling Down -> Hide
                // If current < last -> Scrolling Up -> Show
                setIsTopBarVisible(currentScrollY < lastScrollY.current);
            }

            lastScrollY.current = currentScrollY;
        };

        // Use capture phase to catch scroll events from children (pages)
        document.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const handleExportReport = async () => {
        try {
            await exportReport(selectedMatrixId, customMatrix, constant, 'xlsx');
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <header className="flex-none flex flex-col border-b glass-effect backdrop-blur-md bg-white/70 dark:bg-slate-900/70 px-6 pt-2 z-30 transition-all duration-300">
            {/* Top bar - Collapsible */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isTopBarVisible ? 'max-h-16 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-9 flex items-center justify-center">
                            <img
                                src="/unnes-logo-new.png"
                                alt="UNNES Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">AES S-box Analyzer</h1>
                        </div>
                    </div>

                    {/* Buttons removed from here and moved to bottom bar */}
                </div>
            </div>

            {/* Navigation Tabs (Always Visible) */}
            <div className="flex items-center justify-between pt-0 pb-1">
                <div className="flex items-center gap-8 text-sm font-semibold">
                    <button
                        onClick={() => setCurrentPage('sbox-research')}
                        className={`pb-3 border-b-2 transition-all duration-300 ${currentPage === 'sbox-research'
                            ? 'text-blue-500 border-blue-500 animate-tab-glow'
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        S-box Research
                    </button>
                    <button
                        onClick={() => setCurrentPage('aes-encrypt')}
                        className={`pb-3 border-b-2 transition-all duration-300 ${currentPage === 'aes-encrypt'
                            ? 'text-blue-500 border-blue-500 animate-tab-glow'
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        AES Encrypt
                    </button>
                    <button
                        onClick={() => setCurrentPage('steganography')}
                        className={`pb-3 border-b-2 transition-all duration-300 ${currentPage === 'steganography'
                            ? 'text-blue-500 border-blue-500 animate-tab-glow'
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        Image Encryption
                    </button>
                    <button
                        onClick={() => setCurrentPage('about')}
                        className={`pb-3 border-b-2 transition-all duration-300 ${currentPage === 'about'
                            ? 'text-blue-500 border-blue-500 animate-tab-glow'
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        About
                    </button>
                </div>

                {/* Persistent Action Buttons */}
                <div className="flex items-center gap-2 mb-2">
                    {currentPage === 'sbox-research' && (
                        <button
                            onClick={handleExportReport}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed glow-effect glow-effect-blue"
                            disabled={status !== 'ready'}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export Report</span>
                        </button>
                    )}

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center justify-center size-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors glow-effect glow-effect-slate"
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* Help Button */}
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center justify-center size-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors glow-effect glow-effect-slate"
                        title="Help - Cryptographic Metrics Guide"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
