/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, DragEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { generateStyledImage } from '../services/geminiService';
import { cn, cropImageToAspectRatio } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { createPrintSheet } from '../lib/printUtils';

type Gender = 'male' | 'female';
type Attire = 'shirt' | 'vest' | 'pioneer_scarf' | 'ao_dai' | 'office_wear' | 'polo' | 'blouse' | 't_shirt';
type Hair = 'neat' | 'short' | 'long' | 'fashion' | 'tied_back';
type Background = 'blue' | 'white' | 'gray';
type PrintSize = '2x3' | '3x4' | '4x6' | '3.5x4.5' | '5x5';
type View = 'config' | 'result';
type Expression = 'original' | 'smile' | 'serious';

const GENDER_OPTIONS: { id: Gender, labelKey: string }[] = [
    { id: 'female', labelKey: 'portraitGenerator.female' },
    { id: 'male', labelKey: 'portraitGenerator.male' },
];

const EXPRESSION_OPTIONS: { id: Expression, labelKey: string }[] = [
    { id: 'original', labelKey: 'portraitGenerator.expressionOriginal' },
    { id: 'smile', labelKey: 'portraitGenerator.expressionSmile' },
    { id: 'serious', labelKey: 'portraitGenerator.expressionSerious' },
];

const ATTIRE_OPTIONS: { id: Attire, labelKey: string }[] = [
    { id: 'shirt', labelKey: 'portraitGenerator.shirt' },
    { id: 'polo', labelKey: 'portraitGenerator.polo' },
    { id: 'blouse', labelKey: 'portraitGenerator.blouse' },
    { id: 't_shirt', labelKey: 'portraitGenerator.t_shirt' },
    { id: 'vest', labelKey: 'portraitGenerator.vest' },
    { id: 'office_wear', labelKey: 'portraitGenerator.office_wear' },
    { id: 'pioneer_scarf', labelKey: 'portraitGenerator.pioneer_scarf' },
    { id: 'ao_dai', labelKey: 'portraitGenerator.ao_dai' },
];

const HAIR_OPTIONS: { id: Hair, labelKey: string }[] = [
    { id: 'neat', labelKey: 'portraitGenerator.neat' },
    { id: 'short', labelKey: 'portraitGenerator.short' },
    { id: 'long', labelKey: 'portraitGenerator.long' },
    { id: 'tied_back', labelKey: 'portraitGenerator.tied_back' },
    { id: 'fashion', labelKey: 'portraitGenerator.fashion' },
];

const BACKGROUND_OPTIONS: { id: Background, labelKey: string }[] = [
    { id: 'blue', labelKey: 'portraitGenerator.blue' },
    { id: 'white', labelKey: 'portraitGenerator.white' },
    { id: 'gray', labelKey: 'portraitGenerator.gray' },
];

const PRINT_SIZE_OPTIONS: { value: PrintSize, label: string }[] = [
    { value: '2x3', label: '2x3' },
    { value: '3x4', label: '3x4' },
    { value: '4x6', label: '4x6' },
    { value: '3.5x4.5', label: '3.5x4.5' },
    { value: '5x5', label: '5x5' },
];


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
            htmlFor="portrait-upload"
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
            <span className="text-slate-400 font-semibold">{t('portraitGenerator.dropImage')}</span>
            <span className="text-slate-500 text-sm mt-1">{t('portraitGenerator.clickToUpload')}</span>
            <input id="portrait-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

const ImageViewer = ({ title, imageUrl, children }: { title: string, imageUrl: string | null, children?: React.ReactNode }) => {
    return (
        <div className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col w-full">
            <h3 className="font-bold text-2xl text-neutral-200 mb-4">{title}</h3>
            <div className="aspect-[4/5] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : null}
                {children}
            </div>
        </div>
    )
}

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

const OptionsGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <h4 className="font-bold text-neutral-300 mb-2">{label}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {children}
        </div>
    </div>
);


export default function PortraitGenerator({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<View>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [printSheet, setPrintSheet] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingSheet, setIsCreatingSheet] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Options
    const [gender, setGender] = useState<Gender>('female');
    const [attire, setAttire] = useState<Attire>('shirt');
    const [hair, setHair] = useState<Hair>('neat');
    const [background, setBackground] = useState<Background>('blue');
    const [printSize, setPrintSize] = useState<PrintSize>('3x4');
    const [expression, setExpression] = useState<Expression>('serious');

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            setUploadedImage(imageDataUrl);
            setGeneratedImage(null);
            setPrintSheet(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };
    
    const handleStartOver = () => {
        setUploadedImage(null);
        setGeneratedImage(null);
        setPrintSheet(null);
        setError(null);
        setView('config');
    }

    const handleGoBackToConfig = () => {
        setGeneratedImage(null);
        setPrintSheet(null);
        setError(null);
        setView('config');
    };

    const handleGenerate = async () => {
        if (!uploadedImage) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setPrintSheet(null);
        setView('result');

        let attireDesc = '';
        switch (attire) {
            case 'shirt': attireDesc = `a simple, neat collared shirt`; break;
            case 'polo': attireDesc = 'a classic polo shirt'; break;
            case 'blouse': attireDesc = 'a simple and elegant blouse'; break;
            case 't_shirt': attireDesc = 'a plain, solid-colored t-shirt with no logos or graphics'; break;
            case 'vest': attireDesc = `a professional business suit (e.g., blazer or vest with a collared shirt)`; break;
            case 'office_wear': attireDesc = `professional and smart office wear`; break;
            case 'pioneer_scarf': attireDesc = 'a white school shirt with a red pioneer scarf (khăn quàng đỏ)'; break;
            case 'ao_dai': attireDesc = 'a traditional white Vietnamese Ao Dai'; break;
        }

        const genderHint = `The style of clothing should be appropriate for a ${gender}.`;
        let hairDesc = `The person's hair should be styled to be ${hair}. The hair must be neat, tidy, and combed away from the face to ensure all facial features are clearly visible. The style should be appropriate for the person in the image.`;
        
        let expressionDesc = `The person's expression must be neutral and serious (mouth closed, eyes open).`;
        if (expression === 'smile') {
            expressionDesc = `The person's expression must be a gentle, soft, closed-mouth smile. The expression must look natural and professional for an ID photo.`;
        } else if (expression === 'original') {
            expressionDesc = `The person's expression should be preserved from the original photo as much as possible, while still being appropriate for a professional ID photo (e.g., a neutral expression or a soft, closed-mouth smile).`;
        }

        const backgroundColorMap = {
            blue: 'studio blue',
            white: 'pure white',
            gray: 'light grey'
        };

        const DPI = 300;
        const CM_TO_INCH = 1 / 2.54;
        const [wCm, hCm] = printSize.split('x').map(Number);
        const targetWidthPx = Math.round(wCm * CM_TO_INCH * DPI);
        const targetHeightPx = Math.round(hCm * CM_TO_INCH * DPI);
        const targetAspectRatio = wCm / hCm;

        const dimensionInstruction = `The final output image MUST be a high-resolution image with precise dimensions of ${targetWidthPx} pixels wide by ${targetHeightPx} pixels tall (this corresponds to a ${wCm}x${hCm}cm photo at 300 DPI).`;

        const prompt = `
            **RULE 1: ENFORCE DIMENSIONS & ASPECT RATIO (NON-NEGOTIABLE)**
            ${dimensionInstruction}

            **RULE 2: ABSOLUTE IDENTITY LOCK (NON-NEGOTIABLE)**
            The single most important rule is to preserve the person's identity from the original photo. The generated face MUST be 100% identical and instantly recognizable.
            - DO NOT CHANGE FACIAL FEATURES: Replicate the exact shape of eyes, nose, mouth, jawline, and facial structure.
            - DO NOT CHANGE AGE: The person's age is a fixed fact. If the requested attire (e.g., a pioneer scarf) is associated with a different age group, you MUST render that attire on the original person without making them look younger or older. The age and face are locked.

            **MISSION: Create a professional ID photo, following the rules below ONLY AFTER satisfying the above rules.**

            1.  **Head Pose Correction:** The person must be rendered looking **directly forward at the camera**. Their face must be fully visible, symmetrical, and centered.

            2.  **Expression:** ${expressionDesc}

            3.  **Attire:** Dress the **person in the image** in ${attireDesc}. ${genderHint}

            4.  **Hair Style:** ${hairDesc}

            5.  **Background:** Place the person against a completely smooth, solid, professional-grade ${backgroundColorMap[background]} background. No shadows or textures.

            **FINAL CHECK:** The output must be a high-resolution, head-and-shoulders portrait with dimensions of exactly ${targetWidthPx}x${targetHeightPx} pixels. Confirm again: Is the face identical to the original? If not, the task is a failure.
        `;

        try {
            const croppedImageDataUrl = await cropImageToAspectRatio(uploadedImage, targetAspectRatio);
            const resultUrl = await generateStyledImage(prompt, [croppedImageDataUrl]);
            setGeneratedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGeneratePrintSheet = async () => {
        if (!generatedImage) return;
        setIsCreatingSheet(true);
        try {
            const [width, height] = printSize.split('x').map(Number);
            const sheetUrl = await createPrintSheet(generatedImage, width, height);
            setPrintSheet(sheetUrl);
        } catch (err) {
            setError(err instanceof Error ? `Sheet creation failed: ${err.message}` : "An unknown error occurred while creating the print sheet.");
            console.error(err);
        } finally {
            setIsCreatingSheet(false);
        }
    }

    const handleDownload = (url: string | null, filename: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerateDisabled = !uploadedImage || isLoading;

    const renderConfigView = () => (
        <div className="w-full grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
                <h3 className="font-bold text-2xl text-neutral-200 mb-1">{t('portraitGenerator.uploadTitle')}</h3>
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
                <h3 className="font-bold text-2xl text-neutral-200 mb-2">{t('portraitGenerator.optionsTitle')}</h3>
                <OptionsGroup label={t('portraitGenerator.gender')}>
                    {GENDER_OPTIONS.map(opt => <OptionButton key={opt.id} label={t(opt.labelKey)} isSelected={gender === opt.id} onClick={() => setGender(opt.id)} />)}
                </OptionsGroup>
                <OptionsGroup label={t('portraitGenerator.expressionTitle')}>
                    {EXPRESSION_OPTIONS.map(opt => <OptionButton key={opt.id} label={t(opt.labelKey)} isSelected={expression === opt.id} onClick={() => setExpression(opt.id)} />)}
                </OptionsGroup>
                <OptionsGroup label={t('portraitGenerator.attire')}>
                    {ATTIRE_OPTIONS.map(opt => <OptionButton key={opt.id} label={t(opt.labelKey)} isSelected={attire === opt.id} onClick={() => setAttire(opt.id)} />)}
                </OptionsGroup>
                <OptionsGroup label={t('portraitGenerator.hairStyle')}>
                    {HAIR_OPTIONS.map(opt => <OptionButton key={opt.id} label={t(opt.labelKey)} isSelected={hair === opt.id} onClick={() => setHair(opt.id)} />)}
                </OptionsGroup>
                <OptionsGroup label={t('portraitGenerator.background')}>
                    {BACKGROUND_OPTIONS.map(opt => <OptionButton key={opt.id} label={t(opt.labelKey)} isSelected={background === opt.id} onClick={() => setBackground(opt.id)} />)}
                </OptionsGroup>
                <OptionsGroup label={t('portraitGenerator.printSize')}>
                    {PRINT_SIZE_OPTIONS.map(opt => <OptionButton key={opt.value} label={opt.label} isSelected={printSize === opt.value} onClick={() => setPrintSize(opt.value)} />)}
                </OptionsGroup>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? t('portraitGenerator.generatingButton') : t('portraitGenerator.generateButton')}
                </button>
            </div>
        </div>
    );

    const renderResultView = () => (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full grid md:grid-cols-2 gap-8">
                <ImageViewer title={t('common.original')} imageUrl={uploadedImage} />
                <ImageViewer title={t('portraitGenerator.resultTitle')} imageUrl={generatedImage}>
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
                            <p className="font-semibold mb-2">{t('portraitGenerator.generationFailed')}</p>
                            <p className="text-xs text-slate-400 mb-4">{error}</p>
                            <button onClick={handleGenerate} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                        </div>
                    )}
                </ImageViewer>
            </div>

            {generatedImage && (
                <div className="w-full max-w-2xl flex flex-col items-center gap-4 bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
                     <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        <button
                            onClick={() => handleDownload(generatedImage, `portrait-${printSize}.jpg`)}
                            disabled={!generatedImage || isLoading}
                            className="w-full flex items-center justify-center gap-2 text-black font-bold py-3 px-5 rounded-lg bg-neutral-200/80 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {t('common.download')}
                        </button>
                        <button
                            onClick={handleGeneratePrintSheet}
                            disabled={!generatedImage || isLoading || isCreatingSheet}
                            className="w-full flex items-center justify-center gap-2 font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-5 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingSheet ? t('portraitGenerator.generatingPrintSheet') : t('portraitGenerator.generatePrintSheet')}
                        </button>
                    </div>

                    {printSheet && (
                        <div className="w-full mt-4">
                            <h3 className="font-bold text-xl text-neutral-200 mb-4 text-center">{t('portraitGenerator.printSheetTitle')}</h3>
                            <div className="aspect-[6/4] w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                                <img src={printSheet} alt="Print Sheet" className="w-full h-full object-contain" />
                            </div>
                            <button
                                onClick={() => handleDownload(printSheet, 'print-sheet-4x6.jpg')}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white transition-all duration-300 transform hover:scale-105"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                {t('portraitGenerator.downloadSheet')}
                            </button>
                        </div>
                    )}
                     <button 
                        onClick={handleStartOver}
                        className="mt-6 font-bold text-center text-neutral-400 hover:text-white transition-colors"
                    >
                        {t('common.startOver')}
                    </button>
                </div>
            )}
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
                                <path d="M19 2H5C3.9 2 3 2.9 3 4V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2ZM9.5 6C10.88 6 12 7.12 12 8.5C12 9.88 10.88 11 9.5 11C8.12 11 7 9.88 7 8.5C7 7.12 8.12 6 9.5 6ZM17 18H7V17C7 15.67 9.67 15 12 15C14.33 15 17 15.67 17 17V18Z" fill="currentColor"/>
                           </svg>
                        </span>
                        {t('app.portraitGeneratorTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('portraitGenerator.subtitle')}</p>
                </div>

                {view === 'config' ? renderConfigView() : renderResultView()}

            </motion.div>
        </main>
    );
}
