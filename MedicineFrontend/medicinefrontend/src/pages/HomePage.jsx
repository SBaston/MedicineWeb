import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Star, Award, Clock, ArrowRight, CheckCircle,
    Users, Stethoscope, BookOpen, Shield, Heart, ChevronLeft,
    ChevronRight, Play, Calendar, Video, MessageCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import specialtyService from '../services/specialtyService';
import { useLanguage } from '../context/LanguageContext';

// ─── Datos estáticos ────────────────────────────────────────

const STATS = [
    { value: '500+',    label: 'Médicos verificados',   icon: Stethoscope },
    { value: '50+',     label: 'Especialidades',         icon: Award },
    { value: '10.000+', label: 'Consultas realizadas',   icon: Calendar },
    { value: '4.9/5',   label: 'Valoración media',       icon: Star },
];

const STEPS = [
    {
        number: '01',
        title:  'Crea tu cuenta',
        desc:   'Regístrate gratis en menos de 2 minutos. Solo necesitas tu email y algunos datos básicos.',
        icon:   CheckCircle,
        color:  'bg-blue-50 text-blue-600',
        border: 'border-blue-100',
    },
    {
        number: '02',
        title:  'Encuentra tu especialista',
        desc:   'Filtra por especialidad, valoración o disponibilidad y elige al profesional ideal para ti.',
        icon:   Search,
        color:  'bg-emerald-50 text-emerald-600',
        border: 'border-emerald-100',
    },
    {
        number: '03',
        title:  'Reserva y consulta',
        desc:   'Elige horario, paga de forma segura con Stripe y conecta online o presencialmente.',
        icon:   Video,
        color:  'bg-violet-50 text-violet-600',
        border: 'border-violet-100',
    },
];

const FEATURES = [
    {
        icon:  Shield,
        title: 'Profesionales verificados',
        desc:  'Cada médico pasa un proceso de validación de titulación y experiencia antes de publicar su perfil.',
        color: 'text-blue-600',
        bg:    'bg-blue-50',
    },
    {
        icon:  Clock,
        title: 'Disponibilidad 24/7',
        desc:  'Gestiona tus citas en cualquier momento. Los profesionales actualizan sus horarios en tiempo real.',
        color: 'text-emerald-600',
        bg:    'bg-emerald-50',
    },
    {
        icon:  BookOpen,
        title: 'Cursos especializados',
        desc:  'Accede a formación médica de calidad creada y avalada por los propios profesionales de la plataforma.',
        color: 'text-violet-600',
        bg:    'bg-violet-50',
    },
    {
        icon:  Heart,
        title: 'Seguimiento continuo',
        desc:  'Historial de consultas, notas clínicas y comunicación directa con tu especialista en un solo lugar.',
        color: 'text-rose-600',
        bg:    'bg-rose-50',
    },
];

const TESTIMONIALS = [
    {
        name:   'María García',
        role:   'Paciente',
        text:   'Encontré al cardiólogo perfecto en menos de 5 minutos. La consulta online fue tan cómoda que ya no imagino ir al médico de otra manera.',
        rating: 5,
        avatar: 'MG',
        color:  'bg-blue-100 text-blue-700',
    },
    {
        name:   'Dr. Carlos Ruiz',
        role:   'Médico — Traumatología',
        text:   'La plataforma me ha permitido llegar a pacientes de toda España. Los cursos que publico generan ingresos adicionales sin esfuerzo extra.',
        rating: 5,
        avatar: 'CR',
        color:  'bg-emerald-100 text-emerald-700',
    },
    {
        name:   'Laura Martínez',
        role:   'Paciente',
        text:   'El proceso de reserva es muy intuitivo y el pago es seguro. En menos de 24 horas tenía mi consulta con un dermatólogo confirmada.',
        rating: 5,
        avatar: 'LM',
        color:  'bg-violet-100 text-violet-700',
    },
    {
        name:   'Dr. Ana Torres',
        role:   'Médica — Psicología',
        text:   'Mis pacientes valoran muchísimo la posibilidad de hacer seguimiento online. El dashboard es claro y la gestión de agenda es muy eficiente.',
        rating: 5,
        avatar: 'AT',
        color:  'bg-rose-100 text-rose-700',
    },
];

const SPECIALTY_EMOJIS = ['🫀','🧠','🦷','👁️','🦴','🍼','🫁','🧬','💊','🩺','🩻','🩹'];

// ─── Hook de reveal-on-scroll ────────────────────────────────

function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
}

// ─── Componente principal ────────────────────────────────────

const HomePage = () => {
    const { t } = useLanguage();
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isAutoplay, setIsAutoplay]               = useState(true);

    const stepsRef        = useReveal();
    const featuresRef     = useReveal();
    const specialtiesRef  = useReveal();
    const testimonialsRef = useReveal();
    const ctaRef          = useReveal();

    const { data: specialties } = useQuery({
        queryKey: ['specialties'],
        queryFn:  specialtyService.getActive,
    });

    // Autoplay testimonios
    useEffect(() => {
        if (!isAutoplay) return;
        const timer = setInterval(() => {
            setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [isAutoplay]);

    const prevTestimonial = () => {
        setIsAutoplay(false);
        setActiveTestimonial(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    };
    const nextTestimonial = () => {
        setIsAutoplay(false);
        setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length);
    };

    return (
        <div className="min-h-screen overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════ */}
            <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 pt-16 pb-24 overflow-hidden">
                {/* Círculos decorativos de fondo */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sky-300 rounded-full opacity-20 blur-3xl pointer-events-none" />

                <div className="container-custom relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Texto principal */}
                        <div>
                            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 animate-slide-up">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                La plataforma de salud digital de confianza
                            </span>

                            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 animate-slide-up-delay1">
                                Tu salud,{' '}
                                <span className="gradient-text">siempre cerca</span>
                            </h1>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed animate-slide-up-delay2">
                                Reserva consultas con especialistas certificados, accede a cursos médicos
                                de calidad y gestiona tu bienestar desde cualquier lugar.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-slide-up-delay3">
                                <Link
                                    to="/professionals"
                                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5"
                                >
                                    <Search className="w-5 h-5" />
                                    Buscar profesionales
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center justify-center gap-2 border-2 border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-600 bg-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5"
                                >
                                    Registrarse gratis
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>

                            {/* Trust indicators */}
                            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 animate-slide-up-delay3">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Sin permanencia
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Pago 100% seguro
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Médicos verificados
                                </span>
                            </div>
                        </div>

                        {/* Tarjetas flotantes */}
                        <div className="relative hidden lg:flex justify-center items-center animate-slide-right">
                            {/* Tarjeta central */}
                            <div className="glass-card rounded-2xl shadow-2xl p-6 w-72 animate-float">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        DR
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">Dr. Rodríguez</p>
                                        <p className="text-xs text-gray-500">Cardiología</p>
                                    </div>
                                    <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                        Disponible
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span className="text-xs text-gray-500 ml-1">4.9 (128 reseñas)</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    {['10:00', '11:30', '16:00'].map(h => (
                                        <button key={h} className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg py-1.5 font-medium transition-colors">
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tarjeta superior derecha */}
                            <div className="absolute -top-6 right-0 glass-card rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 w-52"
                                style={{ animationDelay: '1s' }}>
                                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-900">Cita confirmada</p>
                                    <p className="text-xs text-gray-500">Mañana, 11:30</p>
                                </div>
                            </div>

                            {/* Tarjeta inferior izquierda */}
                            <div className="absolute -bottom-6 -left-4 glass-card rounded-xl shadow-lg px-4 py-3 w-48">
                                <p className="text-xs text-gray-500 mb-1">Valoración media</p>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xl font-bold text-gray-900">4.9</span>
                                    <span className="text-xs text-gray-400 mt-1">/ 5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                STATS BAR
            ═══════════════════════════════════════════════════ */}
            <section className="bg-primary-600 py-10">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
                        {STATS.map(({ value, label, icon: Icon }) => (
                            <div key={label} className="flex flex-col items-center gap-1">
                                <Icon className="w-6 h-6 text-blue-200 mb-1" />
                                <span className="text-3xl font-extrabold">{value}</span>
                                <span className="text-blue-200 text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                CÓMO FUNCIONA
            ═══════════════════════════════════════════════════ */}
            <section className="py-24 bg-white">
                <div className="container-custom">
                    <div ref={stepsRef} className="reveal text-center mb-16">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Sencillo y rápido</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">¿Cómo funciona?</h2>
                        <p className="text-gray-500 mt-4 max-w-xl mx-auto">Reserva tu primera consulta en menos de 3 minutos, sin complicaciones.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Línea conectora desktop */}
                        <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-violet-200" />

                        {STEPS.map((step, i) => (
                            <div
                                key={step.number}
                                className={`reveal reveal-delay${i + 1} bg-white border ${step.border} rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-center relative`}
                            >
                                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                                    <step.icon className="w-8 h-8" />
                                </div>
                                <span className="text-4xl font-black text-gray-100 absolute top-6 right-8">{step.number}</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Empieza ahora — es gratis
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                ESPECIALIDADES
            ═══════════════════════════════════════════════════ */}
            <section className="py-24 bg-gray-50">
                <div className="container-custom">
                    <div ref={specialtiesRef} className="reveal text-center mb-14">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Lo que ofrecemos</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Nuestras especialidades</h2>
                        <p className="text-gray-500 mt-4 max-w-xl mx-auto">Encuentra el especialista que necesitas entre más de 50 áreas médicas.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {specialties?.slice(0, 12).map((specialty, i) => (
                            <Link
                                key={specialty.id}
                                to={`/professionals?specialty=${specialty.id}`}
                                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-gray-100 hover:border-primary-200"
                            >
                                <span className="text-3xl">{SPECIALTY_EMOJIS[i % SPECIALTY_EMOJIS.length]}</span>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-center leading-tight">
                                    {specialty.name}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            to="/professionals"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                        >
                            Ver todos los profesionales
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                CARACTERÍSTICAS
            ═══════════════════════════════════════════════════ */}
            <section className="py-24 bg-white">
                <div className="container-custom">
                    <div ref={featuresRef} className="reveal text-center mb-16">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Por qué elegirnos</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Todo lo que necesitas</h2>
                        <p className="text-gray-500 mt-4 max-w-xl mx-auto">Diseñado para pacientes y profesionales que exigen lo mejor.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURES.map((f, i) => (
                            <div
                                key={f.title}
                                className={`reveal reveal-delay${i + 1} group p-8 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all hover:-translate-y-1 bg-white`}
                            >
                                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-5`}>
                                    <f.icon className={`w-7 h-7 ${f.color}`} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                TESTIMONIOS
            ═══════════════════════════════════════════════════ */}
            <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
                <div className="container-custom">
                    <div ref={testimonialsRef} className="reveal text-center mb-16">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Opiniones reales</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Lo que dicen nuestros usuarios</h2>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        {/* Tarjeta activa */}
                        <div className="bg-white rounded-3xl shadow-xl p-10 relative min-h-[200px]">
                            <div className="text-6xl text-blue-100 font-serif leading-none mb-4 select-none">"</div>

                            {TESTIMONIALS.map((t, i) => (
                                <div
                                    key={i}
                                    className={`transition-all duration-500 ${i === activeTestimonial ? 'opacity-100' : 'opacity-0 absolute inset-10'}`}
                                >
                                    {i === activeTestimonial && (
                                        <>
                                            <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                                                {t.text}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 ${t.color} rounded-full flex items-center justify-center font-bold text-sm`}>
                                                        {t.avatar}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{t.name}</p>
                                                        <p className="text-sm text-gray-500">{t.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(t.rating)].map((_, j) => (
                                                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Controles */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={prevTestimonial}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <div className="flex gap-2">
                                {TESTIMONIALS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setIsAutoplay(false); setActiveTestimonial(i); }}
                                        className={`rounded-full transition-all ${i === activeTestimonial ? 'w-6 h-2.5 bg-primary-600' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextTestimonial}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════
                CTA DOCTORES
            ═══════════════════════════════════════════════════ */}
            <section ref={ctaRef} className="reveal py-24 bg-primary-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full" />
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white rounded-full" />
                </div>
                <div className="container-custom relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div className="text-white">
                            <span className="text-blue-200 font-semibold text-sm uppercase tracking-widest">Para profesionales</span>
                            <h2 className="text-4xl font-extrabold mt-2 mb-5">
                                ¿Eres profesional de la salud?
                            </h2>
                            <p className="text-blue-100 text-lg leading-relaxed mb-6">
                                Únete a más de 500 médicos que ya confían en NexusSalud para gestionar su agenda,
                                conectar con pacientes y monetizar su conocimiento con cursos online.
                            </p>
                            <ul className="space-y-3 text-blue-100">
                                {[
                                    'Perfil profesional verificado y visible',
                                    'Gestión de agenda y citas en tiempo real',
                                    'Crea y vende cursos especializados',
                                    'Pagos directos y seguros con Stripe',
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-4">
                            <Link
                                to="/register?role=doctor"
                                className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Registrarme como doctor
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/about"
                                className="text-blue-200 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                Saber más sobre NexusSalud <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HomePage;
