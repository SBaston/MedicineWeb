import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../translations';

const LanguageSelector = () => {
    const { language, changeLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const current = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                title="Cambiar idioma / Change language"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
                <span className="text-base leading-none">{current.flag}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                    {current.code}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => { changeLanguage(lang.code); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                                ${language === lang.code
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
