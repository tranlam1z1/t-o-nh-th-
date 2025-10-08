/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, ChangeEvent, DragEvent, MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { removeBackgroundFromImageAtPoint } from '../services/geminiService';
import { cn } from '../lib/utils';


export default function BackgroundRemover({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setGeneratedImage(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    const handleImageClick = async (e: ReactMouseEvent<HTMLImageElement>) => {
        if (!uploadedImage || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        try {
            const resultDataUrl = await removeBackgroundFromImageAtPoint(uploadedImage, x, y);
            setGeneratedImage(resultDataUrl);
            setView('result');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            // Stay on config view to show the error
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setUploadedImage(null);
        setGeneratedImage(null);
        setError(null);
        setView('config');
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'tracquoc-ai-no-bg.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderConfigView = () => (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            <div className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center gap-4">
                 <div className="w-full relative rounded-lg overflow-hidden flex items-center justify-center min-h-[50vh] max-h-[70vh]">
                    {uploadedImage ? (
                        <div className="relative group">
                             <img 
                                ref={imageRef} 
                                src={uploadedImage} 
                                alt="Upload" 
                                className="max-w-full max-h-[70vh] object-contain cursor-pointer" 
                                onClick={handleImageClick}
                            />
                             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l-5 5L2 2l20 2-5 5-5-2z" /></svg>
                                <p className="font-bold mt-2 text-lg">{t('backgroundRemover.clickToKeep')}</p>
                            </div>
                            {isLoading && (
                                 <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                                    <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <p className="font-bold text-xl">{t('backgroundRemover.processing')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <label 
                            htmlFor="image-upload" 
                            className={cn(
                                "w-full h-full min-h-[50vh] flex flex-col items-center justify-center text-center text-neutral-500 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors",
                                isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 hover:border-neutral-500 hover:bg-black/20"
                            )} 
                            onDrop={handleDrop} 
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={() => setIsDragOver(true)}
                            onDragLeave={() => setIsDragOver(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="text-lg font-bold text-neutral-400">{t('backgroundRemover.uploadPrompt')}</p>
                            <p className="font-bold text-neutral-300">{t('backgroundRemover.dropImage')}</p>
                            <p>{t('backgroundRemover.clickToUpload')}</p>
                            <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                        </label>
                    )}
                </div>
                {error && (
                    <div className="w-full text-center p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300">
                        <p className="font-bold">{t('backgroundRemover.removalFailed')}</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                <p className="text-neutral-400 text-center">{t('backgroundRemover.instructions')}</p>
            </div>
        </div>
    );

     const renderResultView = () => (
         <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                 <div className="flex flex-col w-full">
                     <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('common.original')}</h3>
                    <div className="aspect-square w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                        <img src={uploadedImage!} alt="Original" className="w-full h-full object-contain" />
                    </div>
                </div>
                 <div className="flex flex-col w-full">
                     <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('backgroundRemover.result')}</h3>
                    <div className="aspect-square w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                        {generatedImage && <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" />}
                    </div>
                </div>
            </div>

             <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                <button onClick={handleDownload} disabled={!generatedImage} className="w-full sm:w-auto flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('common.download')}
                </button>
                 <button onClick={handleStartOver} className="font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white">
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-7xl mx-auto flex flex-col items-center z-10">
                <header className="w-full flex justify-between items-center py-4 mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {t('common.backToTools')}
                    </button>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-neutral-400 hidden sm:block">{t('common.poweredByGemini')}</p>
                        <LanguageSwitcher />
                    </div>
                </header>

                <div className="text-center mb-10">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2 tracking-tight flex items-center justify-center gap-4">
                        <span className="text-neutral-300">
                           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                                <path d="M17 19C17 16.2386 14.7614 14 12 14C9.23858 14 7 16.2386 7 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
                            </svg>
                        </span>
                        {t('app.backgroundRemoverTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('backgroundRemover.subtitle')}</p>
                </div>
                
                {view === 'config' ? renderConfigView() : renderResultView()}
                
            </motion.div>
        </main>
    );
}
