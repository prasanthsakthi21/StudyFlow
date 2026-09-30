import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = {
    name: string;
    type: 'dark' | 'light';
    gradient: string[]; // For Header Gradients
    background: string;  // Main Page Background
    card: string;        // Card/Item Background
    text: string;        // Primary Text Color
    textSecondary: string; // Subtitles
    primary: string;     // Primary Action/Icon Color
    border: string;      // Borders/Dividers
    input: string;       // Input Fields
    statusBar: 'light' | 'dark';
    fonts: {
        regular: string;
        medium: string;
        bold: string;
        extraBold: string;
    };
};

const SHARED_FONTS = {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    bold: 'Outfit_700Bold',
    extraBold: 'Outfit_800ExtraBold',
};

// --- PREMIUM THEME DEFINITIONS ---
export const THEMES: Record<string, ThemeType> = {
    CYBER: {
        name: 'Cyber Future',
        type: 'dark',
        gradient: ['#0f172a', '#1e1b4b', '#312e81'],
        background: '#020617',
        card: '#111827',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        primary: '#38bdf8', // Sky Blue
        border: '#1e293b',
        input: '#1f2937',
        statusBar: 'light',
        fonts: SHARED_FONTS
    },
    MIDNIGHT: {
        name: 'Midnight Glass',
        type: 'dark',
        gradient: ['#000000', '#1c1c1c'],
        background: '#000000',
        card: '#121212',
        text: '#ffffff',
        textSecondary: '#a3a3a3',
        primary: '#32D74B', // Neon Green
        border: '#27272a',
        input: '#18181b',
        statusBar: 'light',
        fonts: SHARED_FONTS
    },
    OCEANIC: {
        name: 'Oceanic Breeze',
        type: 'light',
        gradient: ['#0ea5e9', '#2563eb'],
        background: '#f0f9ff',
        card: '#ffffff',
        text: '#0f172a',
        textSecondary: '#64748b',
        primary: '#0284c7',
        border: '#e0f2fe',
        input: '#e0f2fe',
        statusBar: 'dark',
        fonts: SHARED_FONTS
    },
    SUNSET: {
        name: 'Sunset Vibes',
        type: 'dark',
        gradient: ['#f97316', '#db2777'],
        background: '#450a0a',
        card: '#290707',
        text: '#fff1f2',
        textSecondary: '#fda4af',
        primary: '#fbbf24', // Amber
        border: '#881337',
        input: '#52050a',
        statusBar: 'light',
        fonts: SHARED_FONTS
    },
    ELEGANT: {
        name: 'Elegant White',
        type: 'light',
        gradient: ['#e2e8f0', '#cbd5e1'],
        background: '#f8fafc',
        card: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        primary: '#475569',
        border: '#e2e8f0',
        input: '#f1f5f9',
        statusBar: 'dark',
        fonts: SHARED_FONTS
    }
};

type ThemeContextType = {
    theme: ThemeType;
    setThemeName: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: THEMES.CYBER,
    setThemeName: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [themeName, setTheme] = useState('CYBER');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('appTheme');
                if (storedTheme && THEMES[storedTheme]) {
                    setTheme(storedTheme);
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            }
        };
        loadTheme();
    }, []);

    const setThemeName = async (name: string) => {
        if (THEMES[name]) {
            setTheme(name);
            await AsyncStorage.setItem('appTheme', name);
        }
    };

    const theme = THEMES[themeName] || THEMES.CYBER;

    return (
        <ThemeContext.Provider value={{ theme, setThemeName }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
