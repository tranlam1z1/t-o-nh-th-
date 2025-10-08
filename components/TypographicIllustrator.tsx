/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generateTypographicIllustration } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const ImageViewer = ({ title, imageUrl, children }: { title: string, imageUrl: string | null, children?: React.ReactNode }) => {
    return (
        <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col w-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-4">{title}</h3>
            <div className="aspect-[1/1] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-contain" /> : null}
                {children}
            </div>
        </div>
    )
}

export default function TypographicIllustrator({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [phrase, setPhrase] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'tracquoc-ai-typography.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async () => {
        if (!phrase) return;
        setIsLoading(true);
        setError(null);
        setView('result');
        try {
            const resultUrl = await generateTypographicIllustration(phrase);
            setGeneratedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setPhrase('');
        setGeneratedImage(null);
        setError(null);
        setView('config');
    }

    const renderConfigView = () => (
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
             <div className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center">
                <label htmlFor="phrase-input" className="w-full text-2xl font-bold text-neutral-200 mb-2">{t('typographicIllustrator.inputLabel')}</label>
                <textarea
                    id="phrase-input"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder={t('typographicIllustrator.inputPlaceholder')}
                    rows={3}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-3 text-neutral-200 focus:ring-2 focus:ring-neutral-500 transition text-lg"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !phrase}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-5 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {t('typographicIllustrator.generateButton')}
                </button>
            </div>
        </div>
    );

    const renderResultView = () => (
         <div className="w-full max-w-2xl flex flex-col items-center gap-8">
            <div className="w-full flex flex-col gap-4">
                <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-lg text-center">
                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-wider">{t('typographicIllustrator.originalPhrase')}</p>
                    <p className="text-neutral-100 text-2xl font-semibold mt-1">"{phrase}"</p>
                </div>
                <ImageViewer title={t('typographicIllustrator.resultTitle')} imageUrl={generatedImage}>
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
                             <p className="font-semibold mb-2">{t('typographicIllustrator.generationFailed')}</p>
                             <p className="text-xs text-slate-400 mb-4">{error}</p>
                             <button onClick={handleGenerate} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                         </div>
                    )}
                </ImageViewer>
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
                className="w-full max-w-5xl mx-auto flex flex-col items-center z-10"
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
                                <path d="M7 17L10 14L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19.0001 3L21.0001 5L16.0001 10L14.0001 8L19.0001 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </span>
                        {t('app.typographicIllustratorTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('typographicIllustrator.subtitle')}</p>
                </div>
                
                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}
