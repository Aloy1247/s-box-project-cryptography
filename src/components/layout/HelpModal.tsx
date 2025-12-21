import { useAppStore } from '../../store/useAppStore';

interface MetricInfo {
    abbr: string;
    name: string;
    description: string;
    idealValue: string;
}

// S-box Research Metrics
const sboxMetrics: MetricInfo[] = [
    {
        abbr: 'NL',
        name: 'Non-Linearity',
        description: 'Measures the minimum Hamming distance between the S-box component functions and all affine functions. Higher values indicate better resistance against linear cryptanalysis.',
        idealValue: '≥ 112 (AES achieves 112)',
    },
    {
        abbr: 'SAC',
        name: 'Strict Avalanche Criterion',
        description: 'Measures whether flipping a single input bit causes each output bit to change with probability 0.5. Values close to 0.5 indicate good diffusion.',
        idealValue: '≈ 0.5',
    },
    {
        abbr: 'BIC-NL',
        name: 'Bit Independence Criterion (NL)',
        description: 'Measures the non-linearity of the XOR of pairs of output bits. High values indicate that output bits are independently non-linear.',
        idealValue: '≥ 112',
    },
    {
        abbr: 'BIC-SAC',
        name: 'Bit Independence Criterion (SAC)',
        description: 'Measures whether pairs of output bits satisfy SAC independently. Values close to 0.5 are ideal.',
        idealValue: '≈ 0.5',
    },
    {
        abbr: 'LAP',
        name: 'Linear Approximation Probability',
        description: 'Maximum bias in any linear approximation of the S-box. Lower values provide better resistance against linear cryptanalysis.',
        idealValue: '≤ 2⁻⁴ (0.0625)',
    },
    {
        abbr: 'DAP',
        name: 'Differential Approximation Probability',
        description: 'Maximum probability of any non-trivial differential. Lower values provide better resistance against differential cryptanalysis.',
        idealValue: '≤ 2⁻⁶ (0.015625)',
    },
    {
        abbr: 'DU',
        name: 'Differential Uniformity',
        description: 'Maximum number of solutions for any differential equation. For 8-bit S-boxes, 4 is the theoretical minimum (APN-like behavior).',
        idealValue: '= 4 (optimal for 8-bit)',
    },
    {
        abbr: 'AD',
        name: 'Algebraic Degree',
        description: 'Highest degree of the algebraic normal form (ANF) polynomial. Higher degrees resist algebraic attacks.',
        idealValue: '= 7 (maximum for 8-bit)',
    },
    {
        abbr: 'TO',
        name: 'Transparency Order',
        description: 'Measures resistance against DPA (Differential Power Analysis) side-channel attacks. Lower values are better.',
        idealValue: '< 3.0',
    },
    {
        abbr: 'CI',
        name: 'Correlation Immunity',
        description: 'Order of correlation immunity. Higher values mean output is less correlated with subsets of input bits.',
        idealValue: '≥ 0',
    },
];

// Image Encryption Metrics
const imageEncryptionMetrics: MetricInfo[] = [
    {
        abbr: 'ENT',
        name: 'Entropy',
        description: 'Mengukur tingkat keacakan dalam citra terenkripsi. Entropy tinggi menunjukkan distribusi pixel yang merata dan sulit diprediksi. Nilai maksimum untuk citra 8-bit adalah 8.',
        idealValue: '≈ 8.0 (mendekati maksimum)',
    },
    {
        abbr: 'NPCR',
        name: 'Number of Pixels Change Rate',
        description: 'Mengukur persentase pixel yang berubah ketika satu pixel pada plain image diubah. NPCR tinggi menunjukkan sensitivitas tinggi terhadap perubahan kecil.',
        idealValue: '> 99.5%',
    },
    {
        abbr: 'UACI',
        name: 'Unified Average Changing Intensity',
        description: 'Mengukur rata-rata intensitas perubahan antara dua citra terenkripsi. UACI yang ideal menunjukkan bahwa perubahan kecil pada plain image menyebabkan perubahan signifikan pada cipher image.',
        idealValue: '≈ 33.46%',
    },
    {
        abbr: 'CH',
        name: 'Horizontal Correlation',
        description: 'Mengukur korelasi antara pixel yang berdekatan secara horizontal. Nilai rendah menunjukkan bahwa enkripsi berhasil menghilangkan pola spasial.',
        idealValue: '≈ 0 (mendekati nol)',
    },
    {
        abbr: 'CV',
        name: 'Vertical Correlation',
        description: 'Mengukur korelasi antara pixel yang berdekatan secara vertikal. Nilai rendah menunjukkan diffusion yang baik dalam arah vertikal.',
        idealValue: '≈ 0 (mendekati nol)',
    },
    {
        abbr: 'CD',
        name: 'Diagonal Correlation',
        description: 'Mengukur korelasi antara pixel yang berdekatan secara diagonal. Nilai rendah menunjukkan bahwa tidak ada pola diagonal yang tersisa.',
        idealValue: '≈ 0 (mendekati nol)',
    },
];

// AES Encryption Info
const aesEncryptionInfo: MetricInfo[] = [
    {
        abbr: 'AES',
        name: 'Advanced Encryption Standard',
        description: 'Algoritma enkripsi simetris yang menggunakan blok 128-bit dengan kunci 128, 192, atau 256 bit. AES terdiri dari beberapa tahap: SubBytes, ShiftRows, MixColumns, dan AddRoundKey.',
        idealValue: 'Standar NIST FIPS 197',
    },
    {
        abbr: 'SB',
        name: 'SubBytes (S-box Substitution)',
        description: 'Tahap substitusi non-linear menggunakan S-box. Setiap byte diganti dengan nilai dari lookup table S-box untuk memberikan confusion.',
        idealValue: 'Bijective mapping',
    },
    {
        abbr: 'SR',
        name: 'ShiftRows',
        description: 'Tahap permutasi yang menggeser baris-baris state matrix. Baris 0 tidak digeser, baris 1 digeser 1 byte, baris 2 digeser 2 byte, baris 3 digeser 3 byte.',
        idealValue: 'Diffusion antar kolom',
    },
    {
        abbr: 'MC',
        name: 'MixColumns',
        description: 'Transformasi linear yang mencampur byte dalam setiap kolom. Operasi ini menggunakan perkalian matrix di GF(2⁸) untuk memberikan diffusion.',
        idealValue: 'MDS matrix property',
    },
    {
        abbr: 'ARK',
        name: 'AddRoundKey',
        description: 'Operasi XOR antara state dengan round key. Ini adalah satu-satunya tahap yang melibatkan kunci enkripsi secara langsung.',
        idealValue: 'Key-dependent transformation',
    },
    {
        abbr: 'KS',
        name: 'Key Schedule',
        description: 'Proses ekspansi kunci untuk menghasilkan round keys dari kunci utama. Jumlah round tergantung pada panjang kunci: 10 (128-bit), 12 (192-bit), atau 14 (256-bit).',
        idealValue: 'Resistance to related-key attacks',
    },
    {
        abbr: 'ECB',
        name: 'Electronic Codebook Mode',
        description: 'Mode operasi dimana setiap blok dienkripsi secara independen. Sederhana tapi tidak aman untuk data dengan pola berulang.',
        idealValue: 'Hanya untuk data random',
    },
    {
        abbr: 'CBC',
        name: 'Cipher Block Chaining Mode',
        description: 'Mode operasi dimana setiap blok di-XOR dengan ciphertext blok sebelumnya sebelum enkripsi. Membutuhkan IV untuk blok pertama.',
        idealValue: 'Lebih aman dari ECB',
    },
];

interface HelpContentConfig {
    title: string;
    subtitle: string;
    metrics: MetricInfo[];
    badgeColor: string;
}

const helpContentMap: Record<string, HelpContentConfig> = {
    'sbox-research': {
        title: 'Cryptographic Metrics Guide',
        subtitle: 'Reference for S-box security analysis',
        metrics: sboxMetrics,
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    'steganography': {
        title: 'Image Encryption Analysis Guide',
        subtitle: 'Metrics for evaluating image encryption quality',
        metrics: imageEncryptionMetrics,
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    'aes-encrypt': {
        title: 'AES Encryption Guide',
        subtitle: 'Understanding AES cipher operations',
        metrics: aesEncryptionInfo,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    'about': {
        title: 'About S-box Forge',
        subtitle: 'Application information',
        metrics: [],
        badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    },
};

export function HelpModal() {
    const { showHelp, setShowHelp, currentPage } = useAppStore();

    const content = helpContentMap[currentPage] || helpContentMap['sbox-research'];

    if (!showHelp) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowHelp(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{content.title}</h2>
                        <p className="text-sm text-slate-500">{content.subtitle}</p>
                    </div>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {content.metrics.length > 0 ? (
                        content.metrics.map((metric) => (
                            <div
                                key={metric.abbr}
                                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`flex-none px-2 py-1 ${content.badgeColor} font-bold text-sm rounded`}>
                                        {metric.abbr}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{metric.name}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{metric.description}</p>
                                        <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                            Ideal: {metric.idealValue}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <p>No help content available for this page.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {/* Footer removed */}
            </div>
        </div>
    );
}
