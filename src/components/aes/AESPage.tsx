import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { fetchMatrices } from '../../api/sboxApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function AESPage() {
    // Dynamic matrix list from API
    const [sboxOptions, setSboxOptions] = useState<{ value: string; label: string }[]>([
        { value: 'KAES', label: 'AES Standard (KAES)' },
    ]);

    // Use global store for persistence
    const {
        aes, setAESState,
        customSBox, customSBoxFileName,
        customMatrix, customFileName,
        constant
    } = useAppStore();
    const { inputData, key, sbox, output, status, errorMsg } = aes;

    // Helper setters
    const setInputData = (val: string) => setAESState({ inputData: val });
    const setKey = (val: string) => setAESState({ key: val });
    const setSbox = (val: string) => setAESState({ sbox: val });
    const setOutput = (val: string) => setAESState({ output: val });
    const setStatus = (val: 'ready' | 'processing' | 'done' | 'error') => setAESState({ status: val });
    const setErrorMsg = (val: string) => setAESState({ errorMsg: val });

    // Dynamic matrix list from API + Custom
    // Update options when matrices fetch or custom data changes
    useEffect(() => {
        fetchMatrices().then(matrices => {
            const options = matrices.map(m => ({
                value: m.id,
                label: m.name,
            }));

            // Add Custom option if available
            if (customSBox || customMatrix) {
                const label = customSBox
                    ? `Pixel S-Box (${customSBoxFileName || 'Uploaded'})`
                    : `Custom Matrix (${customFileName || 'Uploaded'})`;
                options.unshift({ value: 'custom', label: `⭐ ${label}` });

                // Auto-select custom if not already selected
                if (sbox !== 'custom') {
                    setAESState({ sbox: 'custom' });
                }
            } else {
                // If custom was selected but now removed, reset to KAES
                if (sbox === 'custom') {
                    setAESState({ sbox: 'KAES' });
                }
            }

            if (options.length > 0) {
                setSboxOptions(_prev => {
                    const basics = [{ value: 'KAES', label: 'AES Standard (KAES)' }];
                    const uniqueOptions = [...basics, ...options].reduce((acc, current) => {
                        const x = acc.find(item => item.value === current.value);
                        return !x ? acc.concat([current]) : acc;
                    }, [] as { value: string; label: string }[]);

                    const customOpt = uniqueOptions.find(o => o.value === 'custom');
                    const others = uniqueOptions.filter(o => o.value !== 'custom');
                    return customOpt ? [customOpt, ...others] : others;
                });
            }
        }).catch(console.error);
    }, [customSBox, customMatrix, customSBoxFileName, customFileName, sbox, setAESState]);

    const handleEncrypt = async () => {
        if (!inputData.trim()) {
            setErrorMsg('Please enter input data');
            setStatus('error');
            return;
        }
        if (key.length !== 16) {
            setErrorMsg('AES key must be exactly 16 characters (128-bit)');
            setStatus('error');
            return;
        }

        setStatus('processing');
        setErrorMsg('');

        try {
            const payload: any = {
                plaintext: inputData,
                key: key,
                sboxId: sbox === 'custom' ? null : sbox,
            };

            if (sbox === 'custom') {
                if (customSBox) {
                    payload.customSBox = customSBox;
                } else if (customMatrix) {
                    payload.customMatrix = customMatrix;
                    payload.constant = constant;
                } else {
                    throw new Error("Custom S-box selected but no data found.");
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/aes/encrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Encryption failed');
            }

            const data = await response.json();
            setOutput(data.ciphertext);
            setStatus('done');
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : 'Encryption failed');
            setStatus('error');
        }
    };

    const handleDecrypt = async () => {
        if (!inputData.trim()) {
            setErrorMsg('Please enter ciphertext (hex format)');
            setStatus('error');
            return;
        }
        if (key.length !== 16) {
            setErrorMsg('AES key must be exactly 16 characters (128-bit)');
            setStatus('error');
            return;
        }

        setStatus('processing');
        setErrorMsg('');

        try {
            const payload: any = {
                ciphertext: inputData,
                key: key,
                sboxId: sbox === 'custom' ? null : sbox,
            };

            if (sbox === 'custom') {
                if (customSBox) {
                    payload.customSBox = customSBox;
                } else if (customMatrix) {
                    payload.customMatrix = customMatrix;
                    payload.constant = constant;
                } else {
                    throw new Error("Custom S-box selected but no data found.");
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/aes/decrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Decryption failed');
            }

            const data = await response.json();
            setOutput(data.plaintext);
            setStatus('done');
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : 'Decryption failed');
            setStatus('error');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <main className="h-full flex justify-center py-8 pt-28 pb-32 px-4 md:px-8 overflow-y-auto">
            <div className="w-full max-w-[960px] flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight animate-breathing-glow">
                        AES Single-Block Encryption
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal max-w-2xl">
                        Research-grade AES encryption using custom S-boxes. This tool processes a single 128-bit block
                        without mode of operation, consistent with S-box analysis methodology.
                    </p>
                </div>

                {/* Input Section */}
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl border p-6 flex flex-col gap-4 spotlight-border">
                    <div className="flex items-center justify-between">
                        <label className="text-slate-900 dark:text-white text-base font-semibold">Input Data</label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Max 16 characters (128-bit block)</span>
                    </div>
                    <textarea
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        className="w-full min-h-[120px] p-4 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-y"
                        placeholder="Enter plaintext to encrypt or ciphertext (hex) to decrypt..."
                    />
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AES Key */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <label className="text-slate-900 dark:text-white text-sm font-medium">AES Key (128-bit)</label>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{key.length}/16 characters</span>
                        </div>
                        <div className="relative flex items-center">
                            <svg className="absolute left-4 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value.slice(0, 16))}
                                className="w-full h-12 pl-11 pr-4 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                placeholder="e.g. MySecretKey12345"
                                maxLength={16}
                            />
                        </div>
                    </div>

                    {/* S-box Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium">S-box Selection</label>
                        <div className="relative">
                            <select
                                value={sbox}
                                onChange={(e) => setSbox(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            >
                                {sboxOptions.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            The selected S-box is used in SubBytes and InvSubBytes transformations.
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {status === 'error' && errorMsg && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errorMsg}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleEncrypt}
                        disabled={status === 'processing'}
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {status === 'processing' ? 'Processing...' : 'Encrypt'}
                    </button>
                    <button
                        onClick={handleDecrypt}
                        disabled={status === 'processing'}
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-transparent border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-900 dark:text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        {status === 'processing' ? 'Processing...' : 'Decrypt'}
                    </button>
                </div>

                {/* AES Processing Steps */}
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl border p-6 flex flex-col gap-3 spotlight-border">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold">AES-128 Processing Steps (10 Rounds)</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-xs font-mono text-slate-500 dark:text-slate-400 space-y-2">
                        <div className="flex gap-3">
                            <span className="text-slate-400 dark:text-slate-600 select-none w-4">01</span>
                            <span>KeyExpansion <span className="text-slate-400 dark:text-slate-600">// Derives 11 round keys from cipher key</span></span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-slate-400 dark:text-slate-600 select-none w-4">02</span>
                            <span>Initial Round <span className="text-slate-400 dark:text-slate-600">// AddRoundKey only</span></span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-slate-400 dark:text-slate-600 select-none w-4">03</span>
                            <div className="flex flex-col gap-1">
                                <span>Main Rounds <span className="text-slate-400 dark:text-slate-600">// Repeated 9 times</span></span>
                                <ul className="pl-4 border-l border-slate-300 dark:border-slate-700 space-y-1 text-slate-700 dark:text-slate-300">
                                    <li className="flex items-center gap-2">
                                        SubBytes
                                        <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded tracking-wide font-bold">
                                            USING {sbox} S-BOX
                                        </span>
                                    </li>
                                    <li>ShiftRows</li>
                                    <li>MixColumns</li>
                                    <li>AddRoundKey</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-slate-400 dark:text-slate-600 select-none w-4">04</span>
                            <span>Final Round <span className="text-slate-400 dark:text-slate-600">// SubBytes, ShiftRows, AddRoundKey (no MixColumns)</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Single-block processing without mode of operation (research mode).
                        </span>
                    </div>
                </div>

                {/* Output Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-end justify-between px-1">
                        <label className="text-slate-900 dark:text-white text-base font-semibold">Processed Result</label>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-500 disabled:opacity-50 text-xs font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy to Clipboard
                        </button>
                    </div>
                    <div className="relative group">
                        <textarea
                            value={output}
                            readOnly
                            className="w-full min-h-[120px] p-4 rounded-lg text-sm font-mono bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-emerald-400 placeholder:text-slate-500 resize-none"
                            placeholder="Output will appear here..."
                        />
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full transition-colors ${status === 'ready' ? 'bg-slate-500' :
                                status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                    status === 'error' ? 'bg-red-500' :
                                        'bg-emerald-500'
                                }`} />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                {status === 'ready' ? 'Ready' :
                                    status === 'processing' ? 'Processing' :
                                        status === 'error' ? 'Error' : 'Done'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
