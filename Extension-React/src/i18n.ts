import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import universalLanguageDetect from "@unly/universal-language-detector";
import browser from 'webextension-polyfill';

import langNames from "@/json/language_names.json";

export const languages = Object.keys(langNames);
export const languageNames: Record<string, string> = langNames;

const fallbackLanguage = "en";
const systemLanguage = universalLanguageDetect({
    supportedLanguages: languages, // Whitelist of supported languages, will be used to filter out languages that aren't supported
    fallbackLanguage: "en", // Fallback language in case the user's language cannot be resolved
});
export let storedLanguage: string;
let hasLanguageBeenSwitched = false;

const saveLanguage = (lang: string): void => {
    browser.storage.sync.set({
        language: lang,
        hasBeenSwitched: true
    }).then(() => {
        storedLanguage = lang;
        hasLanguageBeenSwitched = true;
    });
};

export const getLanguage: Promise<string> = browser.storage.sync.get(['language', 'hasBeenSwitched']).then((data) => {
    hasLanguageBeenSwitched = data.hasBeenSwitched as boolean || false as boolean;
    
    if (!hasLanguageBeenSwitched) {
        console.log("[Syrup] First time use, clearing language settings");
        browser.storage.sync.clear();
        storedLanguage = systemLanguage;
        saveLanguage(storedLanguage);
    } else {
        storedLanguage = data.language as string;
        console.log("[Syrup] Using previously set language:", storedLanguage);
    }

    return storedLanguage;
});

export const initializeI18n = async () => {
    const language = (await getLanguage) || systemLanguage;

    const options = {
        loadPath: "/_locales/{{lng}}/translation.json",
    };
    const backend = new Backend(null, options);

    await i18n
        // load translations using http from /public/_locales
        .use(backend)
        // passes i18n to react-i18next
        .use(initReactI18next)
        .init({
            lng: language,
            fallbackLng: fallbackLanguage,
            interpolation: {
                escapeValue: false,
            },
        });
};

initializeI18n();

export const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng).then(() => {
        console.log("[Syrup] Language switched to", lng);
        saveLanguage(lng);
    });
};

export default i18n;
