/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { generateDepthMap } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Uploader = ({ onImageUpload, isLoading }: { onImageUpload: (file: File) => void, isLoading: boolean }) => {
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
        <label
            htmlFor="depth-upload"
            className={cn(
                "cursor-pointer aspect-[4/5] w-full max-w-md flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors relative overflow-hidden",
                isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-neutral-300 mt-4">{t('depthEffect.processingLayers')}</span>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-400 font-semibold">{t('depthEffect.dropImage')}</span>
                    <span className="text-slate-500 text-sm mt-1">{t('depthEffect.clickToUpload')}</span>
                    <input id="depth-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </>
            )}
        </label>
    );
};

export default function DepthEffect({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [depthMapLayer, setDepthMapLayer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    
    const mouseXSpring = useSpring(mouseX, springConfig);
    const mouseYSpring = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (containerRef.current) {
            const { left, top, width, height } = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            mouseX.set(x);
            mouseY.set(y);
        }
    };
    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    // Background moves less
    const bgX = useTransform(mouseXSpring, [0, 1], [10, -10]);
    const bgY = useTransform(mouseYSpring, [0, 1], [10, -10]);
    // Foreground moves more
    const fgX = useTransform(mouseXSpring, [0, 1], [-25, 25]);
    const fgY = useTransform(mouseYSpring, [0, 1], [-25, 25]);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            setUploadedImage(imageDataUrl);
            setDepthMapLayer(null);
            setError(null);
            handleGenerateDepthMap(imageDataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateDepthMap = async (image: string) => {
        if (!image) return;
        setIsLoading(true);
        setError(null);
        setView('result');
        try {
            const depthMap = await generateDepthMap(image);
            setDepthMapLayer(depthMap);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setUploadedImage(null);
        setDepthMapLayer(null);
        setError(null);
        setView('config');
    }

    const renderConfigView = () => (
        <div className="w-full flex flex-col items-center gap-8">
             <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center">
                <h3 className="font-bold text-2xl text-neutral-200 mb-1">{t('depthEffect.uploadTitle')}</h3>
                <p className="text-neutral-300 text-sm mb-4">{t('depthEffect.uploadDesc')}</p>
                <Uploader onImageUpload={handleImageUpload} isLoading={isLoading} />
            </div>
        </div>
    );

    const renderResultView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full max-w-xl flex flex-col items-center gap-4">
                <h3 className="font-bold text-2xl text-neutral-200">{t('depthEffect.resultTitle')}</h3>
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden"
                    style={{ perspective: '1200px' }}
                >
                    {isLoading && (
                        <>
                           <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           <span className="text-neutral-300 ml-4">{t('depthEffect.processingLayers')}</span>
                        </>
                    )}
                    {error && !isLoading && (
                         <div className="p-4 text-red-400">
                             <p className="font-semibold mb-2">{t('depthEffect.generationFailed')}</p>
                             <p className="text-xs text-slate-400 mb-4">{error}</p>
                             <button onClick={() => handleGenerateDepthMap(uploadedImage!)} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                         </div>
                    )}
                    {uploadedImage && (
                        <>
                            {/* Background Layer (moves less) */}
                            <motion.div
                                style={{ x: bgX, y: bgY, scale: 1.15 }}
                                className="absolute inset-[-10%]"
                            >
                                <img src={uploadedImage} alt="Background" className="w-full h-full object-cover" />
                            </motion.div>
                            
                            {/* Foreground Layer (moves more, masked by depth map) */}
                            {depthMapLayer && (
                                <motion.div
                                    style={{
                                        x: fgX,
                                        y: fgY,
                                        scale: 1.15,
                                        maskImage: `url(${depthMapLayer})`,
                                        WebkitMaskImage: `url(${depthMapLayer})`,
                                        maskSize: 'cover',
                                        WebkitMaskSize: 'cover',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                    }}
                                    className="absolute inset-[-10%]"
                                >
                                    <img src={uploadedImage} alt="Foreground" className="w-full h-full object-cover" />
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
             <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
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
                                <path d="M4 18L12 14L20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4 12L12 8L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4 6L12 2L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        {t('app.depthEffectTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('depthEffect.subtitle')}</p>
                </div>
                
                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}