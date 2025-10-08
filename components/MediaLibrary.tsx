/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function MediaLibrary() {
    const { t } = useLanguage();
    const { libraryImages, removeImagesFromLibrary, clearLibrary, selectImageForTool } = useMediaLibrary();
    const [isOpen, setIsOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const toggleImageSelection = (imageUrl: string) => {
        setSelectedImages(prev =>
            prev.includes(imageUrl)
                ? prev.filter(img => img !== imageUrl)
                : [...prev, imageUrl]
        );
    };

    const handleImageClick = (imageUrl: string) => {
        if (selectionMode) {
            toggleImageSelection(imageUrl);
        } else {
            selectImageForTool(imageUrl);
            setIsOpen(false);
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(t('mediaLibrary.confirmDeleteSelected'))) {
            removeImagesFromLibrary(selectedImages);
            setSelectedImages([]);
            setSelectionMode(false);
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm(t('mediaLibrary.confirmDeleteAll'))) {
            clearLibrary();
            setSelectedImages([]);
            setSelectionMode(false);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedImages([]);
    };

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-neutral-200 rounded-full shadow-lg flex items-center justify-center text-black hover:bg-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={t('mediaLibrary.title')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-neutral-900 border border-neutral-700 rounded-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <header className="p-4 border-b border-neutral-800 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-2xl font-bold text-neutral-100">{t('mediaLibrary.title')}</h2>
                                <div className="flex items-center gap-4">
                                    <button onClick={toggleSelectionMode} className="text-sm font-semibold text-neutral-300 bg-neutral-700/50 px-3 py-1 rounded-md hover:bg-neutral-700">
                                        {selectionMode ? t('mediaLibrary.cancel') : t('mediaLibrary.select')}
                                    </button>
                                    {selectionMode ? (
                                        <button onClick={handleDeleteSelected} disabled={selectedImages.length === 0} className="text-sm font-semibold text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {t('mediaLibrary.deleteSelected')} ({selectedImages.length})
                                        </button>
                                    ) : (
                                        <button onClick={handleDeleteAll} disabled={libraryImages.length === 0} className="text-sm font-semibold text-neutral-300 hover:text-red-400 disabled:opacity-50">
                                            {t('mediaLibrary.deleteAll')}
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </header>

                            {/* Body */}
                            <div className="flex-grow p-4 overflow-y-auto">
                                {libraryImages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-center text-neutral-500">
                                        <p>{t('mediaLibrary.emptyMessage')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {libraryImages.map((imgUrl) => (
                                            <div
                                                key={imgUrl}
                                                onClick={() => handleImageClick(imgUrl)}
                                                className={cn(
                                                    "relative group aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                                                    selectionMode ? "ring-2 ring-offset-2 ring-offset-neutral-900" : "hover:scale-105",
                                                    selectedImages.includes(imgUrl) ? "ring-neutral-200" : "ring-transparent"
                                                )}
                                            >
                                                <img src={imgUrl} className="w-full h-full object-cover" alt={`Library image`} />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {selectionMode && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-black/50">
                                                        {selectedImages.includes(imgUrl) && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}