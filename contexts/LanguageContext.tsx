/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../lib/translations';

type Language = 'en' | 'vi';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string,
    ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('vi');

    const t = (key: string, ...args: any[]): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                return key; // Return the key itself if not found
            }
        }

        if (typeof result === 'string') {
            if (args.length > 0) {
                return result.replace(/{(\d+)}/g, (match, number) => {
                    return typeof args[number] !== 'undefined' ? args[number] : match;
                });
            }
            return result;
        }

        return key; // Return the key if the result is not a string
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
