import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LogOut, BookOpen, ChevronDown, Sun, Moon, Menu, X, Info, LifeBuoy } from 'lucide-react';
import LanguageSelector from '../LanguageSelector';
import UserAvatar from '../UserAvatar';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/nexussalud-logo1.jpg';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { isDark, toggleTheme }           = useTheme();
    const { t }                             = useLanguage();
    const navigate                          = useNavigate();
    const location                          = useLocation();

    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileOpen,   setMobileOpen]   = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handle = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setShowDropdown(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Cerrar menú móvil al cambiar de ruta
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // Bloquear scroll cuando el menú móvil está abierto
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) =>
        location.pathname === path
            ? 'text-primary-600 dark:text-primary-400 font-semibold'
            : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400';

    return (
        <>
            <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm dark:shadow-gray-800 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="container-custom">
                    <div className="flex justify-between items-center h-18 py-3">

                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2.5 shrink-0">
                            <img
                                src={logo}
                                alt="NexusSalud"
                                className="h-12 w-12 object-contain rounded-xl"
                            />
                            <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
                                NexusSalud
                            </span>
                        </Link>

                        {/* Links desktop */}
                        <div className="hidden md:flex items-center space-x-1">
                            {/* Links públicos — siempre visibles */}
                            {user?.role !== 'Admin' && (
                                <Link
                                    to="/professionals"
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/professionals')}`}
                                >
                                    {t('nav.professionals')}
                                </Link>
                            )}

                            {!isAuthenticated && (
                                <>
                                    <Link
                                        to="/about"
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/about')}`}
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                        Sobre nosotros
                                    </Link>
                                    <Link
                                        to="/courses"
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/courses')}`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Cursos
                                    </Link>
                                    <Link
                                        to="/support"
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/support')}`}
                                    >
                                        <LifeBuoy className="w-3.5 h-3.5" />
                                        Soporte
                                    </Link>
                                </>
                            )}

                            {/* Links autenticados */}
                            {isAuthenticated && (user?.role === 'Patient' || user?.role === 'Doctor') && (
                                <Link
                                    to="/courses"
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/courses')}`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {t('nav.courses')}
                                </Link>
                            )}
                        </div>

                        {/* Controles derecha */}
                        <div className="flex items-center space-x-2">
                            {/* Idioma */}
                            <div className="hidden sm:block">
                                <LanguageSelector />
                            </div>

                            {/* Modo oscuro */}
                            <button
                                onClick={toggleTheme}
                                title={isDark ? 'Modo claro' : 'Modo oscuro'}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {isDark
                                    ? <Sun  className="w-4 h-4 text-yellow-400" />
                                    : <Moon className="w-4 h-4 text-gray-600"   />
                                }
                            </button>

                            {/* Usuario autenticado */}
                            {isAuthenticated ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl px-2.5 py-1.5 transition-colors"
                                    >
                                        <UserAvatar user={user} size="md" />
                                        <div className="hidden md:block text-left">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                                                {user?.firstName || user?.fullName || 'Usuario'}
                                                {user?.lastName && ` ${user.lastName}`}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {user?.role === 'Patient'   ? t('nav.roles.patient')
                                                : user?.role === 'Doctor'   ? t('nav.roles.doctor')
                                                : user?.isSuperAdmin        ? t('nav.roles.superAdmin')
                                                :                             t('nav.roles.admin')}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in">
                                            <Link
                                                to={
                                                    user?.role === 'Admin'  ? '/admin' :
                                                    user?.role === 'Doctor' ? '/doctor/dashboard' :
                                                    '/dashboard'
                                                }
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <UserAvatar user={user} size="sm" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('nav.myProfile')}</p>
                                                    <p className="text-xs text-gray-400">{t('nav.viewDashboard')}</p>
                                                </div>
                                            </Link>

                                            {user?.role === 'Patient' && (
                                                <Link
                                                    to="/profile/edit"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    {t('nav.editProfile')}
                                                </Link>
                                            )}

                                            <hr className="my-2 border-gray-100 dark:border-gray-700" />
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
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link to="/login"    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">{t('nav.login')}</Link>
                                    <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm">{t('nav.register')}</Link>
                                </div>
                            )}

                            {/* Hamburger móvil */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Abrir menú"
                            >
                                {mobileOpen
                                    ? <X    className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                    : <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Menú móvil ─────────────────────────────────── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Panel deslizante */}
                    <div className="absolute top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slide-right">
                        {/* Cabecera panel */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">Menú</span>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Links */}
                        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                            {user?.role !== 'Admin' && (
                                <Link to="/professionals" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                    Profesionales
                                </Link>
                            )}
                            <Link to="/courses" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                <BookOpen className="w-4 h-4" /> Cursos
                            </Link>
                            {!isAuthenticated && (
                                <>
                                    <Link to="/about" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                        <Info className="w-4 h-4" /> Sobre nosotros
                                    </Link>
                                    <Link to="/support" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                        <LifeBuoy className="w-4 h-4" /> Soporte
                                    </Link>
                                </>
                            )}

                            {isAuthenticated && (
                                <>
                                    <hr className="my-2 border-gray-100 dark:border-gray-800" />
                                    <Link
                                        to={user?.role === 'Admin' ? '/admin' : user?.role === 'Doctor' ? '/doctor/dashboard' : '/dashboard'}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                    >
                                        Mi panel
                                    </Link>
                                    {user?.role === 'Patient' && (
                                        <Link to="/profile/edit" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                            Editar perfil
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>

                        {/* Footer panel */}
                        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                            <div className="flex items-center justify-between mb-3">
                                <LanguageSelector />
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {isDark
                                        ? <Sun  className="w-4 h-4 text-yellow-400" />
                                        : <Moon className="w-4 h-4 text-gray-600"   />
                                    }
                                </button>
                            </div>

                            {isAuthenticated ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-colors hover:bg-red-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.logout')}
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link to="/login"    className="text-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">{t('nav.login')}</Link>
                                    <Link to="/register" className="text-center px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">{t('nav.register')}</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
