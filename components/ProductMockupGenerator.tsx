/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, DragEvent } from 'react';
import { motion } from 'framer-motion';
import { generateGraphicFromPrompt, generateApparelMockup, generateProductMockup } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

type View = 'config' | 'result';
type DesignSource = 'upload' | 'ai';
type MockupStyle = 'hanging' | 'flatLay' | 'folded';
type ApparelSource = 'ai' | 'upload';

interface GeneratedImageState {
    status: 'pending' | 'done' | 'error';
    url?: string;
    error?: string;
}

const Uploader = ({ onImageUpload, imageUrl }: { onImageUpload: (file: File) => void, imageUrl?: string | null }) => {
    const { t } = useLanguage();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) onImageUpload(e.target.files[0]); };
    const handleDrop = (e: DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) onImageUpload(e.dataTransfer.files[0]); };
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(enter); };

    return (
        <label htmlFor="design-upload" className={cn("cursor-pointer h-48 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors p-4", imageUrl ? 'border-green-500/50' : (isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600"))} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}>
            {imageUrl ? <img src={imageUrl} alt="Design Preview" className="max-h-full h-full object-contain" /> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span className="text-slate-400 font-semibold text-center">{t('productMockupGenerator.uploadDesign')}</span></>}
            <input id="design-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

const MockupUploader = ({ onImageUpload, imageUrl }: { onImageUpload: (file: File) => void, imageUrl?: string | null }) => {
    const { t } = useLanguage();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) onImageUpload(e.target.files[0]); };
    const handleDrop = (e: DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) onImageUpload(e.dataTransfer.files[0]); };
    const handleDragEvents = (e: DragEvent<HTMLElement>, enter: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(enter); };

    return (
        <div className="flex flex-col gap-2">
            <label className="font-bold text-neutral-300">{t('productMockupGenerator.uploadApparelMockup')}</label>
            <label htmlFor="mockup-upload" className={cn("cursor-pointer h-48 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors p-4", imageUrl ? 'border-green-500/50' : (isDragOver ? "border-neutral-500 bg-black/40" : "border-neutral-700 bg-black/20 hover:border-neutral-600"))} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}>
                {imageUrl ? <img src={imageUrl} alt="Mockup Preview" className="max-h-full h-full object-contain" /> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span className="text-slate-400 font-semibold text-center">{t('productMockupGenerator.uploadApparelMockup')}</span></>}
                <input id="mockup-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </label>
            <p className="text-xs text-neutral-500 mt-1">{t('productMockupGenerator.apparelMockupDesc')}</p>
        </div>
    );
};


const ResultCard = ({ title, color, result, onRetry, onDownload }: { title: string, color?: string, result: GeneratedImageState, onRetry: () => void, onDownload: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 mb-2">
                {color && <div className="w-6 h-6 rounded border border-neutral-500" style={{ backgroundColor: color }}></div>}
                <h3 className="font-bold text-lg text-neutral-200">{title}</h3>
            </div>
            <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden group">
                {result.status === 'pending' && <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {result.status === 'error' && <div className="p-4 text-red-400"><p className="font-semibold mb-2">{t('productMockupGenerator.generationFailed')}</p><p className="text-xs text-slate-400 mb-4">{result.error}</p><button onClick={onRetry} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button></div>}
                {result.status === 'done' && result.url && <img src={result.url} alt={`Mockup in ${color}`} className="w-full h-full object-contain" />}
                {result.status === 'done' && result.url && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onDownload} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75" aria-label={t('common.download')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        <button onClick={onRetry} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75" aria-label={t('common.regenerate')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" /></svg></button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ProductMockupGenerator({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<View>('config');
    // Inputs
    const [designSource, setDesignSource] = useState<DesignSource>('upload');
    const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
    const [aiDesignPrompt, setAiDesignPrompt] = useState('');
    const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
    // Settings
    const [apparelSource, setApparelSource] = useState<ApparelSource>('ai');
    const [uploadedMockup, setUploadedMockup] = useState<string | null>(null);
    const [colorways, setColorways] = useState<string[]>(['#FFFFFF', '#18181b']);
    const [newColor, setNewColor] = useState('');
    const [apparelDescription, setApparelDescription] = useState('');
    const [mockupStyle, setMockupStyle] = useState<MockupStyle>('flatLay');
    // Results
    const [results, setResults] = useState<Record<string, GeneratedImageState>>({});
    const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
    const [designError, setDesignError] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedDesign(reader.result as string);
            setDesignSource('upload');
            setDesignError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleMockupUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedMockup(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateDesign = async () => {
        if (!aiDesignPrompt) return;
        setIsGeneratingDesign(true);
        setUploadedDesign(null);
        setDesignError(null);
        try {
            const resultUrl = await generateGraphicFromPrompt(aiDesignPrompt);
            setUploadedDesign(resultUrl);
            setDesignSource('ai');
        } catch (err) {
            setDesignError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsGeneratingDesign(false);
        }
    };
    
    const handleAddColor = (e?: React.FormEvent) => {
        e?.preventDefault();
        
        let sanitizedColor = newColor.trim();
        if (sanitizedColor && !sanitizedColor.startsWith('#')) {
            sanitizedColor = '#' + sanitizedColor;
        }
        
        const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

        if (
            sanitizedColor &&
            hexColorRegex.test(sanitizedColor) &&
            !colorways.map(c => c.toLowerCase()).includes(sanitizedColor.toLowerCase())
        ) {
            setColorways([...colorways, sanitizedColor]);
            setNewColor('');
        }
    };

    const handleRemoveColor = (colorToRemove: string) => {
        setColorways(colorways.filter(color => color !== colorToRemove));
    };

    const handleGenerateSingleAI = async (color: string) => {
        if (!uploadedDesign) return;
        setResults(prev => ({ ...prev, [color]: { status: 'pending' } }));
        
        try {
            let finalApparelPrompt = apparelDescription || t('productMockupGenerator.apparelStylePlaceholder');
            finalApparelPrompt += ` The main color of the apparel should be ${color}.`;
            finalApparelPrompt += ` The mockup style should be a ${mockupStyle} view.`;

            const resultUrl = await generateApparelMockup(uploadedDesign, finalApparelPrompt);
            setResults(prev => ({ ...prev, [color]: { status: 'done', url: resultUrl } }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setResults(prev => ({ ...prev, [color]: { status: 'error', error: message } }));
        }
    };

    const handleGenerateMockups = async () => {
        if (!uploadedDesign) return;

        if (apparelSource === 'ai') {
            if (colorways.length === 0) return;
            setIsGeneratingMockups(true);
            setView('result');
            const initialResults: Record<string, GeneratedImageState> = {};
            colorways.forEach(color => { initialResults[color] = { status: 'pending' }; });
            setResults(initialResults);
            await Promise.all(colorways.map(color => handleGenerateSingleAI(color)));
            setIsGeneratingMockups(false);
        } else { // 'upload'
            if (!uploadedMockup) return;
            setIsGeneratingMockups(true);
            setView('result');
            const key = 'custom_mockup';
            setResults({ [key]: { status: 'pending' }});
            try {
                const resultUrl = await generateProductMockup(uploadedDesign, uploadedMockup);
                setResults({ [key]: { status: 'done', url: resultUrl } });
            } catch (err) {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setResults({ [key]: { status: 'error', error: message } });
            }
            setIsGeneratingMockups(false);
        }
    };


    const handleStartOver = () => {
        setView('config');
        setUploadedDesign(null);
        setAiDesignPrompt('');
        setApparelSource('ai');
        setUploadedMockup(null);
        setColorways(['#FFFFFF', '#18181b']);
        setApparelDescription('');
        setMockupStyle('flatLay');
        setResults({});
        setDesignError(null);
    };

    const handleDownload = (url: string | undefined, key: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `tracquoc-ai-mockup-${key.replace('#', '')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerateDisabled = (isGeneratingMockups || !uploadedDesign) || (apparelSource === 'ai' && colorways.length === 0) || (apparelSource === 'upload' && !uploadedMockup);
    const generateButtonText = isGeneratingMockups 
        ? t('productMockupGenerator.generatingMockups') 
        : (apparelSource === 'ai' 
            ? t('productMockupGenerator.generateColorways', colorways.length)
            : t('productMockupGenerator.generateMockups'));


    const renderConfigView = () => (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                {/* Left Column: Inputs */}
                <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                    <h3 className="font-bold text-2xl text-neutral-200">{t('productMockupGenerator.inputs')}</h3>
                    <Uploader onImageUpload={handleImageUpload} imageUrl={uploadedDesign} />
                    <div className="flex items-center gap-4 my-2">
                        <hr className="flex-grow border-neutral-700" />
                        <span className="text-neutral-500 font-bold text-sm">OR</span>
                        <hr className="flex-grow border-neutral-700" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-neutral-300">{t('productMockupGenerator.aiGraphicDesigner')}</label>
                        <textarea value={aiDesignPrompt} onChange={(e) => setAiDesignPrompt(e.target.value)} placeholder={t('productMockupGenerator.aiGraphicDesignerPlaceholder')} rows={3} className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:ring-2 focus:ring-neutral-500 transition" />
                        <button onClick={handleGenerateDesign} disabled={isGeneratingDesign || !aiDesignPrompt} className="w-full flex items-center justify-center gap-2 text-black font-bold py-2 px-4 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            {isGeneratingDesign ? t('productMockupGenerator.generating') : t('productMockupGenerator.generateWithAI')}
                        </button>
                        {designError && <p className="text-xs text-red-400 mt-2">{t('productMockupGenerator.generationFailed')}: {designError}</p>}
                    </div>
                </div>
                {/* Right Column: Settings */}
                <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
                    <h3 className="font-bold text-2xl text-neutral-200">{t('productMockupGenerator.designSettings')}</h3>
                    
                    {/* Apparel Details */}
                    <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                        <h4 className="font-bold text-lg text-neutral-200">{t('productMockupGenerator.apparelDetails')}</h4>
                        <div className="flex items-center gap-2 bg-neutral-800/50 p-1 rounded-lg my-3">
                            <button onClick={() => setApparelSource('ai')} className={cn('w-full px-4 py-1 text-sm rounded-md transition-colors', apparelSource === 'ai' ? 'bg-neutral-200 text-black' : 'text-neutral-300 hover:bg-neutral-700/50')}>{t('productMockupGenerator.generateWithAI')}</button>
                            <button onClick={() => setApparelSource('upload')} className={cn('w-full px-4 py-1 text-sm rounded-md transition-colors', apparelSource === 'upload' ? 'bg-neutral-200 text-black' : 'text-neutral-300 hover:bg-neutral-700/50')}>{t('productMockupGenerator.uploadMockup')}</button>
                        </div>

                        {apparelSource === 'ai' ? (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="font-bold text-neutral-300">{t('productMockupGenerator.apparelStyle')}</label>
                                    <textarea value={apparelDescription} onChange={(e) => setApparelDescription(e.target.value)} placeholder={t('productMockupGenerator.apparelStylePlaceholder')} rows={3} className="w-full bg-neutral-800 border border-neutral-600 rounded-md p-2 mt-1 text-neutral-200 focus:ring-2 focus:ring-neutral-500 transition" />
                                    <p className="text-xs text-neutral-500 mt-1">{t('productMockupGenerator.apparelStyleDesc')}</p>
                                </div>
                                <div>
                                    <label className="font-bold text-neutral-300">{t('productMockupGenerator.mockupStyle')}</label>
                                    <div className="flex gap-2 mt-2">
                                        {(['hanging', 'flatLay', 'folded'] as MockupStyle[]).map(style => <button key={style} onClick={() => setMockupStyle(style)} className={cn('px-4 py-2 text-sm rounded-md transition-colors w-full', mockupStyle === style ? 'bg-neutral-200 text-black font-bold' : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50')}>{t(`productMockupGenerator.${style}`)}</button>)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <MockupUploader onImageUpload={handleMockupUpload} imageUrl={uploadedMockup} />
                        )}
                    </div>

                     {/* Colorway Generator */}
                     {apparelSource === 'ai' && (
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                            <h4 className="font-bold text-lg text-neutral-200">{t('productMockupGenerator.colorwayGenerator')}</h4>
                            <p className="text-sm text-neutral-400 mb-3">{t('productMockupGenerator.colorwayGeneratorDesc')}</p>
                            <form onSubmit={handleAddColor} className="flex gap-2">
                                <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder={t('productMockupGenerator.hexPlaceholder')} className="flex-grow bg-neutral-800 border border-neutral-600 rounded-md p-2 text-neutral-200 focus:ring-2 focus:ring-neutral-500 transition" />
                                <button type="submit" className="flex-shrink-0 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-md transition-colors">{t('productMockupGenerator.add')}</button>
                            </form>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {colorways.map(color => (
                                    <div key={color} className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1 text-sm">
                                        <div className="w-4 h-4 rounded-full border border-neutral-500" style={{ backgroundColor: color }} />
                                        <span className="font-mono">{color}</span>
                                        <button onClick={() => handleRemoveColor(color)} className="text-neutral-500 hover:text-white">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={handleGenerateMockups} disabled={isGenerateDisabled} className="w-full max-w-md flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mt-4">
                {generateButtonText}
            </button>
        </div>
    );

    const renderResultView = () => {
        const resultKeys = apparelSource === 'ai' ? colorways : (results['custom_mockup'] ? ['custom_mockup'] : []);
        
        return (
            <div className="w-full flex flex-col items-center gap-8">
                <h2 className="text-4xl font-extrabold text-white">{t('productMockupGenerator.resultsTitle')}</h2>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                     {resultKeys.map(key => {
                        const isCustom = key === 'custom_mockup';
                        return (
                            <ResultCard 
                                key={key}
                                title={isCustom ? t('productMockupGenerator.customMockup') : key}
                                color={isCustom ? undefined : key}
                                result={results[key]}
                                onRetry={() => isCustom ? handleGenerateMockups() : handleGenerateSingleAI(key)}
                                onDownload={() => handleDownload(results[key]?.url, key)}
                           />
                        )
                     })}
                </div>
                <button onClick={handleStartOver} className="font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white mt-8">{t('common.startOver')}</button>
            </div>
        );
    }
    
    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center p-4 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-neutral-600 to-black opacity-20 rounded-full blur-3xl" /></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-7xl mx-auto flex flex-col items-center z-10">
                <header className="w-full flex justify-between items-center py-4 mb-6">
                    <button onClick={view === 'config' ? onBack : handleStartOver} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {view === 'config' ? t('common.backToTools') : t('common.startOver')}
                    </button>
                    <div className="flex items-center gap-4"><p className="text-sm text-neutral-400 hidden sm:block">{t('common.poweredByGemini')}</p><LanguageSwitcher /></div>
                </header>
                <div className="text-center mb-10">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2 flex items-center justify-center gap-4 tracking-tight">
                        <span className="text-neutral-300">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5C4 4.44772 4.44772 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 8L13.65 11.3L17 12L13.65 12.7L12 16L10.35 12.7L7 12L10.35 11.3L12 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        {t('app.apparelMockupStudioTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('productMockupGenerator.subtitle')}</p>
                </div>
                {view === 'config' ? renderConfigView() : renderResultView()}
            </motion.div>
        </main>
    );
}