import { Link } from 'react-router-dom';
import { Search, Star, Award, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import doctorService from '../services/doctorService';
import specialtyService from '../services/specialtyService';
import { useLanguage } from '../context/LanguageContext';

const HomePage = () => {
    const { t } = useLanguage();

    // Obtener especialidades ACTIVAS (público)
    const { data: specialties } = useQuery({
        queryKey: ['specialties'],
        queryFn: specialtyService.getActive,  // ✅ CAMBIADO: de getAll a getActive
    });

    //// Obtener doctores destacados
    //const { data: doctors } = useQuery({
    //    queryKey: ['featured-doctors'],
    //    queryFn: () => doctorService.getAllDoctors({ minRating: 4.5 }),
    //});

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
                <div className="container-custom">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold mb-6 animate-fade-in">
                            {t('home.hero.title')}
                        </h1>
                        <p className="text-xl mb-8 text-primary-100">
                            {t('home.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/doctors" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg">
                                <Search className="w-5 h-5" />
                                {t('home.hero.searchBtn')}
                            </Link>
                            <Link to="/register" className="border-2 border-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg text-center transition-all">
                                {t('home.hero.registerBtn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Características */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-white rounded-xl shadow-md">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('home.features.certified.title')}</h3>
                            <p className="text-gray-600">{t('home.features.certified.desc')}</p>
                        </div>

                        <div className="text-center p-8 bg-white rounded-xl shadow-md">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('home.features.availability.title')}</h3>
                            <p className="text-gray-600">{t('home.features.availability.desc')}</p>
                        </div>

                        <div className="text-center p-8 bg-white rounded-xl shadow-md">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('home.features.courses.title')}</h3>
                            <p className="text-gray-600">{t('home.features.courses.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Especialidades */}
            <section className="py-16">
                <div className="container-custom">
                    <h2 className="text-4xl font-bold text-center mb-12">{t('home.specialties.title')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {specialties?.slice(0, 6).map((specialty) => (
                            <Link
                                key={specialty.id}
                                to={`/doctors?specialty=${specialty.id}`}
                                className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all text-center group"
                            >
                                <div className="text-4xl mb-3">🩺</div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                    {specialty.name}
                                </h3>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/specialties" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-2">
                            {t('home.specialties.viewAll')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Doctores destacados */}
            {/*<section className="py-16 bg-gray-50">*/}
            {/*    <div className="container-custom">*/}
            {/*        <h2 className="text-4xl font-bold text-center mb-12">Doctores Destacados</h2>*/}
            {/*        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">*/}
            {/*            {doctors?.slice(0, 3).map((doctor) => (*/}
            {/*                <div key={doctor.id} className="card">*/}
            {/*                    <img*/}
            {/*                        src={doctor.profilePictureUrl || 'https://via.placeholder.com/300'}*/}
            {/*                        alt={doctor.fullName}*/}
            {/*                        className="w-full h-48 object-cover rounded-lg mb-4"*/}
            {/*                    />*/}
            {/*                    <h3 className="text-xl font-bold mb-2">{doctor.fullName}</h3>*/}
            {/*                    <p className="text-gray-600 mb-3">{doctor.specialties?.[0]?.name}</p>*/}
            {/*                    <div className="flex items-center gap-2 mb-4">*/}
            {/*                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />*/}
            {/*                        <span className="font-semibold">{doctor.averageRating?.toFixed(1)}</span>*/}
            {/*                        <span className="text-gray-500 text-sm">({doctor.totalReviews} reseñas)</span>*/}
            {/*                    </div>*/}
            {/*                    <Link*/}
            {/*                        to={`/doctors/${doctor.id}`}*/}
            {/*                        className="btn-primary w-full text-center block"*/}
            {/*                    >*/}
            {/*                        Ver Perfil*/}
            {/*                    </Link>*/}
            {/*                </div>*/}
            {/*            ))}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</section>*/}

            {/* CTA Section */}
            <section className="py-16 bg-primary-600 text-white">
                <div className="container-custom text-center">
                    <h2 className="text-4xl font-bold mb-6">{t('home.cta.title')}</h2>
                    <p className="text-xl mb-8 text-primary-100">{t('home.cta.subtitle')}</p>
                    <Link
                        to="/register?role=doctor"
                        className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg inline-block transition-all shadow-lg"
                    >
                        {t('home.cta.btn')}
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;