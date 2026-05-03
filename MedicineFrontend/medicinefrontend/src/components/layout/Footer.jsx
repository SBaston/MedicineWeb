import { Heart, Mail, Phone, MapPin } from 'lucide-react';
import logo from '../../assets/nexussalud-logo1.jpg';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="bg-gray-900 text-white mt-20">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo y descripción */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <img
                                src={logo}
                                alt="NexusSalud Logo"
                                className="h-12 w-12 object-contain rounded-lg"
                            />
                            <span className="text-2xl font-bold">NexusSalud</span>
                        </div>
                        <p className="text-gray-400 text-sm">{t('footer.description')}</p>
                    </div>

                    {/* Enlaces rápidos */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/doctors" className="text-gray-400 hover:text-white transition-colors">{t('footer.findDoctors')}</Link></li>
                            <li><Link to="/specialties" className="text-gray-400 hover:text-white transition-colors">{t('footer.specialties')}</Link></li>
                            <li><Link to="/courses" className="text-gray-400 hover:text-white transition-colors">{t('footer.courses')}</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">{t('footer.about')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.forDoctors')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/register?role=doctor" className="text-gray-400 hover:text-white transition-colors">{t('footer.joinDoctor')}</Link></li>
                            <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">{t('footer.controlPanel')}</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.createCourses')}</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center space-x-2 text-gray-400">
                                <Mail className="w-4 h-4" />
                                <span>contacto@nexussalud.com</span>
                            </li>
                            <li className="flex items-center space-x-2 text-gray-400">
                                <Phone className="w-4 h-4" />
                                <span>+34 900 123 456</span>
                            </li>
                            <li className="flex items-center space-x-2 text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>Un lugar cualquiera, España</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright + versión */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400 space-y-1">
                    <p>© 2026 NexusSalud. {t('footer.rights')} | {t('footer.tfg')}</p>
                    <p className="text-xs text-gray-600">
                        v{__APP_VERSION__}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;