import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, LogOut, Calendar, BookOpen, ChevronDown } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
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
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container-custom">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <Heart className="w-8 h-8 text-primary-600" />
                        <span className="text-2xl font-bold text-primary-600">MediCare</span>
                    </Link>

                    {/* Links de navegación */}
                    <div className="hidden md:flex items-center space-x-8">

                        {/* Reemplaza "Doctores" + "Especialidades" con una sola pestaña */}
                        <Link
                            to="/professionals"
                            className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                        >
                            Profesionales
                        </Link>

                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/appointments"
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Mis Citas
                                </Link>
                                <Link
                                    to="/courses"
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Cursos
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Botones de usuario */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                                >
                                    <UserAvatar user={user} size="md" />
                                    <div className="hidden md:block text-left">
                                        <p className="font-medium text-gray-900 text-sm">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {user?.role === 'Patient' ? 'Paciente'
                                                : user?.role === 'Doctor' ? 'Profesional'
                                                    : 'Admin'}
                                        </p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <UserAvatar user={user} size="sm" />
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">Mi perfil</p>
                                                <p className="text-xs text-gray-500">Ver dashboard</p>
                                            </div>
                                        </Link>
                                        <Link
                                            to="/profile/edit"
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Editar perfil
                                        </Link>
                                        {user?.role === 'Patient' && (
                                            <Link
                                                to="/appointments"
                                                onClick={() => setShowDropdown(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Mis citas
                                            </Link>
                                        )}
                                        <hr className="my-2" />
                                        <button
                                            onClick={() => { setShowDropdown(false); handleLogout(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
                                <Link to="/register" className="btn-primary">Registrarse</Link>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;