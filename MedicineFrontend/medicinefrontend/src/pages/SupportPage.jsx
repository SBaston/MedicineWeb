import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HelpCircle, Mail, Phone, MapPin, MessageCircle,
    ChevronDown, ArrowRight, Shield, Clock
} from 'lucide-react';

const FAQ_CATEGORIES = [
    {
        label: 'Cuenta y registro',
        icon: '👤',
        items: [
            {
                q: '¿Cómo me registro en NexusSalud?',
                a: 'Puedes crear tu cuenta desde el botón "Crear cuenta" en la parte superior. El proceso tarda menos de 2 minutos y solo necesitas un correo electrónico válido.',
            },
            {
                q: '¿Cómo recupero mi contraseña?',
                a: 'En la pantalla de inicio de sesión encontrarás el enlace "¿Olvidaste tu contraseña?". Recibirás un correo para restablecerla en pocos minutos.',
            },
        ],
    },
    {
        label: 'Médicos y verificación',
        icon: '🩺',
        items: [
            {
                q: '¿Cómo se verifican los médicos?',
                a: 'Cada profesional envía su titulación oficial, número de colegiado y documentación de experiencia. El equipo de NexusSalud verifica manualmente cada solicitud antes de aprobar el perfil.',
            },
            {
                q: '¿Son seguras mis consultas online?',
                a: 'Sí. Todas las videoconsultas se realizan en entornos cifrados. Además, tus datos médicos están protegidos conforme al RGPD y la legislación española de protección de datos.',
            },
        ],
    },
    {
        label: 'Citas y cancelaciones',
        icon: '📅',
        items: [
            {
                q: '¿Puedo cancelar una cita?',
                a: 'Puedes cancelar o reagendar una cita desde tu panel hasta 24 horas antes sin coste adicional. Consulta la política de cancelación de cada profesional para más detalles.',
            },
            {
                q: '¿Qué ocurre si el médico cancela la cita?',
                a: 'Si un profesional cancela una cita, recibirás un reembolso completo en un plazo de 5-10 días hábiles y una notificación para que puedas reservar con otro especialista.',
            },
        ],
    },
    {
        label: 'Cursos y pagos',
        icon: '📚',
        items: [
            {
                q: '¿Cómo funcionan los cursos?',
                a: 'Los cursos son creados y publicados por los propios médicos de la plataforma. Una vez matriculado, tienes acceso permanente al contenido en vídeo y puedes avanzar a tu ritmo.',
            },
            {
                q: '¿Qué métodos de pago se aceptan?',
                a: 'Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe, uno de los procesadores de pago más seguros del mundo.',
            },
            {
                q: '¿Puedo obtener un reembolso de un curso?',
                a: 'Sí, dispones de 14 días desde la compra para solicitar el reembolso completo, siempre que no hayas consumido más del 20% del contenido del curso.',
            },
        ],
    },
];

const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div
            className={`rounded-xl border transition-all duration-200 overflow-hidden ${open ? 'border-primary-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
            >
                <span className="font-semibold text-gray-900 text-sm leading-snug">{q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary-500' : ''}`} />
            </button>
            {open && (
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {a}
                </p>
            )}
        </div>
    );
};

const SupportPage = () => {
    const [activeCategory, setActiveCategory] = useState(0);

    return (
        <div className="min-h-screen">

            {/* ── Hero ── */}
            <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 py-20 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
                <div className="container-custom relative text-center max-w-3xl mx-auto">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                        <HelpCircle className="w-4 h-4" />
                        Centro de ayuda
                    </span>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        ¿En qué podemos{' '}
                        <span className="gradient-text">ayudarte?</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Encuentra respuestas rápidas en las preguntas frecuentes o contáctanos
                        directamente. Estamos aquí para ayudarte.
                    </p>
                </div>
            </section>

            {/* ── Accesos rápidos ── */}
            <section className="bg-primary-600 py-10">
                <div className="container-custom">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white text-center">
                        {[
                            { icon: MessageCircle, label: 'Chat en vivo',    sub: 'Respuesta inmediata'     },
                            { icon: Clock,         label: 'Horario soporte', sub: 'Lun–Vie, 9:00–18:00'    },
                            { icon: Shield,        label: 'Datos seguros',   sub: 'Protegidos con RGPD'     },
                        ].map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm">{label}</p>
                                    <p className="text-blue-200 text-xs">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 bg-white">
                <div className="container-custom max-w-5xl">
                    <div className="text-center mb-12">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">FAQ</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Preguntas frecuentes</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
                            Selecciona una categoría para filtrar las preguntas más comunes.
                        </p>
                    </div>

                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-2 justify-center mb-10">
                        {FAQ_CATEGORIES.map((cat, i) => (
                            <button
                                key={cat.label}
                                onClick={() => setActiveCategory(i)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    activeCategory === i
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                        {FAQ_CATEGORIES[activeCategory].items.map(item => (
                            <FaqItem key={item.q} {...item} />
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-400 mt-10">
                        ¿No encuentras lo que buscas?{' '}
                        <a href="#contacto" className="text-primary-600 font-semibold hover:underline">
                            Escríbenos directamente ↓
                        </a>
                    </p>
                </div>
            </section>

            {/* ── Contacto ── */}
            <section id="contacto" className="py-20 bg-gray-50">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Contacto</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Estamos aquí para ti</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
                            ¿Tienes alguna pregunta que no está en las FAQ? Escríbenos y te responderemos lo antes posible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-14">
                        {[
                            { icon: Mail,   label: 'Email',    value: 'contacto@nexussalud.com', color: 'bg-blue-50 text-blue-600'    },
                            { icon: Phone,  label: 'Teléfono', value: '+34 900 123 456',          color: 'bg-emerald-50 text-emerald-600' },
                            { icon: MapPin, label: 'Sede',     value: 'España',                   color: 'bg-violet-50 text-violet-600'  },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <p className="text-sm text-gray-500 mb-1">{label}</p>
                                <p className="font-semibold text-gray-900">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Formulario de contacto */}
                    <form className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto space-y-5">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Envíanos un mensaje</h3>
                        <p className="text-sm text-gray-500 mb-4">Te responderemos en menos de 24 horas.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                                <input type="text" placeholder="Tu nombre"
                                    className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" placeholder="tu@email.com"
                                    className="input-field" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto</label>
                            <select className="input-field">
                                <option value="">Selecciona un tema…</option>
                                <option>Problema con una cita</option>
                                <option>Problema con un pago</option>
                                <option>Acceso a mi cuenta</option>
                                <option>Consulta sobre cursos</option>
                                <option>Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
                            <textarea rows={4} placeholder="Describe tu consulta con el máximo detalle posible…"
                                className="input-field resize-none" />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                            Enviar mensaje
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </section>

        </div>
    );
};

export default SupportPage;
