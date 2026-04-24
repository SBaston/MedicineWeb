import { Link } from 'react-router-dom';
import {
    Heart, Shield, Users, BookOpen, ArrowRight,
    CheckCircle, Stethoscope, Target, Lightbulb, Globe, HelpCircle
} from 'lucide-react';

const VALUES = [
    {
        icon:  Shield,
        title: 'Confianza',
        desc:  'Cada profesional pasa un proceso de verificación exhaustivo antes de estar disponible en la plataforma.',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        icon:  Heart,
        title: 'Cuidado',
        desc:  'El bienestar del paciente está en el centro de cada decisión que tomamos como plataforma.',
        color: 'bg-rose-50 text-rose-600',
    },
    {
        icon:  Lightbulb,
        title: 'Innovación',
        desc:  'Aplicamos la tecnología más avanzada para simplificar el acceso a la atención médica de calidad.',
        color: 'bg-amber-50 text-amber-600',
    },
    {
        icon:  Globe,
        title: 'Accesibilidad',
        desc:  'Creemos que todos merecen acceso a atención médica de calidad, independientemente de su ubicación.',
        color: 'bg-emerald-50 text-emerald-600',
    },
];

const TEAM_STATS = [
    { value: '500+',    label: 'Médicos verificados'  },
    { value: '50+',     label: 'Especialidades'        },
    { value: '10.000+', label: 'Pacientes atendidos'   },
    { value: '4.9/5',   label: 'Satisfacción media'    },
];

const AboutPage = () => {
    return (
        <div className="min-h-screen">

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 py-20 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
                <div className="container-custom relative text-center max-w-3xl mx-auto">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                        <Heart className="w-4 h-4" />
                        Sobre NexusSalud
                    </span>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Conectamos pacientes con los{' '}
                        <span className="gradient-text">mejores especialistas</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        NexusSalud nació con un propósito claro: democratizar el acceso a la atención
                        médica de calidad en España. Creemos que la tecnología puede acercar a las
                        personas a los profesionales que necesitan, sin barreras geográficas ni esperas innecesarias.
                    </p>
                    <Link
                        to="/professionals"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:-translate-y-0.5"
                    >
                        Explorar profesionales
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ── Stats ────────────────────────────────────────── */}
            <section className="bg-primary-600 py-12">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
                        {TEAM_STATS.map(({ value, label }) => (
                            <div key={label}>
                                <p className="text-4xl font-extrabold">{value}</p>
                                <p className="text-blue-200 text-sm mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Misión ───────────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Nuestra misión</span>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-6">
                                Salud digital accesible para todos
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                En NexusSalud creemos que cada persona merece acceso rápido, fácil y seguro
                                a la atención médica que necesita. Por eso hemos creado una plataforma que
                                elimina las barreras entre pacientes y profesionales de la salud.
                            </p>
                            <p className="text-gray-600 leading-relaxed mb-8">
                                Tanto si buscas una segunda opinión, una consulta de seguimiento o quieres
                                aprender de los mejores expertos a través de nuestros cursos, NexusSalud
                                es tu espacio de salud digital de confianza.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Verificación rigurosa de todos los profesionales',
                                    'Tecnología de vídeo segura y cifrada',
                                    'Pagos protegidos con Stripe',
                                    'Soporte en español',
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Visual */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 aspect-square">
                                <Stethoscope className="w-10 h-10 text-blue-600" />
                                <p className="font-bold text-gray-900 text-lg">Consultas médicas</p>
                                <p className="text-gray-500 text-sm">Online y presencial</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 aspect-square mt-6">
                                <BookOpen className="w-10 h-10 text-emerald-600" />
                                <p className="font-bold text-gray-900 text-lg">Cursos médicos</p>
                                <p className="text-gray-500 text-sm">Aprende de los mejores</p>
                            </div>
                            <div className="bg-violet-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 aspect-square -mt-6">
                                <Users className="w-10 h-10 text-violet-600" />
                                <p className="font-bold text-gray-900 text-lg">Comunidad activa</p>
                                <p className="text-gray-500 text-sm">Pacientes y doctores</p>
                            </div>
                            <div className="bg-rose-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 aspect-square">
                                <Target className="w-10 h-10 text-rose-600" />
                                <p className="font-bold text-gray-900 text-lg">Resultados reales</p>
                                <p className="text-gray-500 text-sm">4.9/5 de satisfacción</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Valores ──────────────────────────────────────── */}
            <section className="py-24 bg-gray-50">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Lo que nos guía</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Nuestros valores</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {VALUES.map(({ icon: Icon, title, desc, color }) => (
                            <div key={title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100">
                                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-5`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA soporte ──────────────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="container-custom max-w-2xl text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <HelpCircle className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-3">¿Tienes alguna pregunta?</h2>
                    <p className="text-gray-500 mb-8">
                        Visita nuestro centro de ayuda para encontrar respuestas rápidas o contactar con el equipo.
                    </p>
                    <Link
                        to="/support"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:-translate-y-0.5"
                    >
                        Ir al centro de ayuda
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ── CTA final ────────────────────────────────────── */}
            <section className="py-20 bg-primary-600 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full" />
                </div>
                <div className="container-custom relative">
                    <h2 className="text-4xl font-extrabold mb-4">¿Listo para empezar?</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                        Únete a miles de pacientes y profesionales que ya confían en NexusSalud.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5"
                        >
                            Crear cuenta gratis
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/professionals"
                            className="inline-flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white px-8 py-4 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                        >
                            Ver profesionales
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutPage;
