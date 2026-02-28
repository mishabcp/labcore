"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import en from "./en.json";
import ml from "./ml.json";

type Language = "en" | "ml";
type Translations = typeof en;

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries: Record<Language, Translations> = { en, ml };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        // Try to load language preference from localStorage on mount
        const saved = localStorage.getItem("languagePref") as Language;
        if (saved && (saved === "en" || saved === "ml")) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = async (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("languagePref", lang);
        try {
            // Sync with backend if user is logged in
            const token = localStorage.getItem("accessToken");
            if (token) {
                await api.patch("/auth/language", { languagePref: lang });
            }
        } catch (e) {
            console.error("Failed to sync language preference", e);
        }
    };

    const t = (key: string): string => {
        const keys = key.split(".");
        let value: any = dictionaries[language];
        for (const k of keys) {
            if (value === undefined) return key;
            value = value[k];
        }
        return value || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
