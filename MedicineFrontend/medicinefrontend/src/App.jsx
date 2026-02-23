import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
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
        <div className="flex flex-col min-h-screen">
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
                        {/* Nueva ruta única que reemplaza /doctors y /specialties */}
                        <Route path="/professionals" element={<Layout><ProfessionalsPage /></Layout>} />

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
                                    <div className="container-custom py-12">
                                        <h1 className="text-3xl font-bold">Cursos de Formación</h1>
                                        <p className="text-gray-600 mt-2">Aprende de los mejores profesionales</p>
                                    </div>
                                </Layout>
                            }
                        />

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
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;