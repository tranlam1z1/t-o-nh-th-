/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { generateStyledImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type View = 'config' | 'result';
interface GeneratedImageState {
    status: 'pending' | 'done' | 'error';
    url?: string;
    error?: string;
}

const ANGLE_OPTIONS = [
    { id: 'front', labelKey: 'productSceneGenerator.angles.front', prompt: "Generate a photorealistic image of the product from a direct front view angle." },
    { id: 'back', labelKey: 'productSceneGenerator.angles.back', prompt: "Generate a photorealistic image of the product from a direct back view angle." },
    { id: 'side_left', labelKey: 'productSceneGenerator.angles.side_left', prompt: "Generate a photorealistic image of the product from the left side view." },
    { id: 'side_right', labelKey: 'productSceneGenerator.angles.side_right', prompt: "Generate a photorealistic image of the product from the right side view." },
    { id: 'top', labelKey: 'productSceneGenerator.angles.top', prompt: "Generate a photorealistic image of the product from a top-down angle (bird's-eye view)." },
    { id: 'bottom', labelKey: 'productSceneGenerator.angles.bottom', prompt: "Generate a photorealistic image of the product from a bottom-up angle (worm's-eye view)." },
    { id: 'three_quarter', labelKey: 'productSceneGenerator.angles.three_quarter', prompt: "Generate a photorealistic image of the product from a three-quarter angle, showing the front and one side." },
    { id: 'close_up', labelKey: 'productSceneGenerator.angles.close_up', prompt: "Generate a close-up detail shot of the product, focusing on its texture, material, or a key feature." },
    { id: 'in_context', labelKey: 'productSceneGenerator.angles.in_context', prompt: "Generate a photorealistic lifestyle image showing the product in a relevant, natural context (e.g., a shoe on a street, a mug on a table)." },
];

const Uploader = ({ onImageUpload }: { onImageUpload: (file: File) => void }) => {
    const { t } = useLanguage();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) onImageUpload(e.target.files[0]);
    };
    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) onImageUpload(e.dataTransfer.files[0]);
    };
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(enter);
    };

    return (
        <label htmlFor="product-upload" className={cn("cursor-pointer aspect-[4/5] w-full max-w-md flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors", isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600")} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-slate-400 font-semibold">{t('productSceneGenerator.dropImage')}</span>
            <span className="text-slate-500 text-sm mt-1">{t('productSceneGenerator.clickToUpload')}</span>
            <input id="product-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

const ResultCard = ({ title, imageUrl, status, error, onRetry, onDownload }: { title: string, imageUrl?: string, status: GeneratedImageState['status'], error?: string, onRetry: () => void, onDownload: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col w-full">
            <h3 className="font-bold text-lg text-neutral-200 mb-2 text-center">{title}</h3>
            <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden group">
                {status === 'pending' && <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {status === 'error' && <div className="p-4 text-red-400"><p className="font-semibold mb-2">{t('productSceneGenerator.generationFailed')}</p><p className="text-xs text-slate-400 mb-4">{error}</p><button onClick={onRetry} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button></div>}
                {status === 'done' && imageUrl && <img src={imageUrl} alt={title} className="w-full h-full object-contain" />}
                {status === 'done' && imageUrl && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onDownload} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75" aria-label={t('common.download')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        <button onClick={onRetry} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75" aria-label={t('common.regenerate')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" /></svg></button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ProductSceneGenerator({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<View>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImageState>>({});
    const [isGenerating, setIsGenerating] = useState(false);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setGeneratedImages({});
        };
        reader.readAsDataURL(file);
    };

    const toggleAngle = (angleId: string) => {
        setSelectedAngles(prev =>
            prev.includes(angleId) ? prev.filter(id => id !== angleId) : [...prev, angleId]
        );
    };

    const handleGenerateSingle = async (angleId: string) => {
        if (!uploadedImage) return;
        const angle = ANGLE_OPTIONS.find(a => a.id === angleId);
        if (!angle) return;

        setGeneratedImages(prev => ({ ...prev, [angleId]: { status: 'pending' } }));

        try {
            const basePrompt = `Using the provided image of a product, generate a new, photorealistic image of the **exact same product**. The product's unique details, materials, colors, and branding MUST be perfectly preserved. Place it on a clean, solid, light grey studio background.`;
            const finalPrompt = `${basePrompt}\n\n**Angle Instruction:** ${angle.prompt}`;
            const resultUrl = await generateStyledImage(finalPrompt, [uploadedImage]);
            setGeneratedImages(prev => ({ ...prev, [angleId]: { status: 'done', url: resultUrl } }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({ ...prev, [angleId]: { status: 'error', error: message } }));
        }
    };

    const handleGenerateAll = async () => {
        if (!uploadedImage || selectedAngles.length === 0) return;
        setIsGenerating(true);
        setView('result');

        const initialStates: Record<string, GeneratedImageState> = {};
        selectedAngles.forEach(id => {
            initialStates[id] = { status: 'pending' };
        });
        setGeneratedImages(initialStates);

        const concurrencyLimit = 3;
        const queue = [...selectedAngles];

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (queue.length > 0) {
                const angleId = queue.shift();
                if (angleId) {
                    await handleGenerateSingle(angleId);
                }
            }
        });

        await Promise.all(workers);
        setIsGenerating(false);
    };

    const handleStartOver = () => {
        setUploadedImage(null);
        setSelectedAngles([]);
        setGeneratedImages({});
        setView('config');
    };

    const handleDownload = (url: string | undefined, filename: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `tracquoc-ai-${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const generateButtonText = isGenerating ? t('productSceneGenerator.generatingButton') : `${t('productSceneGenerator.generateButton')} (${selectedAngles.length})`;

    const renderConfigView = () => (
        <div className="w-full grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
                <h3 className="font-bold text-2xl text-neutral-200 mb-1">{t('productSceneGenerator.step1Title')}</h3>
                {uploadedImage ? (
                    <div className="relative group aspect-[4/5] w-full max-w-sm rounded-md overflow-hidden"><img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" /><button onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Remove image"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                ) : <Uploader onImageUpload={handleImageUpload} />}
            </div>
            <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                <div className={cn(!uploadedImage && "opacity-50 pointer-events-none")}>
                    <h3 className="font-bold text-2xl text-neutral-200 mb-2">{t('productSceneGenerator.step2Title')}</h3>
                    <p className="text-neutral-400 text-sm mb-4">{t('productSceneGenerator.step2Desc')}</p>
                    <div className="flex flex-wrap gap-2">
                        {ANGLE_OPTIONS.map(angle => <button key={angle.id} onClick={() => toggleAngle(angle.id)} className={cn('px-3 py-2 text-sm rounded-md transition-colors', selectedAngles.includes(angle.id) ? 'bg-neutral-200 text-black font-bold' : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50')}>{t(angle.labelKey)}</button>)}
                    </div>
                </div>
                <button onClick={handleGenerateAll} disabled={!uploadedImage || selectedAngles.length === 0 || isGenerating} className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">{generateButtonText}</button>
            </div>
        </div>
    );

    const renderResultView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 <ResultCard title={t('common.original')} imageUrl={uploadedImage} status='done' onRetry={() => {}} onDownload={() => handleDownload(uploadedImage, 'original')} />
                 {Object.entries(generatedImages).map(([angleId, state]) => {
                     const angle = ANGLE_OPTIONS.find(a => a.id === angleId);
                     if (!angle) return null;
                     return <ResultCard key={angleId} title={t(angle.labelKey)} imageUrl={state.url} status={state.status} error={state.error} onRetry={() => handleGenerateSingle(angleId)} onDownload={() => handleDownload(state.url, angleId)} />
                 })}
            </div>
            <button onClick={handleStartOver} className="font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white mt-8">{t('common.startOver')}</button>
        </div>
    );
    
    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center p-4 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-neutral-600 to-black opacity-20 rounded-full blur-3xl" /></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-7xl mx-auto flex flex-col items-center z-10">
                <header className="w-full flex justify-between items-center py-4 mb-6">
                    <button onClick={view === 'config' ? onBack : handleStartOver} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{view === 'config' ? t('common.backToTools') : t('common.startOver')}</button>
                    <div className="flex items-center gap-4"><p className="text-sm text-neutral-400 hidden sm:block">{t('common.poweredByGemini')}</p><LanguageSwitcher /></div>
                </header>
                <div className="text-center mb-10">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2 flex items-center justify-center gap-4 tracking-tight">
                        <span className="text-neutral-300"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 14L8 12V20L3 18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12L15 9V17L8 20V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9L21 7V15L15 17V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9L8 6L3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                        {t('app.productSceneGeneratorTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('productSceneGenerator.subtitle')}</p>
                </div>
                {view === 'config' ? renderConfigView() : renderResultView()}
            </motion.div>
        </main>
    );
}