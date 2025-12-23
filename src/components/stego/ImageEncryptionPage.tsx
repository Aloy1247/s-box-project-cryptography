import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { fetchMatrices } from '../../api/sboxApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const initialMetrics = {
    entropy: null, npcr: null, uaci: null,
    correlationH: null, correlationV: null, correlationD: null,
    histogramOriginal: undefined, histogramEncrypted: undefined
};

const HistogramChart = ({ title, data }: { title: string, data: { r: number[], g: number[], b: number[] } }) => {
    const chartData = data.r.map((_, i) => ({
        bin: i,
        r: data.r[i],
        g: data.g[i],
        b: data.b[i]
    }));

    return (
        <div className="flex flex-col h-[250px] bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 text-center uppercase tracking-wider">{title}</h4>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="bin" hide />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }}
                            itemStyle={{ padding: 0 }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: number | undefined) => [value, 'Count']}
                        />
                        <Line type="monotone" dataKey="r" stroke="#ef4444" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="g" stroke="#22c55e" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        <Line type="monotone" dataKey="b" stroke="#3b82f6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export function ImageEncryptionPage() {
    const encryptRef = useRef<HTMLInputElement>(null);
    const decryptRef = useRef<HTMLInputElement>(null);

    // Global Store
    const {
        imageEncryption, setImageEncryptionState,
        customSBox, customSBoxFileName,
        customMatrix, customFileName,
        constant
    } = useAppStore();

    const {
        sbox, key,
        encryptInput, encryptPreview, encryptResult, encryptStatus, encryptError,
        decryptInput, decryptPreview, decryptResult, decryptStatus, decryptError,
        metrics
    } = imageEncryption;

    // Dynamic matrix list from API + Custom
    const [sboxOptions, setSboxOptions] = useState<{ value: string; label: string }[]>([
        { value: 'KAES', label: 'AES Standard' },
        { value: 'K44', label: 'K44 (Best)' },
    ]);

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
                // (Optional: this might be annoying if user switches back and forth, 
                // but usually after upload they want to use it)
                if (sbox !== 'custom') {
                    setImageEncryptionState({ sbox: 'custom' });
                }
            } else {
                // If custom was selected but now removed, reset to KAES
                if (sbox === 'custom') {
                    setImageEncryptionState({ sbox: 'KAES' });
                }
            }

            if (options.length > 0) {
                setSboxOptions(_prev => {
                    // Merge basic options (KAES, K44) with API options
                    // Ensure KAES and K44 are always there
                    const basics = [{ value: 'KAES', label: 'AES Standard' }, { value: 'K44', label: 'K44 (Best)' }];

                    // Filter out duplicates
                    const uniqueOptions = [...basics, ...options].reduce((acc, current) => {
                        const x = acc.find(item => item.value === current.value);
                        if (!x) {
                            return acc.concat([current]);
                        } else {
                            return acc;
                        }
                    }, [] as { value: string; label: string }[]);

                    // Put 'custom' at the top if exists
                    const customOpt = uniqueOptions.find(o => o.value === 'custom');
                    const others = uniqueOptions.filter(o => o.value !== 'custom');

                    return customOpt ? [customOpt, ...others] : others;
                });
            }
        }).catch(console.error);
    }, [customSBox, customMatrix, customSBoxFileName, customFileName, sbox, setImageEncryptionState]);


    // Helper Setters (optional, can call setImageEncryptionState directly)
    const setSbox = (val: string) => setImageEncryptionState({ sbox: val });
    const setKey = (val: string) => setImageEncryptionState({ key: val });

    // Encrypt State helpers
    const setEncryptStatus = (val: 'ready' | 'processing' | 'done' | 'error') => setImageEncryptionState({ encryptStatus: val });
    const setEncryptError = (val: string) => setImageEncryptionState({ encryptError: val });

    // Decrypt State helpers
    const setDecryptStatus = (val: 'ready' | 'processing' | 'done' | 'error') => setImageEncryptionState({ decryptStatus: val });
    const setDecryptError = (val: string) => setImageEncryptionState({ decryptError: val });

    const handleEncrypt = async () => {
        if (!encryptInput || !key.trim()) { setEncryptError('Please select image and enter key'); setEncryptStatus('error'); return; }
        setEncryptStatus('processing'); setEncryptError('');

        try {
            const formData = new FormData();
            formData.append('image', encryptInput);
            formData.append('key', key);

            if (sbox === 'custom') {
                if (customSBox) {
                    formData.append('customSBox', JSON.stringify(customSBox));
                } else if (customMatrix) {
                    formData.append('customMatrix', JSON.stringify(customMatrix));
                    formData.append('constant', constant);
                } else {
                    throw new Error("Custom S-box selected but no data found.");
                }
            } else {
                formData.append('sboxId', sbox);
            }

            const res = await fetch(`${API_BASE_URL}/api/image/encrypt`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');

            const blob = await res.blob();
            const resultUrl = URL.createObjectURL(blob);

            // Auto-link to decrypt input
            const encryptedFile = new File([blob], 'encrypted.png', { type: 'image/png' });

            setImageEncryptionState({
                encryptResult: resultUrl,
                encryptStatus: 'done',
                decryptInput: encryptedFile,
                decryptPreview: resultUrl,
                decryptResult: null
            });

            // Analysis
            const af = new FormData();
            af.append('originalImage', encryptInput);
            af.append('encryptedImage', blob);
            const ar = await fetch(`${API_BASE_URL}/api/image/analyze`, { method: 'POST', body: af });
            if (ar.ok) {
                const newMetrics = await ar.json();
                setImageEncryptionState({ metrics: newMetrics });
            }
        } catch (e) {
            setEncryptError(e instanceof Error ? e.message : 'Failed');
            setEncryptStatus('error');
        }
    };

    const handleDecrypt = async () => {
        if (!decryptInput || !key.trim()) { setDecryptError('Please select image and enter key'); setDecryptStatus('error'); return; }
        setDecryptStatus('processing'); setDecryptError('');

        try {
            const formData = new FormData();
            formData.append('image', decryptInput);
            formData.append('key', key);

            if (sbox === 'custom') {
                if (customSBox) {
                    formData.append('customSBox', JSON.stringify(customSBox));
                } else if (customMatrix) {
                    formData.append('customMatrix', JSON.stringify(customMatrix));
                    formData.append('constant', constant);
                } else {
                    throw new Error("Custom S-box selected but no data found.");
                }
            } else {
                formData.append('sboxId', sbox);
            }

            const res = await fetch(`${API_BASE_URL}/api/image/decrypt`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');

            const blob = await res.blob();
            const resultUrl = URL.createObjectURL(blob);

            setImageEncryptionState({
                decryptResult: resultUrl,
                decryptStatus: 'done'
            });

            // Run Analysis (Decrypted = Original, Input = Encrypted)
            const af = new FormData();
            af.append('originalImage', blob, 'decrypted.png');
            af.append('encryptedImage', decryptInput);

            const ar = await fetch(`${API_BASE_URL}/api/image/analyze`, { method: 'POST', body: af });
            if (ar.ok) {
                const newMetrics = await ar.json();
                setImageEncryptionState({ metrics: newMetrics });
            }

        } catch (e) {
            setDecryptError(e instanceof Error ? e.message : 'Failed');
            setDecryptStatus('error');
        }
    };

    return (
        <main className="h-full overflow-y-auto py-8 pt-28 pb-32 px-4 md:px-8">
            <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col gap-1 items-center justify-center text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white animate-breathing-glow">
                        Image Encryption Analysis
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Encrypt images into cipher noise using AES-128 with custom S-boxes.
                        Analyze encryption quality with security metrics.
                    </p>
                </div>

                {/* ===== SHARED CONTROLS ===== */}
                <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 dark:from-blue-500/5 dark:to-emerald-500/5 rounded-2xl border p-6 spotlight-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* S-box Selection */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">S-box Selection</label>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setSbox('KAES')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${sbox === 'KAES'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                        }`}
                                >
                                    AES Standard
                                </button>
                                <button
                                    onClick={() => setSbox('K44')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${sbox === 'K44'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                        }`}
                                >
                                    K44 (Best)
                                </button>
                                <select
                                    value={sbox}
                                    onChange={(e) => setSbox(e.target.value)}
                                    className="px-3 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    {sboxOptions.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Encryption Key - More Prominent */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                                Encryption Key
                                <span className="text-red-500">*</span>
                                <span className="text-[10px] font-normal normal-case text-slate-400">(required)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className={`w-full h-11 px-4 pr-24 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border-2 text-slate-900 dark:text-white transition-colors ${key.length > 0
                                        ? 'border-emerald-400 dark:border-emerald-500'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}
                                    placeholder="Enter encryption key..."
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                                    {key.length > 0 ? `${key.length} chars` : 'padded to 16'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== ENCRYPT SECTION ===== */}
                <section className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 ml-2">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg">🔒</div>
                            <div>
                                <h2 className="text-slate-900 dark:text-white text-lg font-bold">Encrypt Image</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Transform image into encrypted cipher</p>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                            {/* Input */}
                            <div className="flex-1 flex flex-col">
                                <input ref={encryptRef} type="file" accept="image/*" onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        const r = new FileReader();
                                        r.onload = (x) => setImageEncryptionState({
                                            encryptInput: f,
                                            encryptPreview: x.target?.result as string,
                                            encryptResult: null,
                                            metrics: initialMetrics
                                        });
                                        r.readAsDataURL(f);
                                    }
                                }} className="hidden" />
                                <div
                                    onClick={() => encryptRef.current?.click()}
                                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center min-h-[160px] bg-slate-50 dark:bg-slate-900/50"
                                >
                                    {encryptPreview ? (
                                        <img src={encryptPreview} alt="Input" className="max-h-32 rounded-lg shadow-sm" />
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Select original image</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={handleEncrypt}
                                    disabled={encryptStatus === 'processing'}
                                    className="w-14 h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    {encryptStatus === 'processing' ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    )}
                                </button>
                            </div>

                            {/* Output */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-900 dark:bg-black/30">
                                    {encryptResult ? (
                                        <>
                                            <img src={encryptResult} alt="Encrypted" className="max-h-24 rounded-lg mb-3" />
                                            <a
                                                href={encryptResult}
                                                download="encrypted.png"
                                                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download Cipher
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-slate-500 text-sm">Cipher image output</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {encryptStatus === 'error' && <p className="text-red-500 text-xs mt-3">{encryptError}</p>}
                    </div>
                </section>

                {/* ===== DECRYPT SECTION ===== */}
                <section className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 ml-2">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-lg">🔓</div>
                            <div>
                                <h2 className="text-slate-900 dark:text-white text-lg font-bold">Decrypt Image</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Restore original from cipher image</p>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                            {/* Input */}
                            <div className="flex-1 flex flex-col">
                                <input ref={decryptRef} type="file" accept="image/*" onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        const r = new FileReader();
                                        r.onload = (x) => setImageEncryptionState({
                                            decryptInput: f,
                                            decryptPreview: x.target?.result as string,
                                            decryptResult: null
                                        });
                                        r.readAsDataURL(f);
                                    }
                                }} className="hidden" />
                                <div
                                    onClick={() => decryptRef.current?.click()}
                                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors flex flex-col items-center justify-center min-h-[160px] bg-slate-900 dark:bg-black/30"
                                >
                                    {decryptPreview ? (
                                        <img src={decryptPreview} alt="Cipher" className="max-h-32 rounded-lg" />
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                                <span className="text-2xl">🔐</span>
                                            </div>
                                            <p className="text-slate-500 text-sm">Select cipher image</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={handleDecrypt}
                                    disabled={decryptStatus === 'processing'}
                                    className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    {decryptStatus === 'processing' ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    )}
                                </button>
                            </div>

                            {/* Output */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 dark:bg-slate-900/50">
                                    {decryptResult ? (
                                        <>
                                            <img src={decryptResult} alt="Decrypted" className="max-h-24 rounded-lg shadow-sm mb-3" />
                                            <a
                                                href={decryptResult}
                                                download="decrypted.png"
                                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download Original
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-slate-500 text-sm">Restored image output</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {decryptStatus === 'error' && <p className="text-red-500 text-xs mt-3">{decryptError}</p>}
                    </div>
                </section>

                {/* ===== ANALYSIS SECTION ===== */}
                <section className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-2xl border border-purple-200/50 dark:border-purple-500/20 p-6">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">📊</span> Encryption Quality Analysis
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: 'Entropy', value: metrics.entropy, ideal: '≈7.999' },
                            { label: 'NPCR', value: metrics.npcr, ideal: '≈99.6%', unit: '%' },
                            { label: 'UACI', value: metrics.uaci, ideal: '≈33.46%', unit: '%' },
                            { label: 'Corr (H)', value: metrics.correlationH, ideal: '≈0' },
                            { label: 'Corr (V)', value: metrics.correlationV, ideal: '≈0' },
                            { label: 'Corr (D)', value: metrics.correlationD, ideal: '≈0' },
                        ].map((m, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{m.label}</div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white">
                                    {m.value !== null ? `${m.value.toFixed(4)}${m.unit || ''}` : '—'}
                                </div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400">{m.ideal}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== HISTOGRAMS ===== */}
                {metrics.histogramOriginal && metrics.histogramEncrypted && (
                    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="text-xl">📈</span> Histogram Analysis
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HistogramChart title="Original Histogram" data={metrics.histogramOriginal} />
                            <HistogramChart title="Encrypted Histogram" data={metrics.histogramEncrypted} />
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
