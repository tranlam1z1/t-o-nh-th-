/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { removeObjectFromImage } from '../services/geminiService';
import { cn } from '../lib/utils';

export default function ObjectRemover({ onBack }: { onBack: () => void }) {
    const { t } = useLanguage();
    const [view, setView] = useState<'config' | 'result'>('config');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);
    const [maskExists, setMaskExists] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setGeneratedImage(null);
            setError(null);
            clearCanvas();
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const image = imageRef.current;
        if (!canvas || !container || !image) return;

        const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
        const imageAspectRatio = image.naturalWidth / image.naturalHeight;
        
        let canvasWidth = containerWidth;
        let canvasHeight = containerWidth / imageAspectRatio;

        if (canvasHeight > containerHeight) {
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * imageAspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }, []);

    useEffect(() => {
        const image = imageRef.current;
        if (image) {
            const loadImageAndResize = () => {
                if (image.complete) {
                    resizeCanvas();
                } else {
                    image.onload = resizeCanvas;
                }
            };
            loadImageAndResize();
            window.addEventListener('resize', resizeCanvas);
            return () => {
                window.removeEventListener('resize', resizeCanvas);
                if (image) {
                    image.onload = null;
                }
            };
        }
    }, [uploadedImage, resizeCanvas]);


    const getCoords = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (tool === 'brush') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // semi-transparent white
        } else {
            ctx.globalCompositeOperation = 'destination-out';
        }
        
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if(canvas) {
            const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
            setMaskExists(pixelBuffer.some(color => color !== 0));
        }
    };

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setMaskExists(false);
        }
    }, []);

    const getMaskedImageDataUrl = useCallback(async (): Promise<string | null> => {
        if (!uploadedImage) return null;
        
        const originalImage = new Image();
        originalImage.src = uploadedImage;
        await new Promise((resolve, reject) => {
             originalImage.onload = resolve;
             originalImage.onerror = reject;
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImage.naturalWidth;
        tempCanvas.height = originalImage.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error("Could not create temporary canvas context");

        tempCtx.drawImage(originalImage, 0, 0);
        tempCtx.globalCompositeOperation = 'destination-out';
        const maskCanvas = canvasRef.current;
        if(maskCanvas) {
            tempCtx.drawImage(maskCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        return tempCanvas.toDataURL('image/png');
    }, [uploadedImage]);

    const handleRemove = async () => {
        if (!uploadedImage || !maskExists) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setView('result');

        try {
            const maskedImageDataUrl = await getMaskedImageDataUrl();
            if (!maskedImageDataUrl) {
                throw new Error("Could not process image mask.");
            }
            
            const resultUrl = await removeObjectFromImage(maskedImageDataUrl);
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
        setGeneratedImage(null);
        setError(null);
        setView('config');
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'tracquoc-ai-removed.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isRemoveDisabled = !uploadedImage || !maskExists || isLoading;

    const renderConfigView = () => (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            <div className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center gap-4">
                <div ref={containerRef} className="w-full relative rounded-lg overflow-hidden flex items-center justify-center min-h-[50vh] max-h-[70vh]">
                    {uploadedImage ? (
                        <>
                            <img ref={imageRef} src={uploadedImage} alt="Upload" className="max-w-full max-h-full object-contain" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }} />
                            <canvas
                                ref={canvasRef}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </>
                    ) : (
                        <label htmlFor="image-upload" className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center text-center text-neutral-500 border-2 border-dashed border-neutral-700 rounded-lg p-8 cursor-pointer hover:border-neutral-500 hover:bg-black/40 transition-colors" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="text-lg font-bold text-neutral-400">{t('objectRemover.waitingForImage')}</p>
                            <p className="font-bold text-neutral-300">{t('objectRemover.dragAndDrop')}</p>
                            <p>{t('objectRemover.clickToSelect')}</p>
                            <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                        </label>
                    )}
                </div>
            </div>

            <div className="w-full bg-black/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg flex flex-col">
                <h3 className="font-bold text-2xl text-neutral-200 mb-4">{t('objectRemover.controls')}</h3>
                <div className={cn("flex-grow flex flex-col space-y-4", !uploadedImage && "opacity-50 pointer-events-none")}>
                    <p className="text-neutral-300">{t('objectRemover.instructions')}</p>
                     <div className="flex-shrink-0 bg-neutral-900/70 rounded-lg p-3 flex items-center justify-between gap-4 flex-wrap mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTool('brush')} className={cn("p-2 rounded-md flex items-center gap-2", tool === 'brush' ? 'bg-neutral-200 text-black' : 'bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg> {t('objectRemover.brush')}</button>
                            <button onClick={() => setTool('eraser')} className={cn("p-2 rounded-md flex items-center gap-2", tool === 'eraser' ? 'bg-neutral-200 text-black' : 'bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg> {t('objectRemover.eraser')}</button>
                        </div>
                        <div className="flex-grow flex items-center gap-2 text-sm text-neutral-300 min-w-[150px]">
                            <label htmlFor="brush-size" className="whitespace-nowrap">{t('objectRemover.brushSize')}:</label>
                            <input id="brush-size" type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <button onClick={clearCanvas} className="p-2 rounded-md bg-red-500/80 hover:bg-red-500 text-white transition-colors text-sm font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> {t('objectRemover.clear')}</button>
                    </div>
                </div>
                <button
                    onClick={handleRemove}
                    disabled={isRemoveDisabled}
                    className="w-full mt-auto flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? t('objectRemover.removing') : t('objectRemover.remove')}
                </button>
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
                     <h3 className="font-bold text-2xl text-neutral-200 mb-4 text-center">{t('objectRemover.removedResult')}</h3>
                    <div className="aspect-square w-full bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-center relative overflow-hidden">
                        {isLoading && <svg className="animate-spin h-10 w-10 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {error && !isLoading && (
                            <div className="p-4 text-red-400">
                                <p className="font-semibold mb-2">{t('objectRemover.removalFailed')}</p>
                                <p className="text-xs text-slate-400 mb-4">{error}</p>
                                <button onClick={handleRemove} className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-md hover:bg-red-500/40">{t('common.retry')}</button>
                            </div>
                        )}
                        {generatedImage && !isLoading && (
                            <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" />
                        )}
                    </div>
                </div>
            </div>

             <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                <button onClick={handleDownload} disabled={!generatedImage || isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 text-black font-bold py-3 px-6 rounded-lg bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('common.download')}
                </button>
                 <button onClick={() => setView('config')} className="font-bold text-center text-neutral-300 bg-black/20 backdrop-blur-sm border-2 border-neutral-700 py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-800 hover:text-white">
                    {t('common.goBack')}
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
                    <button onClick={view === 'config' ? onBack : handleStartOver} className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {view === 'config' ? t('common.backToTools') : t('common.startOver')}
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
                                <path d="M16.24 3.56c-.39-.39-1.02-.39-1.41 0L8 10.41l-1.83 1.83c-.39.39-.39 1.02 0 1.41l2.83 2.83c.39.39 1.02.39 1.41 0L17 9.83l1.83-1.83c.39-.39.39-1.02 0-1.41l-2.59-2.59zM19.31 9.24l-3.54 3.54-4.24-4.24 3.54-3.54 4.24 4.24zM4 21h12v-2H4v2z" fill="currentColor"/>
                            </svg>
                        </span>
                        {t('app.objectRemoverTitle')}
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 mt-2">{t('objectRemover.subtitle')}</p>
                </div>
                
                {view === 'config' ? renderConfigView() : renderResultView()}
                
            </motion.div>
        </main>
    );
}