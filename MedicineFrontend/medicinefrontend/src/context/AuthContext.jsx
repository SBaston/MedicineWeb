import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    // Función para cargar datos completos del usuario
    const loadUserProfile = async (basicUser) => {
        try {
            // Si es paciente, cargar su perfil completo
            if (basicUser.role === 'Patient') {
                const response = await api.get('/patients/me');
                const profileData = response.data;
                const patient = profileData.patient || profileData;

                return {
                    ...basicUser,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    profilePictureUrl: patient.profilePictureUrl,
                    fullName: `${patient.firstName} ${patient.lastName}`,
                };
            }

            // ✅ Si es doctor, cargar su perfil completo
            if (basicUser.role === 'Doctor') {
                try {
                    const response = await api.get('/doctor/profile');
                    const doctor = response.data;

                    return {
                        ...basicUser,
                        firstName: doctor.firstName || 'Doctor',
                        lastName: doctor.lastName || 'User',
                        fullName: `${doctor.firstName || 'Doctor'} ${doctor.lastName || 'User'}`,
                        professionalLicense: doctor.professionalLicense,
                        profilePictureUrl: doctor.profilePictureUrl,
                        yearsOfExperience: doctor.yearsOfExperience,
                        pricePerSession: doctor.pricePerSession,
                    };
                } catch (error) {
                    // Si falla la carga del perfil, devolver datos básicos
                    console.warn('No se pudo cargar el perfil del doctor, usando datos básicos');
                    return {
                        ...basicUser,
                        firstName: 'Doctor',
                        lastName: 'User',
                        fullName: 'Doctor User',
                    };
                }
            }

            // Si es admin
            if (basicUser.role === 'Admin') {
                const response = await api.get('/admin/me');
                const admin = response.data;

                return {
                    ...basicUser,
                    fullName: admin.fullName,
                    department: admin.department,
                    isSuperAdmin: admin.isSuperAdmin,
                };
            }

            return basicUser;
        } catch (error) {
            console.error('Error al cargar perfil del usuario:', error);
            return basicUser;
        }
    };

    // Cargar usuario al montar el componente
    useEffect(() => {
        const initializeUser = async () => {
            const basicUser = authService.getCurrentUser();
            if (basicUser) {
                const fullUser = await loadUserProfile(basicUser);
                setUser(fullUser);
            }
            setLoading(false);
        };

        initializeUser();
    }, []);

    const login = async (email, password) => {
        const basicUserData = await authService.login(email, password);
        const fullUserData = await loadUserProfile(basicUserData);
        setUser(fullUserData);
        return fullUserData;
    };

    const register = async (data) => {
        const basicUserData = await authService.register(data);
        const fullUserData = await loadUserProfile(basicUserData);
        setUser(fullUserData);
        return fullUserData;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        // Limpiar toda la caché de TanStack Query para que el próximo
        // usuario que inicie sesión no vea datos del anterior
        queryClient.clear();
    };

    // Función para actualizar el usuario (útil después de editar perfil)
    const refreshUser = async () => {
        const basicUser = authService.getCurrentUser();
        if (basicUser) {
            const fullUser = await loadUserProfile(basicUser);
            setUser(fullUser);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isDoctor: user?.role === 'Doctor',
        isPatient: user?.role === 'Patient',
        isAdmin: user?.role === 'Admin',
        isSuperAdmin: user?.role === 'Admin' && user?.isSuperAdmin === true,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};