import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LogOut, Calendar, BookOpen, ChevronDown, Sun, Moon } from 'lucide-react';
import LanguageSelector from '../LanguageSelector';
import UserAvatar from '../UserAvatar';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/nexussalud-logo1.jpg';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="container-custom">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3">
                        <img
                            src={logo}
                            alt="NexusSalud Logo"
                            className="h-16 w-16 object-contain rounded-xl"
                        />
                        <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">NexusSalud</span>
                    </Link>

                    {/* Links de navegación */}
                    <div className="hidden md:flex items-center space-x-8">
                        {user?.role !== 'Admin' && (
                            <Link
                                to="/professionals"
                                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                            >
                                {t('nav.professionals')}
                            </Link>
                        )}

                        {isAuthenticated && user?.role === 'Patient' && (
                            <>
                                <Link
                                    to="/appointments"
                                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors flex items-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {t('nav.appointments')}
                                </Link>
                                <Link
                                    to="/courses"
                                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    {t('nav.courses')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Botones de usuario */}
                    <div className="flex items-center space-x-3">

                        {/* Selector de idioma */}
                        <LanguageSelector />

                        {/* Botón modo oscuro */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? 'Modo claro' : 'Modo oscuro'}
                            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            {isDark
                                ? <Sun className="w-5 h-5 text-yellow-400" />
                                : <Moon className="w-5 h-5 text-gray-600" />
                            }
                        </button>

                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
                                >
                                    <UserAvatar user={user} size="md" />
                                    <div className="hidden md:block text-left">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {user?.firstName || user?.fullName || 'Usuario'}
                                            {user?.lastName && ` ${user.lastName}`}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {user?.role === 'Patient' ? t('nav.roles.patient')
                                                : user?.role === 'Doctor' ? t('nav.roles.doctor')
                                                    : user?.isSuperAdmin ? t('nav.roles.superAdmin') : t('nav.roles.admin')}
                                        </p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                        <Link
                                            to={
                                                user?.role === 'Admin' ? '/admin' :
                                                    user?.role === 'Doctor' ? '/doctor/dashboard' :
                                                        '/dashboard'
                                            }
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <UserAvatar user={user} size="sm" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t('nav.myProfile')}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.viewDashboard')}</p>
                                            </div>
                                        </Link>

                                        {user?.role === 'Patient' && (
                                            <>
                                                <Link
                                                    to="/profile/edit"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    {t('nav.editProfile')}
                                                </Link>
                                                <Link
                                                    to="/appointments"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    {t('nav.myAppointments')}
                                                </Link>
                                            </>
                                        )}

                                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={() => { setShowDropdown(false); handleLogout(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="btn-outline">{t('nav.login')}</Link>
                                <Link to="/register" className="btn-primary">{t('nav.register')}</Link>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;