import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ta' | 'ur';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    en: {
        welcome: 'Welcome Back!',
        subtitle: 'Sign in to continue your learning journey',
        student: 'Student',
        teacher: 'Teacher',
        email: 'Email Address',
        password: 'Password',
        forgot_password: 'Forgot password?',
        sign_in: 'Sign In',
        no_account: "Don't have an account?",
        create_account: 'Create Account',
        home: 'Home',
        profile: 'Profile',
        storage_usage: 'Storage Usage',
        app_language: 'App Language',
        account_info: 'Account Info',
        full_name: 'Full Name',
        role: 'Role',
        joined: 'Joined',
        settings: 'Settings',
        log_out: 'Log Out',
        edit_profile: 'Edit Profile',
        manage_storage: 'Manage Storage',
        view_breakdown: 'View file breakdown',
        // Storage Modal
        docs: 'Documents',
        video: 'Videos',
        image: 'Images',
        other: 'Others',
        total: 'total',
        used: 'used'
    },
    ta: { // Tamil
        welcome: 'மீண்டும் வருக!',
        subtitle: 'தொடர உள்நுழையவும்',
        student: 'மாணவர்',
        teacher: 'ஆசிரியர்',
        email: 'மின்னஞ்சல் முகவரி',
        password: 'கடவுச்சொல்',
        forgot_password: 'கடவுச்சொல் மறந்ததா?',
        sign_in: 'உள்நுழைய',
        no_account: 'கணக்கு இல்லையா?',
        create_account: 'கணக்கை உருவாக்கவும்',
        home: 'முகப்பு',
        profile: 'சுயவிவரம்',
        storage_usage: 'சேமிப்பு பயன்பாடு',
        app_language: 'பயன்பாட்டு மொழி',
        account_info: 'கணக்குத் தகவல்',
        full_name: 'முழு பெயர்',
        role: 'பங்கு',
        joined: 'இணைந்தது',
        settings: 'அமைப்புகள்',
        log_out: 'வெளியேறு',
        edit_profile: 'சுயவிவரத்தைத் திருத்து',
        manage_storage: 'சேமிப்பகத்தை நிர்வகி',
        view_breakdown: 'கோப்பு விவரங்களைக் காண்க',
        docs: 'ஆவணங்கள்',
        video: 'காணொளிகள்',
        image: 'படங்கள்',
        other: 'மற்றவை',
        total: 'மொத்தம்',
        used: 'பயன்படுத்தப்பட்டது'
    },
    ur: { // Urdu
        welcome: 'خوش آمدید!',
        subtitle: 'سیکھنے کا سفر جاری رکھنے کے لیے سائن ان کریں',
        student: 'طالب علم',
        teacher: 'استاد',
        email: 'ای میل',
        password: 'پاس ورڈ',
        forgot_password: 'پاس ورڈ بھول گئے؟',
        sign_in: 'سائن ان کریں',
        no_account: 'اکاؤنٹ نہیں ہے؟',
        create_account: 'اکاؤنٹ بنائیں',
        home: 'ہوم',
        profile: 'پروفائل',
        storage_usage: 'اسٹوریج کا استعمال',
        app_language: 'ایپ کی زبان',
        account_info: 'اکاؤنٹ کی معلومات',
        full_name: 'پورا نام',
        role: 'کردار',
        joined: 'شامل ہوئے',
        settings: 'ترتیبات',
        log_out: 'لاگ آؤٹ',
        edit_profile: 'پروفائل میں ترمیم کریں',
        manage_storage: 'اسٹوریج کا انتظام',
        view_breakdown: 'فائل کی تفصیلات دیکھیں',
        docs: 'دستاویزات',
        video: 'ویڈیوز',
        image: 'تصاویر',
        other: 'دیگر',
        total: 'کل',
        used: 'استعمال شدہ'
    },
    hi: { // Hindi (Placeholder logic for brevity, filling basic)
        welcome: 'वापसी पर स्वागत है!',
        subtitle: 'जारी रखने के लिए साइन इन करें',
        student: 'छात्र',
        teacher: 'शिक्षक',
        email: 'ईमेल पता',
        password: 'पासवर्ड',
        forgot_password: 'पासवर्ड भूल गए?',
        sign_in: 'साइन इन करें',
        no_account: 'खाता नहीं है?',
        create_account: 'खाता बनाएं',
        home: 'होम',
        profile: 'प्रोफाइल',
        storage_usage: 'भंडारण उपयोग',
        app_language: 'ऐप भाषा',
        account_info: 'खाता जानकारी',
        full_name: 'पूरा नाम',
        role: 'भूमिका',
        joined: 'शामिल हुए',
        settings: 'सेटिंग्स',
        log_out: 'लॉग आउट',
        edit_profile: 'प्रोफाइल संपादित करें',
        manage_storage: 'भंडारण प्रबंधित करें',
        view_breakdown: 'फ़ाइल विवरण देखें',
        docs: 'दस्तावेज़',
        video: 'वीडियो',
        image: 'छवियां',
        other: 'अन्य',
        total: 'कुल',
        used: 'उपयोग किया गया'
    },
    es: { welcome: '¡Bienvenido de nuevo!', student: 'Estudiante', teacher: 'Profesor', home: 'Inicio', profile: 'Perfil' }, // Partial for others
    fr: { welcome: 'Bon retour!', student: 'Étudiant', teacher: 'Enseignant', home: 'Accueil', profile: 'Profil' },
    de: { welcome: 'Willkommen zurück!', student: 'Student', teacher: 'Lehrer', home: 'Startseite', profile: 'Profil' },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');

    // Load saved language on mount
    React.useEffect(() => {
        const loadLang = async () => {
            const saved = await AsyncStorage.getItem('appLanguage');
            if (saved) setLanguageState(saved as Language);
        };
        loadLang();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await AsyncStorage.setItem('appLanguage', lang);
    };

    const t = (key: string) => {
        const langDict = translations[language] as any || translations['en'];
        return langDict[key] || translations['en'][key as keyof typeof translations['en']] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
