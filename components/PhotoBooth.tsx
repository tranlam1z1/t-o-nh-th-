/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { generatePhotoBoothImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type PhotoBoothCount = 4 | 6 | 8 | 9 | 12;

// Uploader Component
const Uploader = ({ onImageUpload }: { onImageUpload: (file: File) => void }) => {
    const { t } = useLanguage();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };

    return (
        <label
            htmlFor="photobooth-upload"
            className={cn(
                "cursor-pointer aspect-[4/5] w-full max-w-md flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors p-4",
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
            <span className="text-slate-400 font-semibold">{t('photoBooth.dropImage')}</span>
            <span className="text-slate-500 text-sm mt-1">{t('photoBooth.clickToUpload')}</span>
            <input id="photobooth-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

const OptionButton = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            'px-3 py-2 text-sm rounded-md transition-colors w-full',
            isSelected ? 'bg-neutral-200 text-black font-bold' : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50'
        )}
    >
        {label}
    </button>
);


export default function PhotoBooth({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photoBoothCount, setPhotoBoothCount] = useState<PhotoBoothCount>(9);


    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            setUploadedImage(imageDataUrl);
            setGeneratedImage(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };
    
    const handleStartOver = () => {
        setUploadedImage(null);
        setGeneratedImage(null);
        setError(null);
        setView('config');
    }

    const handleGoBackToConfig = () => {
        setGeneratedImage(null);
        setError(null);
        setView('config');
    };

    const handleGenerate = async () => {
        if (!uploadedImage) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setView('result');

        try {
            const resultUrl = await generatePhotoBoothImage(uploadedImage, photoBoothCount);
            setGeneratedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `tracquoc-ai-photobooth.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerateDisabled = !uploadedImage || isLoading;

    const renderConfigView = () => (
        <div className="w-full grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
                <h3 className="font-bold text-2xl text-neutral-200 mb-1">{t('photoBooth.uploadTitle')}</h3>
                {uploadedImage ? (
                    <div className="relative group aspect-[4/5] w-full max-w-sm rounded-md overflow-hidden">
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                            onClick={() => setUploadedImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <Uploader onImageUpload={handleImageUpload} />
                )}
            </div>
            <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                <h3 className="font-bold text-2xl text-neutral-200 mb-2">{t('photoBooth.optionsTitle')}</h3>
                <div>
                    <h4 className="font-bold text-neutral-300 mb-2">{t('photoBooth.photoCount')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                         {([4, 6, 8, 9, 12] as PhotoBoothCount[]).map(count => (
                            <OptionButton key={count} label={`${count} Photos`} isSelected={photoBoothCount === count} onClick={() => setPhotoBoothCount(count)} />
                         ))}
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? t('photoBooth.generatingButton') : t('photoBooth.generateButton')}
                </button>
            </div>
        </div>
    );

    const renderResultView = () => (
         <div className="w-full max-w-xl flex flex-col items-center gap-8">
            <div className="w-full">
                 <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('photoBooth.resultTitle')}</h3>
                <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                    {isLoading && (
                        <div className="w-full h-full flex items-center justify-center absolute bg-black/50">
                            <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="p-4 text-red-400">
                            <p className="font-semibold mb-2">{t('photoBooth.generationFailed')}</p>
                            <p className="text-xs text-slate-400 mb-4">{error}</p>
                            <button onClick={handleGenerate} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                        </div>
                    )}
                    {generatedImage && <img src={generatedImage} alt="Photo Booth Result" className="w-full h-full object-contain" />}
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
                    <button onClick={view === 'config' ? onBack : handleGoBackToConfig} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {view === 'config' ? t('common.backToTools') : t('common.goBack')}
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
                                <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                           </svg>
                        </span>
                        {t('app.photoBoothTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('photoBooth.subtitle')}</p>
                </div>

                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}