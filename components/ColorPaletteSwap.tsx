/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { recolorImageWithPaletteImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Uploader = ({ onImageUpload, imageUrl, onImageRemove, inputId, title, description }: { onImageUpload: (file: File) => void, imageUrl: string | null, onImageRemove: () => void, inputId: string, title: string, description: string }) => {
    const { t } = useLanguage();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    return (
        <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center w-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-1">{title}</h3>
            <p className="text-neutral-300 text-sm mb-4">{description}</p>
            {imageUrl ? (
                <div className="relative group aspect-[4/5] w-full max-w-sm rounded-md overflow-hidden">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    <button
                        onClick={onImageRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${title}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "cursor-pointer aspect-[4/5] w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors",
                        isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600"
                    )}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-400 font-semibold">{t('colorPaletteSwap.dropImage')}</span>
                    <span className="text-slate-500 text-sm mt-1">{t('colorPaletteSwap.clickToUpload')}</span>
                    <input id={inputId} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

export default function ColorPaletteSwap({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
    const [paletteImage, setPaletteImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleOriginalImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setUploadedImage(dataUrl);

            const img = new Image();
            img.onload = () => {
                setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };
    
    const handlePaletteImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPaletteImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };
    
    const handlePaletteChangeInResult = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPaletteUrl = reader.result as string;
            setPaletteImage(newPaletteUrl);
            handleGenerate(newPaletteUrl); // Immediately regenerate with new palette
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'tracquoc-ai-recolored.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async (newPaletteUrl?: string) => {
        const currentPalette = newPaletteUrl || paletteImage;
        if (!uploadedImage || !currentPalette || !originalDimensions) return;
        
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null); // Clear previous result
        setView('result');

        try {
            const resultUrl = await recolorImageWithPaletteImage(uploadedImage, currentPalette, originalDimensions);
            setGeneratedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setUploadedImage(null);
        setPaletteImage(null);
        setGeneratedImage(null);
        setError(null);
        setOriginalDimensions(null);
        setView('config');
    }

    const renderConfigView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                <Uploader
                    title={t('colorPaletteSwap.originalImageTitle')}
                    description={t('colorPaletteSwap.originalImageDesc')}
                    imageUrl={uploadedImage}
                    onImageUpload={handleOriginalImageUpload}
                    onImageRemove={() => { setUploadedImage(null); setOriginalDimensions(null); }}
                    inputId="original-image-upload"
                />
                <Uploader
                    title={t('colorPaletteSwap.paletteImageTitle')}
                    description={t('colorPaletteSwap.paletteImageDesc')}
                    imageUrl={paletteImage}
                    onImageUpload={handlePaletteImageUpload}
                    onImageRemove={() => setPaletteImage(null)}
                    inputId="palette-image-upload"
                />
            </div>
            <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !uploadedImage || !paletteImage}
                className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mt-8"
            >
                {isLoading ? t('colorPaletteSwap.generatingButton') : t('colorPaletteSwap.generateButton')}
            </button>
        </div>
    );

    const renderResultView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-3 gap-8">
                {/* Original Image */}
                <div className="flex flex-col w-full">
                    <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('common.original')}</h3>
                    <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                        <img src={uploadedImage!} alt={t('common.original')} className="w-full h-full object-contain" />
                    </div>
                </div>

                {/* Palette Image (Interactive) */}
                <div className="flex flex-col w-full">
                    <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('colorPaletteSwap.paletteImage')}</h3>
                    <Uploader
                        imageUrl={paletteImage}
                        onImageUpload={handlePaletteChangeInResult}
                        onImageRemove={() => {}}
                        inputId="palette-change-upload"
                        title=""
                        description=""
                    />
                </div>

                {/* Result Image */}
                <div className="flex flex-col w-full">
                    <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('colorPaletteSwap.recoloredImage')}</h3>
                    <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                        {isLoading && (
                            <div className="w-full h-full flex items-center justify-center absolute bg-black/50">
                                <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        )}
                        {error && !isLoading && (
                            <div className="p-4 text-red-400">
                                <p className="font-semibold mb-2">{t('colorPaletteSwap.generationFailed')}</p>
                                <p className="text-xs text-slate-400 mb-4">{error}</p>
                                <button onClick={() => handleGenerate()} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                            </div>
                        )}
                         {generatedImage && !isLoading && <img src={generatedImage} alt={t('colorPaletteSwap.recoloredImage')} className="w-full h-full object-contain" />}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <button
                    onClick={handleDownload}
                    disabled={!generatedImage || isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('common.download')}
                </button>
                 <button 
                    onClick={handleStartOver} 
                    className="font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white"
                >
                    {t('common.startOver')}
                </button>
            </div>
        </div>
    );

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center p-4 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-neutral-600 to-black opacity-20 rounded-full blur-3xl" />
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-7xl mx-auto flex flex-col items-center z-10"
            >
                <header className="w-full flex justify-between items-center py-4 mb-6">
                    <button onClick={view === 'config' ? onBack : handleStartOver} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {view === 'config' ? t('common.backToTools') : t('common.startOver')}
                    </button>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-neutral-400 hidden sm:block">{t('common.poweredByGemini')}</p>
                        <LanguageSwitcher />
                    </div>
                </header>

                <div className="text-center mb-10">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2 flex items-center justify-center gap-4 tracking-tight">
                        <span className="text-neutral-300">
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C12.83 21 13.64 20.9 14.4 20.72C13.5 20.07 13 19.11 13 18C13 15.79 14.79 14 17 14C17.34 14 17.67 14.03 18 14.09C19.72 12.45 21 10.05 21 7.5C21 5.02 19.48 3 17 3C15.74 3 14.61 3.43 13.76 4.16C13.25 3.5 12.65 3.1 12 3ZM6.5 12C5.67 12 5 11.33 5 10.5C5 9.67 5.67 9 6.5 9C7.33 9 8 9.67 8 10.5C8 11.33 7.33 12 6.5 12ZM9.5 8C8.67 8 8 7.33 8 6.5C8 5.67 8.67 5 9.5 5C10.33 5 11 5.67 11 6.5C11 7.33 10.33 8 9.5 8ZM14.5 8C13.67 8 13 7.33 13 6.5C13 5.67 13.67 5 14.5 5C15.33 5 16 5.67 16 6.5C16 7.33 15.33 8 14.5 8ZM17.5 12C16.67 12 16 11.33 16 10.5C16 9.67 16.67 9 17.5 9C18.33 9 19 9.67 19 10.5C19 11.33 18.33 12 17.5 12Z" fill="currentColor"/>
                            </svg>
                        </span>
                        {t('app.colorPaletteSwapTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('colorPaletteSwap.subtitle')}</p>
                </div>
                
                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}