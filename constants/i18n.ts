import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// Import translations
import en from '../locales/en.json';
import ta from '../locales/ta.json';

// Initialize i18n
const i18n = new I18n({
    en,
    ta
});

// Set default locale based on device settings
i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';
i18n.enableFallback = true;

export default i18n;
