/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { swapFacesInImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

// Uploader Component
const Uploader = ({ title, description, imageUrl, onImageUpload, onImageRemove, inputId }: { title: string, description: string, imageUrl: string | null, onImageUpload: (file: File) => void, onImageRemove: () => void, inputId: string }) => {
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
        <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center w-full h-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-1">{title}</h3>
            <p className="text-neutral-300 text-sm mb-4 text-center">{description}</p>
            {imageUrl ? (
                 <div className="relative group aspect-[4/5] w-full max-w-sm rounded-md overflow-hidden mt-auto">
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
                        "cursor-pointer aspect-[4/5] w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors mt-auto",
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
                    <span className="text-slate-400 font-semibold">{t('faceSwap.dropImage')}</span>
                    <span className="text-slate-500 text-sm mt-1">{t('faceSwap.clickToUpload')}</span>
                    <input id={inputId} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

// ImageViewer for the result page
const ImageViewer = ({ title, imageUrl, children }: { title: string, imageUrl: string | null, children?: React.ReactNode }) => {
    return (
        <div className="flex flex-col w-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{title}</h3>
            <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-contain" /> : null}
                {children}
            </div>
        </div>
    )
}

// Main component
export default function FaceSwap({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [sourceFaceImage, setSourceFaceImage] = useState<string | null>(null);
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refinePrompt, setRefinePrompt] = useState('');


    const handleImageUpload = (file: File, setImage: (dataUrl: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (instructions?: string) => {
        if (!sourceFaceImage || !targetImage) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setView('result');
        
        try {
            // sourceImageDataUrl is the image to modify (our targetImage)
            // targetFaceDataUrl is the image with the face to use (our sourceFaceImage)
            const resultUrl = await swapFacesInImage(targetImage, sourceFaceImage, undefined, instructions);
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
        link.download = 'tracquoc-ai-faceswap.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartOver = () => {
        setSourceFaceImage(null);
        setTargetImage(null);
        setGeneratedImage(null);
        setError(null);
        setRefinePrompt('');
        setView('config');
    };

    const isGenerateDisabled = !sourceFaceImage || !targetImage || isLoading;

    const renderConfigView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                <Uploader
                    title={t('faceSwap.sourceFaceTitle')}
                    description={t('faceSwap.sourceFaceDesc')}
                    imageUrl={sourceFaceImage}
                    onImageUpload={(file) => handleImageUpload(file, setSourceFaceImage)}
                    onImageRemove={() => setSourceFaceImage(null)}
                    inputId="source-face-upload"
                />
                 <Uploader
                    title={t('faceSwap.targetImageTitle')}
                    description={t('faceSwap.targetImageDesc')}
                    imageUrl={targetImage}
                    onImageUpload={(file) => handleImageUpload(file, setTargetImage)}
                    onImageRemove={() => setTargetImage(null)}
                    inputId="target-image-upload"
                />
            </div>
             <button
                onClick={() => handleGenerate()}
                disabled={isGenerateDisabled}
                className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mt-8"
            >
                {isLoading ? t('faceSwap.generatingButton') : t('faceSwap.generateButton')}
            </button>
        </div>
    );

     const renderResultView = () => (
         <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-3 gap-8">
                <ImageViewer title={t('faceSwap.originalFace')} imageUrl={sourceFaceImage} />
                <ImageViewer title={t('faceSwap.targetImage')} imageUrl={targetImage} />
                <div className="flex flex-col w-full">
                     <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('common.result')}</h3>
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
                                 <p className="font-semibold mb-2">{t('faceSwap.generationFailed')}</p>
                                 <p className="text-xs text-slate-400 mb-4">{error}</p>
                                 <button onClick={() => handleGenerate(refinePrompt)} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                             </div>
                        )}
                        {generatedImage && <img src={generatedImage} alt="Face swap result" className="w-full h-full object-contain" />}
                    </div>
                </div>
            </div>
             
             <div className="w-full max-w-3xl bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg mt-4">
                <label htmlFor="refine-prompt" className="block text-lg font-bold text-neutral-200 mb-2">{t('common.refineLabel')}</label>
                <textarea
                    id="refine-prompt"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder={t('common.refinePlaceholder')}
                    rows={3}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:ring-2 focus:ring-neutral-500 transition"
                />
                <button
                    onClick={() => handleGenerate(refinePrompt)}
                    disabled={isLoading || !sourceFaceImage || !targetImage}
                    className="w-full sm:w-auto mt-4 flex items-center justify-center gap-2 text-black font-bold py-2 px-5 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                    {t('common.regenerate')}
                </button>
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
                                <path d="M15 9.85714C15 12.1429 12.7614 14 10 14C7.23858 14 5 12.1429 5 9.85714C5 7.57143 7.23858 5.71429 10 5.71429C12.7614 5.71429 15 7.57143 15 9.85714Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M19 14.1429C19 16.4286 16.7614 18.2857 14 18.2857C11.2386 18.2857 9 16.4286 9 14.1429C9 11.8571 11.2386 10 14 10C16.7614 10 19 11.8571 19 14.1429Z" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
                                <path d="M8 10.5C8 10.5 8.5 11.5 10 11.5C11.5 11.5 12 10.5 12 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 15C12 15 12.5 16 14 16C15.5 16 16 15 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
                            </svg>
                        </span>
                        {t('app.faceSwapTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('faceSwap.subtitle')}</p>
                </div>

                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}