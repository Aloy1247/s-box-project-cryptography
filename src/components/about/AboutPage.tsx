export function AboutPage() {
    return (
        <main className="h-full flex justify-center py-8 pt-28 pb-32 px-4 md:px-8 overflow-y-auto">
            <div className="w-full max-w-[960px] flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2 text-center items-center">
                    <div className="size-16 flex items-center justify-center mb-2 animate-bounce">
                        <img
                            src="/unnes-logo-new.png"
                            alt="UNNES Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight animate-breathing-glow">
                        About AES S-box Analyzer
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal max-w-2xl">
                        A research-grade environment for constructing, analyzing, and testing cryptographically strong S-boxes for the Advanced Encryption Standard (AES).
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-4">
                        Based on the research: <a href="https://link.springer.com/article/10.1007/s11071-024-10414-3" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">Chaos-based S-box design (Springer)</a>
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-transparent p-6 flex flex-col gap-4 spotlight-border">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold mb-2">Cryptographic Construction</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Construct strong 8-bit S-boxes using affine transformations over GF(2⁸).
                                Test different affine matrices and constants to optimize cryptographic properties.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-transparent p-6 flex flex-col gap-4 spotlight-border">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold mb-2">Advanced Analysis</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Evaluate S-boxes against 10 critical metrics including Non-Linearity, SAC, Differential Uniformity, and Linear Approximation Probability.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-transparent p-6 flex flex-col gap-4 spotlight-border">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold mb-2">Image Encryption</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Visualize the effectiveness of your S-boxes by encrypting images.
                                Analyze the cipher image entropy and correlation to verify security.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Meet the Team */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Meet the Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Aloysius Oktavian', role: '2304130137', color: 'bg-blue-500' },
                            { name: 'Tyto Rinandi', role: '2304130142', color: 'bg-purple-500' },
                            { name: 'Muhammad Azzam Fadhlullah', role: '2304130150', color: 'bg-emerald-500' },
                            { name: 'I Gede Ardhy Niratha', role: '2304130168', color: 'bg-rose-500' }
                        ].map((member, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-xl border border-transparent p-6 flex flex-col items-center text-center gap-3 spotlight-border hover:border-blue-500/50 transition-colors group">
                                <div className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                                    {member.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-bold">{member.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Project Info Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-transparent spotlight-border text-center mt-4">
                    <div className="flex justify-center gap-4 text-xs font-mono text-slate-400">
                        <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">React + Vite</span>
                        <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">Python FastAPI</span>
                        <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">NumPy Accelerated</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
