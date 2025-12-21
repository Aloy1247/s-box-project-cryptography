import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { fetchMatrices } from '../../api/sboxApi';
<<<<<<< HEAD
=======
import type { AffineMatrixDef } from '../../types';
>>>>>>> c1b06dd38373a30c655cdefd5d6198632386ed73

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const initialMetrics = {
    entropy: null, npcr: null, uaci: null,
    correlationH: null, correlationV: null, correlationD: null,
};

export function ImageEncryptionPage() {
    const encryptRef = useRef<HTMLInputElement>(null);
    const decryptRef = useRef<HTMLInputElement>(null);
<<<<<<< HEAD

    // Dynamic matrix list from API
    const [sboxOptions, setSboxOptions] = useState<{ value: string; label: string }[]>([
        { value: 'KAES', label: 'AES Standard' },
        { value: 'K44', label: 'K44 (Best)' },
    ]);

    useEffect(() => {
        fetchMatrices().then(matrices => {
            const options = matrices.map(m => ({
                value: m.id,
                label: m.name,
            }));
            if (options.length > 0) {
                setSboxOptions(options);
            }
        }).catch(console.error);
    }, []);
=======
    const [matrices, setMatrices] = useState<AffineMatrixDef[]>([]);
>>>>>>> c1b06dd38373a30c655cdefd5d6198632386ed73

    // Global Store
    const { imageEncryption, setImageEncryptionState } = useAppStore();
    const {
        sbox, key,
        encryptInput, encryptPreview, encryptResult, encryptStatus, encryptError,
        decryptInput, decryptPreview, decryptResult, decryptStatus, decryptError,
        metrics
    } = imageEncryption;

    // Helper Setters (optional, can call setImageEncryptionState directly)
    const setSbox = (val: string) => setImageEncryptionState({ sbox: val });
    const setKey = (val: string) => setImageEncryptionState({ key: val });

    // Encrypt State helpers
    const setEncryptStatus = (val: 'ready' | 'processing' | 'done' | 'error') => setImageEncryptionState({ encryptStatus: val });
    const setEncryptError = (val: string) => setImageEncryptionState({ encryptError: val });

    // Decrypt State helpers
    const setDecryptStatus = (val: 'ready' | 'processing' | 'done' | 'error') => setImageEncryptionState({ decryptStatus: val });
    const setDecryptError = (val: string) => setImageEncryptionState({ decryptError: val });

<<<<<<< HEAD
=======
    useEffect(() => {
        fetchMatrices().then(setMatrices);
        // Set default placeholder key if empty
        if (!key) {
            setKey('0001020304050607');
        }
    }, []);

>>>>>>> c1b06dd38373a30c655cdefd5d6198632386ed73
    const handleEncrypt = async () => {
        if (!encryptInput || !key.trim()) { setEncryptError('Please select image and enter key'); setEncryptStatus('error'); return; }
        setEncryptStatus('processing'); setEncryptError('');

        try {
            const formData = new FormData();
            formData.append('image', encryptInput);
            formData.append('key', key);
            formData.append('sboxId', sbox);

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
            formData.append('sboxId', sbox);

            const res = await fetch(`${API_BASE_URL}/api/image/decrypt`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');

            const resultUrl = URL.createObjectURL(await res.blob());
            setImageEncryptionState({
                decryptResult: resultUrl,
                decryptStatus: 'done'
            });
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
<<<<<<< HEAD
    {
        sboxOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
        ))
    }
=======
                                    {matrices.length === 0 && <option value="KAES">AES Standard (KAES)</option>}
                                    {matrices.filter(m => m.id !== 'KAES' && m.id !== 'K44').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                    {/* Make sure we don't exclude K44 from dropdown if desired, but filtering it out to avoid duplication with button is okay, or just show all */}
                                    {/* Actually, user might want to select others. Let's just list all except maybe KAES and K44 if they are buttons, but simpler to just list all in dropdown too or filter. */}
                                    {/* Let's list others. */}
>>>>>>> c1b06dd38373a30c655cdefd5d6198632386ed73
                                </select >
                            </div >
                        </div >

        {/* Encryption Key - More Prominent */ }
        < div >
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
                        </div >
                    </div >
                </div >

        {/* ===== ENCRYPT SECTION ===== */ }
        < section className = "relative" >
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
                </section >

        {/* ===== DECRYPT SECTION ===== */ }
        < section className = "relative" >
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
                </section >

        {/* ===== ANALYSIS SECTION ===== */ }
        < section className = "bg-gradient-to-br from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-2xl border border-purple-200/50 dark:border-purple-500/20 p-6" >
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
                </section >
            </div >
        </main >
    );
}
