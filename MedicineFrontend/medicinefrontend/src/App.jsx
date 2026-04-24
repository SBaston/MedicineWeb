import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import EditProfilePage from './pages/EditProfilePage';
import ProfessionalsPage from './pages/ProfessionalPage';
import AdminDashboard from './pages/AdminDashboard';
import CreateAdminPage from './pages/CreateAdminPage';
import AdminSpecialtiesPage from './pages/AdminSpecialtiesPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import DoctorDashboard from './pages/DoctorDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AvailabilitySettingsPage from './pages/AvailabilitySettingsPage';
import UploadVideosPage from './pages/UploadVideosPage';
import EarningsPage from './pages/EarningsPage';
import CreateCoursePage from './pages/CreateCoursePage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import PricingPage from './pages/PricingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import DoctorMyCoursesPage from './pages/DoctorMyCoursesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import AboutPage from './pages/AboutPage';
import SupportPage from './pages/SupportPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


const SuperAdminRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" />;

    // Verificar que sea Admin Y SuperAdmin
    if (user?.role !== 'Admin' || !user?.isSuperAdmin) {
        return <Navigate to="/admin" />;
    }

    return children;
};

// Crear cliente de React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos
        },
    },
});

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" />;

    // Verificar roles si se especifican
    if (allowedRoles && !allowedRoles.includes(user?.role))
        return <Navigate to="/" />;

    return children;
};

// Layout principal
const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ThemeProvider>
                <LanguageProvider>
                <AuthProvider>
                    <Routes>
                        {/* Rutas públicas */}
                        <Route
                            path="/"
                            element={
                                <Layout>
                                    <HomePage />
                                </Layout>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['Admin']}>
                                    <Layout>
                                        <AdminDashboard />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        // Dentro de tus rutas protegidas de admin:
                        {/*<Route*/}
                        {/*    path="/admin/videos" element={*/}
                        {/*        <ProtectedRoute allowedRoles={['Admin']}>*/}
                        {/*            <Layout>*/}
                        {/*                <AdminVideosManagement />*/}
                        {/*            </Layout>*/}
                        {/*        </ProtectedRoute>*/}
                        {/*    }*/}
                        {/*/>*/}

                        {/* Crear Admin - SOLO SuperAdmin puede acceder */}
                        <Route
                            path="/admin/create"
                            element={
                                <SuperAdminRoute>
                                    <Layout>
                                        <CreateAdminPage />
                                    </Layout>
                                </SuperAdminRoute>
                            }
                        />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        {/* Nueva ruta única que reemplaza /doctors y /specialties */}
                        <Route path="/professionals"
                            element={<Layout><ProfessionalsPage /></Layout>} />
                        <Route
                            path="/doctor/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <Layout>
                                        <DoctorDashboard />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Doctor: Completar perfil */}
                        <Route
                            path="/doctor/profile/complete"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <CompleteProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Doctor: Ver perfil */}
                        <Route
                            path="/doctor/profile"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <DoctorProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Configurar disponibilidad */}
                        <Route
                            path="/doctor/appointments"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <AvailabilitySettingsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Subir vídeos */}
                        <Route
                            path="/doctor/videos"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <UploadVideosPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/doctor/videos/upload"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <UploadVideosPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Ingresos */}
                        <Route
                            path="/doctor/earnings"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <EarningsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Crear curso */}
                        <Route
                            path="/doctor/courses"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <CreateCoursePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Configurar precios */}
                        <Route
                            path="/doctor/pricing"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <PricingPage />
                                </ProtectedRoute>
                            }
                        />
                        {/* Redirigir las rutas antiguas por si alguien tiene un enlace guardado */}
                        <Route path="/doctors" element={<Navigate to="/professionals" replace />} />
                        <Route path="/specialties" element={<Navigate to="/professionals" replace />} />
                        {/* Rutas protegidas */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <PatientDashboard />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/admin/specialties" element={<AdminSpecialtiesPage />} />
                        <Route path="/register/doctor" element={<DoctorRegisterPage />} />

                        <Route
                            path="/profile/edit"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <EditProfilePage />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/doctors"
                            element={
                                <Layout>
                                    <div className="container-custom py-12">
                                        <h1 className="text-3xl font-bold">Buscar Doctores</h1>
                                        <p className="text-gray-600 mt-2">Encuentra al especialista perfecto para ti</p>
                                    </div>
                                </Layout>
                            }
                        />

                        <Route
                            path="/specialties"
                            element={
                                <Layout>
                                    <div className="container-custom py-12">
                                        <h1 className="text-3xl font-bold">Especialidades Médicas</h1>
                                        <p className="text-gray-600 mt-2">Explora todas nuestras especialidades</p>
                                    </div>
                                </Layout>
                            }
                        />

                        <Route
                            path="/appointments"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <div className="container-custom py-12">
                                            <h1 className="text-3xl font-bold">Mis Citas</h1>
                                            <p className="text-gray-600 mt-2">Gestiona tus citas médicas</p>
                                        </div>
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/courses"
                            element={
                                <Layout>
                                    <CoursesPage />
                                </Layout>
                            }
                        />

                        <Route
                            path="/courses/:id"
                            element={
                                <Layout>
                                    <CourseDetailPage />
                                </Layout>
                            }
                        />

                        {/* Doctor: gestión de mis cursos */}
                        <Route
                            path="/doctor/my-courses"
                            element={
                                <ProtectedRoute allowedRoles={['Doctor']}>
                                    <DoctorMyCoursesPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Términos, Privacidad, Sobre nosotros y Soporte */}
                        <Route path="/terms"   element={<Layout><TermsPage    /></Layout>} />
                        <Route path="/privacy" element={<Layout><PrivacyPage  /></Layout>} />
                        <Route path="/about"   element={<Layout><AboutPage    /></Layout>} />
                        <Route path="/support" element={<Layout><SupportPage  /></Layout>} />

                        {/* Páginas de retorno de Stripe */}
                        <Route path="/payment/success" element={<PaymentSuccessPage />} />
                        <Route path="/payment/cancel" element={<PaymentCancelPage />} />

                        {/* 404 */}
                        <Route
                            path="*"
                            element={
                                <Layout>
                                    <div className="container-custom py-20 text-center">
                                        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                                        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                                        <a href="/" className="btn-primary">
                                            Volver al inicio
                                        </a>
                                    </div>
                                </Layout>
                            }
                        />
                    </Routes>
                </AuthProvider>
                </LanguageProvider>
                </ThemeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;