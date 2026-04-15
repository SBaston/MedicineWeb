import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LanguageSelector from './LanguageSelector';

// Controles flotantes para páginas sin Navbar (Login, Register, etc.)
const DarkModeToggle = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1">
                <LanguageSelector />
            </div>
            <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="p-2.5 rounded-lg bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
            >
                {isDark
                    ? <Sun className="w-5 h-5 text-yellow-400" />
                    : <Moon className="w-5 h-5 text-gray-600" />
                }
            </button>
        </div>
    );
};

export default DarkModeToggle;
