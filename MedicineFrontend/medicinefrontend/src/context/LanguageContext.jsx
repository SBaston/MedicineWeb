import { createContext, useContext, useState } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

// Resolver clave anidada: t('nav.login') → translations.es.nav.login
function resolve(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'es';
    });

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    // Función de traducción: t('nav.login') devuelve el string traducido
    const t = (key) => resolve(translations[language], key);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
