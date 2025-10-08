

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
import DrawingCanvas from './DrawingCanvas';
import ThreeDeeCanvas from './ThreeDeeCanvas';

// ImageViewer for the result page
const ImageViewer = ({ title, imageUrl }: { title: string, imageUrl: string | null }) => {
    return (
        <div className="flex flex-col w-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{title}</h3>
            <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-contain" /> : null}
            </div>
        </div>
    )
}

// Main component
export default function PoseAnimator({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'character' | 'pose' | 'result'>('character');
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [poseImage, setPoseImage] = useState<string | null>(null);
    const [drawnPose, setDrawnPose] = useState<string | null>(null);
    const [threeDeePose, setThreeDeePose] = useState<string | null>(null);
    const [activePoseImage, setActivePoseImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [poseSourceTab, setPoseSourceTab] = useState<'upload' | 'draw' | 'threeD'>('upload');
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);


    const handleImageUpload = (file: File, setImage: (dataUrl: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCharacterFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0], setCharacterImage);
            setError(null);
        }
    };

    const handlePoseFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0], setPoseImage);
            setError(null);
        }
    };

    const runAnimationGeneration = async (charImg: string, poseImg: string, instructions?: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const prompt = `
**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the person from the first image (the 'character'). The final generated face MUST be a photorealistic, 100% identical replica of the person in the first image. Do not change their facial features, age, or structure. This rule overrides all other instructions, including any minor refinement instructions provided by the user.

**SECONDARY TASK: POSE TRANSFER**
Your secondary task is to transfer the pose from the second image (the 'reference pose') onto the character from the first image.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze Character & Pose:** Identify the person in the first image and the pose in the second image.
2.  **Combine:** Recreate the character from the first image in the exact pose from the second image.
3.  **Maintain Style:** The clothing, background, lighting, and artistic style of the first image must be precisely maintained. The only intended change is the person's pose.
`;
            
            const resultUrl = await generateStyledImage(prompt, [charImg, poseImg], instructions);
            setGeneratedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialAnimate = async () => {
        const finalPoseImage = poseSourceTab === 'draw' ? drawnPose : poseSourceTab === 'upload' ? poseImage : threeDeePose;
        if (!characterImage || !finalPoseImage) return;

        setActivePoseImage(finalPoseImage);
        setGeneratedImage(null);
        setView('result');
        runAnimationGeneration(characterImage, finalPoseImage);
    };

    const handleRegenerate = async () => {
        if (!characterImage || !activePoseImage) return;
        setGeneratedImage(null);
        runAnimationGeneration(characterImage, activePoseImage, refinePrompt);
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'tracquoc-ai-posed.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartOver = () => {
        setCharacterImage(null);
        setPoseImage(null);
        setDrawnPose(null);
        setThreeDeePose(null);
        setActivePoseImage(null);
        setGeneratedImage(null);
        setError(null);
        setRefinePrompt('');
        setView('character');
    };

    const handleDrop = (e: DragEvent<HTMLElement>, setImage: (dataUrl: string) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0], setImage);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(enter);
    };
    
    const handleHeaderBack = () => {
        switch(view) {
            case 'character':
                onBack();
                break;
            case 'pose':
                setView('character');
                break;
            case 'result':
                // Go back to pose selection but keep state
                setGeneratedImage(null);
                setError(null);
                setView('pose');
                break;
        }
    };

    const isAnimateDisabled = !characterImage || !(poseImage || drawnPose || threeDeePose) || isLoading;

    const renderCharacterStep = () => (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center"
            >
                <h3 className="text-3xl font-bold text-neutral-200 mb-2">{t('poseAnimator.step1Title')}</h3>
                <p className="text-neutral-400 mb-4">{t('poseAnimator.step1Desc')}</p>
                <div className="w-full max-w-sm">
                     {characterImage ? (
                        <div className="relative group aspect-[4/5] rounded-md overflow-hidden">
                            <img src={characterImage} alt={t('poseAnimator.characterImage')} className="w-full h-full object-cover" />
                            <button
                                onClick={() => setCharacterImage(null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                                aria-label={`Remove ${t('poseAnimator.characterImage')}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor="character-upload"
                            className={cn("cursor-pointer aspect-[4/5] flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors", isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600")}
                            onDrop={(e) => handleDrop(e, setCharacterImage)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={(e) => handleDragEvents(e, true)}
                            onDragLeave={(e) => handleDragEvents(e, false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-slate-400 font-semibold">{t('poseAnimator.dropImage')}</span>
                            <span className="text-slate-500 text-sm mt-1">{t('poseAnimator.clickToUpload')}</span>
                            <input id="character-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleCharacterFileChange} />
                        </label>
                    )}
                </div>
                 <button
                    onClick={() => setView('pose')}
                    disabled={!characterImage}
                    className="w-full max-w-sm mt-6 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {t('common.nextStep')} &rarr;
                </button>
            </motion.div>
        </div>
    );

    const renderPoseStep = () => (
         <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center"
            >
                <h3 className="text-3xl font-bold text-neutral-200 mb-2">{t('poseAnimator.step2Title')}</h3>
                <p className="text-neutral-400 mb-4 text-center">{t('poseAnimator.step2Desc')}</p>
                <div className="flex items-center gap-2 bg-neutral-800/50 p-1 rounded-lg mb-4">
                    <button onClick={() => setPoseSourceTab('upload')} className={cn('px-4 py-1 text-sm rounded-md transition-colors', poseSourceTab === 'upload' ? 'bg-neutral-200 text-black' : 'text-neutral-300 hover:bg-neutral-700/50')}>{t('poseAnimator.uploadTab')}</button>
                    <button onClick={() => setPoseSourceTab('draw')} className={cn('px-4 py-1 text-sm rounded-md transition-colors', poseSourceTab === 'draw' ? 'bg-neutral-200 text-black' : 'text-neutral-300 hover:bg-neutral-700/50')}>{t('poseAnimator.drawTab')}</button>
                    <button onClick={() => setPoseSourceTab('threeD')} className={cn('px-4 py-1 text-sm rounded-md transition-colors', poseSourceTab === 'threeD' ? 'bg-neutral-200 text-black' : 'text-neutral-300 hover:bg-neutral-700/50')}>{t('poseAnimator.threeDTab')}</button>
                </div>
                
                <div className="w-full max-w-4xl">
                    {poseSourceTab === 'upload' && (
                        <div className="w-full max-w-sm mx-auto">
                            {poseImage ? (
                                <div className="relative group aspect-[4/5] rounded-md overflow-hidden">
                                    <img src={poseImage} alt={t('poseAnimator.poseImage')} className="w-full h-full object-cover" />
                                    <button onClick={() => setPoseImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label={`Remove ${t('poseAnimator.poseImage')}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="pose-upload"
                                    className={cn("cursor-pointer aspect-[4/5] flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors", isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600")}
                                    onDrop={(e) => handleDrop(e, setPoseImage)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => handleDragEvents(e, true)}
                                    onDragLeave={(e) => handleDragEvents(e, false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-slate-400 font-semibold">{t('poseAnimator.dropImage')}</span>
                                    <span className="text-slate-500 text-sm mt-1">{t('poseAnimator.clickToUpload')}</span>
                                    <input id="pose-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handlePoseFileChange} />
                                </label>
                            )}
                        </div>
                    )}
                    {poseSourceTab === 'draw' && <div className="max-w-sm mx-auto"><DrawingCanvas onDrawingChange={setDrawnPose} /></div>}
                    {poseSourceTab === 'threeD' && <ThreeDeeCanvas onPoseChange={setThreeDeePose} />}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full flex justify-center mt-4"
            >
                <button
                    onClick={handleInitialAnimate}
                    disabled={isAnimateDisabled}
                    className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? t('poseAnimator.posingButton') : t('poseAnimator.poseButton')}
                </button>
            </motion.div>
        </div>
    );

     const renderResultView = () => (
         <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-3 gap-8">
                <ImageViewer title={t('poseAnimator.characterImage')} imageUrl={characterImage} />
                <ImageViewer title={t('poseAnimator.poseImage')} imageUrl={activePoseImage} />
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
                                 <p className="font-semibold mb-2">{t('poseAnimator.posingFailed')}</p>
                                 <p className="text-xs text-slate-400 mb-4">{error}</p>
                                 <button onClick={handleRegenerate} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                             </div>
                        )}
                        {generatedImage && <img src={generatedImage} alt="Posed result" className="w-full h-full object-contain" />}
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
                    onClick={handleRegenerate}
                    disabled={isLoading || !characterImage || !activePoseImage}
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
                    <button onClick={handleHeaderBack} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {view === 'character' ? t('common.backToTools') : t('common.goBack')}
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
                                <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 6L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M9 13L7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M15 13L17 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M5 11H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 11L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 11L15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </span>
                        {t('app.poseAnimatorTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('poseAnimator.subtitle')}</p>
                </div>

                {view === 'character' && renderCharacterStep()}
                {view === 'pose' && renderPoseStep()}
                {view === 'result' && renderResultView()}

            </motion.div>
        </main>
    );
}