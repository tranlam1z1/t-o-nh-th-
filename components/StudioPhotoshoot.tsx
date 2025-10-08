/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateStyledImage, generateBackgroundFromConcept, extractOutfitFromImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type Step = 'UPLOAD' | 'STUDIO';

interface GeneratedImageState {
    status: 'pending' | 'done' | 'error';
    url?: string;
    error?: string;
    poseId: string;
}

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
            <h3 className="font-bold text-2xl text-neutral-200 mb-1">{t(title)}</h3>
            <p className="text-neutral-300 text-sm mb-4 text-center">{t(description)}</p>
            {imageUrl ? (
                <div className="relative group aspect-[4/5] w-full max-w-sm rounded-md overflow-hidden mt-auto">
                    <img src={imageUrl} alt={t(title)} className="w-full h-full object-cover" />
                    <button onClick={onImageRemove} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label={`Remove ${t(title)}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ) : (
                <label htmlFor={inputId} className={cn("cursor-pointer aspect-[4/5] w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors mt-auto", isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600")} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-slate-400 font-semibold">{t('studioPhotoshoot.dropImage')}</span>
                    <span className="text-slate-500 text-sm mt-1">{t('studioPhotoshoot.clickToUpload')}</span>
                    <input id={inputId} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

const AssetViewer = ({ title, imageUrl, isLoading, error, onRetry }: { title: string, imageUrl: string | null, isLoading: boolean, error: string | null, onRetry?: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <p className="font-bold text-neutral-200">{t(title)}</p>
            <div className="w-full aspect-[4/5] object-cover rounded-lg bg-black/20 border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                {isLoading && (
                    <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {error && !isLoading && (
                    <div className="p-4 text-red-400">
                        <p className="font-semibold mb-2">{t('studioPhotoshoot.generationFailed')}</p>
                        <p className="text-xs text-slate-400 mb-4">{error}</p>
                        {onRetry && <button onClick={onRetry} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>}
                    </div>
                )}
                {imageUrl && !isLoading && !error && <img src={imageUrl} alt={t(title)} className="w-full h-full object-cover"/>}
            </div>
        </div>
    );
};

const ADULT_POSES = [
    { id: 'prof_arms_crossed', labelKey: 'studioPhotoshoot.poses.prof_arms_crossed', prompt: 'a confident, professional stance with arms crossed.' },
    { id: 'prof_presenting', labelKey: 'studioPhotoshoot.poses.prof_presenting', prompt: 'a professional presenting gesture with one open hand towards an imaginary chart.' },
    { id: 'prof_leaning_desk', labelKey: 'studioPhotoshoot.poses.prof_leaning_desk', prompt: 'casually leaning against the edge of a modern office desk.' },
    { id: 'prof_holding_tablet', labelKey: 'studioPhotoshoot.poses.prof_holding_tablet', prompt: 'holding and looking at a tablet computer with a thoughtful expression.' },
    { id: 'prof_walking', labelKey: 'studioPhotoshoot.poses.prof_walking', prompt: 'walking forward with a determined and confident expression.' },
    { id: 'prof_headshot', labelKey: 'studioPhotoshoot.poses.prof_headshot', prompt: 'a professional headshot from the chest up, with a friendly and approachable smile.' },
    { id: 'prof_sitting_chair', labelKey: 'studioPhotoshoot.poses.prof_sitting_chair', prompt: 'sitting in a modern office chair, leaning forward slightly as if in a meeting.' },
    { id: 'cas_laughing', labelKey: 'studioPhotoshoot.poses.cas_laughing', prompt: 'a candid moment, laughing genuinely and looking slightly away from the camera.' },
    { id: 'cas_walking_street', labelKey: 'studioPhotoshoot.poses.cas_walking_street', prompt: 'walking down a city street, looking thoughtfully to the side.' },
    { id: 'cas_sipping_coffee', labelKey: 'studioPhotoshoot.poses.cas_sipping_coffee', prompt: 'sitting at an outdoor cafe table, sipping a cup of coffee.' },
    { id: 'cas_leaning_wall', labelKey: 'studioPhotoshoot.poses.cas_leaning_wall', prompt: 'casually leaning against a rustic brick wall.' },
    { id: 'cas_hands_pockets', labelKey: 'studioPhotoshoot.poses.cas_hands_pockets', prompt: 'a relaxed stance with hands in their pockets.' },
    { id: 'cas_sitting_steps', labelKey: 'studioPhotoshoot.poses.cas_sitting_steps', prompt: 'sitting casually on outdoor concrete steps.' },
    { id: 'cas_over_shoulder', labelKey: 'studioPhotoshoot.poses.cas_over_shoulder', prompt: 'glancing back over their shoulder towards the camera with a smile.' },
    { id: 'cas_joyful_jump', labelKey: 'studioPhotoshoot.poses.cas_joyful_jump', prompt: 'captured mid-air in a joyful, energetic jump.' },
    { id: 'fas_low_angle', labelKey: 'studioPhotoshoot.poses.fas_low_angle', prompt: 'a dramatic, full-body shot taken from a very low angle.' },
    { id: 'fas_static_pose', labelKey: 'studioPhotoshoot.poses.fas_static_pose', prompt: 'a high-fashion, static, and slightly unconventional pose.' },
    { id: 'fas_twirling', labelKey: 'studioPhotoshoot.poses.fas_twirling', prompt: 'a dynamic shot captured mid-twirl, with clothing showing motion.' },
    { id: 'fas_lying_down', labelKey: 'studioPhotoshoot.poses.fas_lying_down', prompt: 'lying on their back or side on the ground, looking up at the camera.' },
    { id: 'fas_crouching', labelKey: 'studioPhotoshoot.poses.fas_crouching', prompt: 'a stylish crouching or squatting pose.' },
    { id: 'fas_back_to_camera', labelKey: 'studioPhotoshoot.poses.fas_back_to_camera', prompt: 'standing with their back to the camera, looking over one shoulder.' },
    { id: 'fas_shadow_play', labelKey: 'studioPhotoshoot.poses.fas_shadow_play', prompt: 'interacting with strong light and shadows, creating artistic patterns on them.' },
    { id: 'fas_silhouette', labelKey: 'studioPhotoshoot.poses.fas_silhouette', prompt: 'a powerful silhouette pose against a bright background.' },
    { id: 'act_yoga', labelKey: 'studioPhotoshoot.poses.act_yoga', prompt: 'holding a strong and balanced yoga pose, like the Warrior II pose.' },
    { id: 'act_stretching', labelKey: 'studioPhotoshoot.poses.act_stretching', prompt: 'in a dynamic pre-workout stretching pose.' },
    { id: 'act_jogging', labelKey: 'studioPhotoshoot.poses.act_jogging', prompt: 'in a natural jogging or running motion.' },
    { id: 'act_holding_ball', labelKey: 'studioPhotoshoot.poses.act_holding_ball', prompt: 'holding a basketball or soccer ball in a sporty, ready-to-play stance.' },
    { id: 'hob_reading', labelKey: 'studioPhotoshoot.poses.hob_reading', prompt: 'sitting comfortably in a chair, engrossed in reading a book.' },
    { id: 'hob_guitar', labelKey: 'studioPhotoshoot.poses.hob_guitar', prompt: 'sitting on a stool and playing an acoustic guitar.' },
    { id: 'hob_painting', labelKey: 'studioPhotoshoot.poses.hob_painting', prompt: 'standing in front of an easel with a paintbrush, focused on their artwork.' },
];

export default function StudioPhotoshoot({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [step, setStep] = useState<Step>('UPLOAD');
    // Uploaded images
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [conceptImage, setConceptImage] = useState<string | null>(null);
    
    // Generated assets
    const [extractedBackground, setExtractedBackground] = useState<string | null>(null);
    const [extractedOutfit, setExtractedOutfit] = useState<string | null>(null);
    
    // Generated final images
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImageState>>({});

    // Loading & Error states
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [isOutfitLoading, setIsOutfitLoading] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    
    const [backgroundError, setBackgroundError] = useState<string | null>(null);
    const [outfitError, setOutfitError] = useState<string | null>(null);
    
    // Compose options
    const [selectedPoses, setSelectedPoses] = useState<string[]>([]);

    useEffect(() => {
        // Clear results when pose selection changes after a generation
        if (Object.keys(generatedImages).length > 0) {
            setGeneratedImages({});
        }
    }, [selectedPoses]);


    const handleImageUpload = (file: File, setImage: (dataUrl: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => { setImage(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const handleStartOver = () => {
        setStep('UPLOAD');
        setCharacterImage(null);
        setConceptImage(null);
        setExtractedBackground(null);
        setExtractedOutfit(null);
        setGeneratedImages({});
        setIsBackgroundLoading(false);
        setIsOutfitLoading(false);
        setIsComposing(false);
        setBackgroundError(null);
        setOutfitError(null);
        setSelectedPoses([]);
    };

    const handleGenerateBackground = async () => {
        if (!conceptImage) return;
        setIsBackgroundLoading(true);
        setBackgroundError(null);
        try {
            const result = await generateBackgroundFromConcept(conceptImage);
            setExtractedBackground(result);
        } catch (err) {
            setBackgroundError(err instanceof Error ? err.message : "Background creation failed.");
        } finally {
            setIsBackgroundLoading(false);
        }
    };
    
    const handleGenerateOutfit = async () => {
        if (!conceptImage) return;
        setIsOutfitLoading(true);
        setOutfitError(null);
        try {
            const result = await extractOutfitFromImage(conceptImage);
            setExtractedOutfit(result);
        } catch (err) {
            setOutfitError(err instanceof Error ? err.message : "Outfit extraction failed.");
        } finally {
            setIsOutfitLoading(false);
        }
    };

    const handleGenerateAssets = () => {
        setStep('STUDIO');
        handleGenerateBackground();
        handleGenerateOutfit();
    };

    const handlePoseToggle = (poseId: string) => {
        setSelectedPoses(prev =>
            prev.includes(poseId)
                ? prev.filter(id => id !== poseId)
                : [...prev, poseId]
        );
    };

    const generateSingleImage = async (poseId: string) => {
        if (!characterImage || !extractedBackground || !extractedOutfit) return;

        const pose = ADULT_POSES.find(p => p.id === poseId);
        if (!pose) return;

        setGeneratedImages(prev => ({
            ...prev,
            [poseId]: { status: 'pending', poseId }
        }));
        
        try {
            const prompt = `
**PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION (NON-NEGOTIABLE)**
Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the person from the first image (the 'Character' image). The final generated face MUST be a photorealistic, 100% identical replica.

-   **FACIAL FEATURES ARE SACRED:** You must replicate the **exact** shape of the eyes, nose, mouth, jawline, chin, and overall facial structure.
-   **UNIQUE DETAILS ARE CRITICAL:** Preserve any unique identifiers like moles, freckles, scars, or specific skin textures. Do not remove or alter them.
-   **HAIR INTEGRITY:** Maintain the original hair color, style, and texture as closely as possible.

**SECONDARY TASK: COMPOSITION**
After satisfying the identity preservation rule, perform the following composition:
1.  **Place the Character:** Take the person (from the first image) and place them realistically into the background (the second image).
2.  **Apply the Outfit:** Dress the person in the outfit provided in the third image. The fit should be natural.
3.  **Apply the Pose:** The person's final pose should be: ${pose.prompt}.
4.  **Seamless Integration:** The lighting, shadows, and color grading on the person must be adjusted to perfectly match the new background and environment for a cohesive final photograph.
`;
            
            const resultUrl = await generateStyledImage(prompt, [characterImage, extractedBackground, extractedOutfit]);
            setGeneratedImages(prev => ({
                ...prev,
                [poseId]: { ...prev[poseId], status: 'done', url: resultUrl }
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Final image generation failed.";
            setGeneratedImages(prev => ({
                ...prev,
                [poseId]: { ...prev[poseId], status: 'error', error: errorMessage }
            }));
        }
    }

    const handleFinalGeneration = async () => {
        if (selectedPoses.length === 0) return;
        setIsComposing(true);

        const generationPromises = selectedPoses.map(poseId => generateSingleImage(poseId));
        await Promise.all(generationPromises);

        setIsComposing(false);
    };

    const handleDownload = (url: string | null | undefined, poseId: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `tracquoc-ai-studio-${poseId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const generateButtonText = () => {
        if (isComposing) return t('studioPhotoshoot.generatingFinalButton');
        const count = selectedPoses.length;
        if (count > 0) {
            return `${t('studioPhotoshoot.generateFinalButton')} (${count})`;
        }
        return t('studioPhotoshoot.generateFinalButton');
    };

    const renderUploadStep = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                <Uploader title='studioPhotoshoot.characterImage' description='studioPhotoshoot.characterImageDesc' imageUrl={characterImage} onImageUpload={(file) => handleImageUpload(file, setCharacterImage)} onImageRemove={() => setCharacterImage(null)} inputId="character-upload-adult" />
                <Uploader title='studioPhotoshoot.conceptImage' description='studioPhotoshoot.conceptImageDesc' imageUrl={conceptImage} onImageUpload={(file) => handleImageUpload(file, setConceptImage)} onImageRemove={() => setConceptImage(null)} inputId="concept-upload-adult" />
            </div>
            <button onClick={handleGenerateAssets} disabled={!characterImage || !conceptImage} className="w-full max-w-sm flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mt-8">
                {t('studioPhotoshoot.createAssetsButton')}
            </button>
        </div>
    );
    
    const renderStudioStep = () => (
        <div className="w-full flex flex-col items-center gap-12">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                {/* Assets */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
                    <AssetViewer title="studioPhotoshoot.assetCharacter" imageUrl={characterImage} isLoading={false} error={null} />
                    <AssetViewer title="studioPhotoshoot.assetBackground" imageUrl={extractedBackground} isLoading={isBackgroundLoading} error={backgroundError} onRetry={handleGenerateBackground} />
                    <AssetViewer title="studioPhotoshoot.assetOutfit" imageUrl={extractedOutfit} isLoading={isOutfitLoading} error={outfitError} onRetry={handleGenerateOutfit} />
                </div>
    
                {/* Poses & Generation */}
                <div className="flex flex-col gap-4 bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
                    <h3 className="font-bold text-xl text-neutral-200">{t('studioPhotoshoot.changePose')}</h3>
                    <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-2">
                        {ADULT_POSES.map(pose => (
                             <button
                                key={pose.id}
                                onClick={() => handlePoseToggle(pose.id)}
                                className={cn(
                                    'px-4 py-2 text-sm rounded-lg transition-colors',
                                    selectedPoses.includes(pose.id)
                                        ? 'bg-neutral-200 text-black font-bold'
                                        : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50'
                                )}
                            >
                                {t(pose.labelKey)}
                            </button>
                        ))}
                    </div>
                     <button onClick={handleFinalGeneration} disabled={isComposing || !extractedBackground || !extractedOutfit || selectedPoses.length === 0} className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                        {generateButtonText()}
                    </button>
                </div>
            </div>
    
            {/* Result Area */}
             {(Object.keys(generatedImages).length > 0 || (isComposing && selectedPoses.length > 0)) && (
                <div className="w-full flex flex-col items-center gap-4 mt-8">
                    <h2 className="text-4xl font-extrabold text-white">{t('studioPhotoshoot.finalResultTitle')}</h2>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(isComposing && Object.keys(generatedImages).length === 0 ? selectedPoses : Object.keys(generatedImages)).map(poseId => {
                            const imgState = generatedImages[poseId];
                            const pose = ADULT_POSES.find(p => p.id === poseId)!;
                            return (
                                <div key={poseId} className="relative group">
                                    <AssetViewer
                                        title={t(pose.labelKey)}
                                        imageUrl={imgState?.url ?? null}
                                        isLoading={!imgState || imgState.status === 'pending'}
                                        error={imgState?.error ?? null}
                                        onRetry={() => generateSingleImage(poseId)}
                                    />
                                    {imgState?.status === 'done' && imgState.url && (
                                        <button
                                            onClick={() => handleDownload(imgState.url, poseId)}
                                            className="absolute top-12 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label={t('common.download')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
             )}
        </div>
    );
    
    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center p-4 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-neutral-600 to-black opacity-20 rounded-full blur-3xl" />
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-7xl mx-auto flex flex-col items-center z-10">
                <header className="w-full flex justify-between items-center py-4 mb-6">
                    <button onClick={step === 'UPLOAD' ? onBack : handleStartOver} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {step === 'UPLOAD' ? t('common.backToTools') : t('common.startOver')}
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
                                <path d="M9 3H7C5.89543 3 5 3.89543 5 5V10C5 11.1046 5.89543 12 7 12H17C18.1046 12 19 11.1046 19 10V5C19 3.89543 18.1046 3 17 3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M14 17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </span>
                        {t('app.studioPhotoshootTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('studioPhotoshoot.subtitle')}</p>
                </div>

                {step === 'UPLOAD' && renderUploadStep()}
                {step === 'STUDIO' && renderStudioStep()}

            </motion.div>
        </main>
    );
}