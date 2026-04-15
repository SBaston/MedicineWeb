import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, User, Database, Lock, Eye, Trash2, Globe, Mail, Cookie } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Contenido por idioma ─────────────────────────────────────────────────────

const content = {
    es: {
        title: 'Política de Privacidad',
        subtitle: 'En NexusSalud, la protección de tus datos personales es una prioridad. Este documento explica cómo recopilamos, usamos y protegemos tu información.',
        lastUpdated: 'Última actualización: 1 de enero de 2026',
        backToRegister: 'Volver al registro',
        sections: [
            {
                icon: User,
                title: '1. Responsable del Tratamiento',
                body: `Responsable: NexusSalud S.L.
CIF: B-XXXXXXXX
Domicilio social: Madrid, España
Correo electrónico: privacidad@nexussalud.com
Teléfono: +34 900 123 456

NexusSalud S.L. es la entidad responsable del tratamiento de los datos personales recabados a través de esta plataforma, en cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y Garantía de los Derechos Digitales (LOPDGDD).`,
            },
            {
                icon: Database,
                title: '2. Datos que Recopilamos',
                body: `Datos de identificación y contacto:
• Nombre y apellidos, fecha de nacimiento, correo electrónico, teléfono y dirección.

Datos profesionales (solo para profesionales sanitarios):
• Número de colegiado, especialidades, años de experiencia, documentación identificativa, fotografía y títulos académicos.

Datos de uso de la plataforma:
• Historial de consultas y citas, mensajes intercambiados con profesionales, historial de pagos y facturas.

Datos técnicos:
• Dirección IP, tipo de navegador, sistema operativo, páginas visitadas y tiempo de permanencia.

Datos de salud (categoría especial):
• Información médica compartida voluntariamente durante las consultas. Estos datos reciben el más alto nivel de protección.`,
            },
            {
                icon: Eye,
                title: '3. Finalidad del Tratamiento',
                body: `Tus datos personales se tratan con las siguientes finalidades:

• Gestión del registro y la cuenta de usuario en la plataforma.
• Facilitar la prestación de servicios de consulta médica online.
• Procesamiento de pagos y emisión de facturas.
• Comunicaciones relacionadas con el servicio (confirmaciones de cita, notificaciones, etc.).
• Mejora de la plataforma mediante análisis de uso anonimizados.
• Cumplimiento de obligaciones legales y reglamentarias.
• Prevención del fraude y garantía de la seguridad de la plataforma.

No se realizará ningún tratamiento de datos para finalidades incompatibles con las anteriormente descritas.`,
            },
            {
                icon: Lock,
                title: '4. Base Legal del Tratamiento',
                body: `El tratamiento de tus datos se basa en las siguientes bases jurídicas:

• Ejecución de un contrato: necesario para la prestación de los servicios contratados.
• Cumplimiento de obligaciones legales: facturación, conservación de datos médicos según normativa sanitaria.
• Consentimiento explícito: para el tratamiento de datos de categoría especial (datos de salud) y para comunicaciones comerciales.
• Interés legítimo: para la mejora de la plataforma y la prevención del fraude, siempre respetando tus derechos y libertades fundamentales.`,
            },
            {
                icon: Globe,
                title: '5. Comunicación y Cesión de Datos',
                body: `NexusSalud no vende ni cede tus datos personales a terceros. Sin embargo, podemos compartir información con:

• Profesionales sanitarios con los que hayas contratado consultas, exclusivamente para la prestación del servicio.
• Proveedores de servicios de pago (pasarelas de pago), bajo contratos de encargo de tratamiento conforme al RGPD.
• Proveedores de infraestructura tecnológica (hosting, cloud), igualmente bajo contratos de encargo de tratamiento.
• Autoridades competentes, cuando así lo exija la ley o una resolución judicial.

Todos nuestros proveedores han sido evaluados y ofrecen garantías suficientes de cumplimiento del RGPD.`,
            },
            {
                icon: Database,
                title: '6. Plazos de Conservación',
                body: `Los datos se conservarán durante los siguientes plazos:

• Datos de cuenta: durante la vigencia de la relación contractual y, posteriormente, durante los plazos legales de prescripción de responsabilidades (hasta 5 años).
• Datos médicos y de consultas: mínimo 5 años desde la fecha de la última consulta, conforme a la normativa de historia clínica.
• Datos de facturación: 6 años conforme a la Ley General Tributaria.
• Datos de comunicaciones: 1 año desde la finalización de la consulta.

Transcurridos estos plazos, los datos serán eliminados de forma segura e irreversible.`,
            },
            {
                icon: Shield,
                title: '7. Tus Derechos',
                body: `De acuerdo con la normativa vigente, tienes los siguientes derechos sobre tus datos personales:

• Acceso: obtener confirmación sobre si tratamos tus datos y acceder a ellos.
• Rectificación: corregir datos inexactos o incompletos.
• Supresión ("derecho al olvido"): solicitar la eliminación de tus datos cuando ya no sean necesarios.
• Oposición: oponerte al tratamiento de tus datos en determinadas circunstancias.
• Limitación: solicitar la restricción del tratamiento de tus datos.
• Portabilidad: recibir tus datos en un formato estructurado y legible por máquina.
• Retirada del consentimiento: en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.

Para ejercer cualquiera de estos derechos, envía un correo a privacidad@nexussalud.com adjuntando una copia de tu documento de identidad. Responderemos en un plazo máximo de 30 días.

Si consideras que el tratamiento de tus datos no es conforme a la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): www.aepd.es`,
            },
            {
                icon: Lock,
                title: '8. Seguridad de los Datos',
                body: `NexusSalud implementa medidas técnicas y organizativas de seguridad para proteger tus datos personales contra accesos no autorizados, pérdida, destrucción o divulgación accidental. Entre las medidas adoptadas se incluyen:

• Cifrado de datos en tránsito mediante TLS 1.3.
• Cifrado de datos en reposo mediante AES-256.
• Controles de acceso basados en roles (RBAC).
• Auditorías de seguridad periódicas.
• Plan de respuesta a incidentes de seguridad.
• Formación continua del personal en materia de protección de datos.

En caso de brecha de seguridad que afecte a tus datos, serás notificado en el plazo legalmente establecido.`,
            },
            {
                icon: Cookie,
                title: '9. Política de Cookies',
                body: `NexusSalud utiliza cookies y tecnologías similares para mejorar tu experiencia de uso. Las cookies que utilizamos son:

Cookies técnicas (esenciales): necesarias para el funcionamiento básico de la plataforma. No requieren consentimiento.
• Sesión de usuario y autenticación.
• Preferencias de idioma y tema visual.

Cookies analíticas (opcionales): utilizadas para analizar el uso de la plataforma de forma anonimizada.
• Estadísticas de visitas y comportamiento de usuario.

Puedes gestionar las cookies desde la configuración de tu navegador. Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento de la plataforma.`,
            },
            {
                icon: Mail,
                title: '10. Cambios en esta Política y Contacto',
                body: `NexusSalud se reserva el derecho de actualizar esta Política de Privacidad para reflejar cambios en la legislación aplicable o en nuestras prácticas de tratamiento de datos. Te notificaremos de cambios sustanciales por correo electrónico o mediante aviso en la plataforma.

Para cualquier consulta sobre privacidad o protección de datos:

📧 privacidad@nexussalud.com
📞 +34 900 123 456
📍 Delegado de Protección de Datos — NexusSalud S.L., Madrid, España

Nuestro Delegado de Protección de Datos (DPO) atenderá tu consulta en un plazo máximo de 30 días.`,
            },
        ],
    },

    en: {
        title: 'Privacy Policy',
        subtitle: 'At NexusSalud, protecting your personal data is a priority. This document explains how we collect, use and protect your information.',
        lastUpdated: 'Last updated: 1 January 2026',
        backToRegister: 'Back to registration',
        sections: [
            { icon: User, title: '1. Data Controller', body: `Controller: NexusSalud S.L.\nRegistered address: Madrid, Spain\nEmail: privacy@nexussalud.com\nPhone: +34 900 123 456\n\nNexusSalud S.L. is the entity responsible for processing the personal data collected through this platform, in compliance with the General Data Protection Regulation (GDPR) and Spanish Organic Law 3/2018 on Personal Data Protection.` },
            { icon: Database, title: '2. Data We Collect', body: `Identification and contact data: Name, date of birth, email, phone and address.\n\nProfessional data (healthcare professionals only): Licence number, specialties, years of experience, identity documents, photograph and academic qualifications.\n\nPlatform usage data: Consultation and appointment history, messages exchanged with professionals, payment history and invoices.\n\nTechnical data: IP address, browser type, operating system, pages visited and time spent.\n\nHealth data (special category): Medical information voluntarily shared during consultations. This data receives the highest level of protection.` },
            { icon: Eye, title: '3. Purpose of Processing', body: `Your personal data is processed for the following purposes:\n\n• Account registration and user account management.\n• Facilitating online medical consultation services.\n• Payment processing and invoice issuance.\n• Service-related communications (appointment confirmations, notifications, etc.).\n• Platform improvement through anonymised usage analysis.\n• Compliance with legal and regulatory obligations.\n• Fraud prevention and platform security assurance.` },
            { icon: Lock, title: '4. Legal Basis for Processing', body: `The processing of your data is based on the following legal grounds:\n\n• Contract performance: necessary for the provision of contracted services.\n• Legal obligation: invoicing, retention of medical data as required by healthcare regulations.\n• Explicit consent: for the processing of special category data (health data) and for commercial communications.\n• Legitimate interest: for platform improvement and fraud prevention, always respecting your fundamental rights and freedoms.` },
            { icon: Globe, title: '5. Data Sharing', body: `NexusSalud does not sell or transfer your personal data to third parties. However, we may share information with:\n\n• Healthcare professionals with whom you have contracted consultations, solely for service delivery.\n• Payment service providers, under data processing agreements compliant with GDPR.\n• Technology infrastructure providers (hosting, cloud), likewise under data processing agreements.\n• Competent authorities, when required by law or a court order.` },
            { icon: Database, title: '6. Retention Periods', body: `Data will be retained for the following periods:\n\n• Account data: for the duration of the contractual relationship and subsequently during the legal limitation periods (up to 5 years).\n• Medical and consultation data: minimum 5 years from the date of the last consultation.\n• Billing data: 6 years in accordance with Spanish Tax Law.\n• Communications data: 1 year from the end of the consultation.` },
            { icon: Shield, title: '7. Your Rights', body: `In accordance with applicable regulations, you have the following rights over your personal data:\n\n• Access, Rectification, Erasure ("right to be forgotten"), Objection, Restriction, Portability, and Withdrawal of consent.\n\nTo exercise any of these rights, send an email to privacy@nexussalud.com attaching a copy of your identity document. We will respond within a maximum of 30 days.\n\nIf you believe that the processing of your data does not comply with the regulations, you may lodge a complaint with the Spanish Data Protection Agency (AEPD): www.aepd.es` },
            { icon: Lock, title: '8. Data Security', body: `NexusSalud implements technical and organisational security measures to protect your personal data against unauthorised access, loss, destruction or accidental disclosure, including:\n\n• Data encryption in transit via TLS 1.3.\n• Data encryption at rest via AES-256.\n• Role-based access controls (RBAC).\n• Regular security audits.\n• Security incident response plan.\n• Ongoing staff training in data protection.` },
            { icon: Cookie, title: '9. Cookie Policy', body: `NexusSalud uses cookies and similar technologies to improve your user experience:\n\nTechnical cookies (essential): necessary for the basic operation of the platform. No consent required.\n• User session and authentication.\n• Language and visual theme preferences.\n\nAnalytical cookies (optional): used to analyse platform usage in an anonymised way.` },
            { icon: Mail, title: '10. Changes and Contact', body: `NexusSalud reserves the right to update this Privacy Policy. We will notify you of substantial changes by email or via notice on the platform.\n\nFor any privacy or data protection enquiries:\n📧 privacy@nexussalud.com | 📞 +34 900 123 456\nOur Data Protection Officer will respond within a maximum of 30 days.` },
        ],
    },

    fr: {
        title: 'Politique de Confidentialité',
        subtitle: 'Chez NexusSalud, la protection de vos données personnelles est une priorité. Ce document explique comment nous collectons, utilisons et protégeons vos informations.',
        lastUpdated: 'Dernière mise à jour : 1er janvier 2026',
        backToRegister: 'Retour à l\'inscription',
        sections: [
            { icon: User, title: '1. Responsable du traitement', body: `Responsable : NexusSalud S.L.\nAdresse : Madrid, Espagne\nE-mail : confidentialite@nexussalud.com\n\nNexusSalud S.L. est l'entité responsable du traitement des données personnelles collectées via cette plateforme, conformément au RGPD et à la législation espagnole sur la protection des données.` },
            { icon: Database, title: '2. Données collectées', body: `Données d'identification : nom, date de naissance, e-mail, téléphone.\nDonnées professionnelles (professionnels de santé) : numéro de licence, spécialités, documents d'identité.\nDonnées d'utilisation : historique des consultations, messages, paiements.\nDonnées techniques : adresse IP, navigateur, système d'exploitation.\nDonnées de santé : informations médicales partagées volontairement. Ces données bénéficient du niveau de protection le plus élevé.` },
            { icon: Eye, title: '3. Finalités du traitement', body: `Vos données sont traitées pour : la gestion du compte, la prestation des services de consultation médicale, le traitement des paiements, les communications liées au service, l'amélioration de la plateforme par des analyses anonymisées, le respect des obligations légales et la prévention de la fraude.` },
            { icon: Lock, title: '4. Base légale', body: `Le traitement de vos données repose sur : l'exécution d'un contrat, le respect d'obligations légales, le consentement explicite pour les données de santé, et l'intérêt légitime pour l'amélioration de la plateforme et la prévention de la fraude.` },
            { icon: Globe, title: '5. Partage des données', body: `NexusSalud ne vend pas vos données personnelles. Nous pouvons les partager avec les professionnels de santé consultés, les prestataires de paiement et d'infrastructure technologique (sous contrats conformes au RGPD), et les autorités compétentes si la loi l'exige.` },
            { icon: Database, title: '6. Durées de conservation', body: `Données de compte : durée de la relation contractuelle + 5 ans.\nDonnées médicales : minimum 5 ans depuis la dernière consultation.\nDonnées de facturation : 6 ans.\nDonnées de communication : 1 an.` },
            { icon: Shield, title: '7. Vos droits', body: `Vous disposez des droits d'accès, de rectification, d'effacement, d'opposition, de limitation, de portabilité et de retrait du consentement.\n\nPour exercer ces droits : confidentialite@nexussalud.com. Nous répondrons sous 30 jours.\n\nVous pouvez également contacter la CNIL ou l'AEPD (Espagne) en cas de réclamation.` },
            { icon: Lock, title: '8. Sécurité', body: `NexusSalud met en œuvre des mesures de sécurité techniques et organisationnelles, notamment le chiffrement TLS 1.3 et AES-256, des contrôles d'accès basés sur les rôles, des audits de sécurité réguliers et un plan de réponse aux incidents.` },
            { icon: Cookie, title: '9. Cookies', body: `Nous utilisons des cookies techniques (essentiels, sans consentement) pour la session et les préférences, et des cookies analytiques (optionnels) pour analyser l'utilisation de la plateforme de manière anonyme.` },
            { icon: Mail, title: '10. Modifications et contact', body: `Pour toute question sur la confidentialité :\n📧 confidentialite@nexussalud.com | 📞 +34 900 123 456\nNotre Délégué à la Protection des Données répondra sous 30 jours.` },
        ],
    },

    de: {
        title: 'Datenschutzrichtlinie',
        subtitle: 'Bei NexusSalud hat der Schutz Ihrer personenbezogenen Daten höchste Priorität. Dieses Dokument erklärt, wie wir Ihre Daten erheben, verwenden und schützen.',
        lastUpdated: 'Letzte Aktualisierung: 1. Januar 2026',
        backToRegister: 'Zurück zur Registrierung',
        sections: [
            { icon: User, title: '1. Verantwortlicher', body: `Verantwortlicher: NexusSalud S.L.\nAnschrift: Madrid, Spanien\nE-Mail: datenschutz@nexussalud.com\n\nNexusSalud S.L. ist die für die Verarbeitung der über diese Plattform erhobenen personenbezogenen Daten verantwortliche Stelle, gemäß der DSGVO und dem spanischen Datenschutzgesetz.` },
            { icon: Database, title: '2. Erhobene Daten', body: `Identifikations- und Kontaktdaten: Name, Geburtsdatum, E-Mail, Telefon.\nBerufsdaten (Gesundheitsfachleute): Lizenznummer, Fachgebiete, Ausweisdokumente.\nNutzungsdaten: Konsultationshistorie, Nachrichten, Zahlungen.\nTechnische Daten: IP-Adresse, Browser, Betriebssystem.\nGesundheitsdaten: freiwillig geteilte medizinische Informationen (höchste Schutzstufe).` },
            { icon: Eye, title: '3. Verarbeitungszwecke', body: `Ihre Daten werden verarbeitet für: Kontoverwaltung, Online-Arztberatung, Zahlungsabwicklung, servicebezogene Kommunikation, anonymisierte Plattformverbesserung, Erfüllung gesetzlicher Pflichten und Betrugsprävention.` },
            { icon: Lock, title: '4. Rechtsgrundlagen', body: `Die Verarbeitung Ihrer Daten erfolgt auf Basis: Vertragserfüllung, gesetzliche Verpflichtungen, ausdrückliche Einwilligung für Gesundheitsdaten und berechtigtes Interesse für Plattformverbesserung und Betrugsprävention.` },
            { icon: Globe, title: '5. Datenweitergabe', body: `NexusSalud verkauft Ihre Daten nicht. Wir geben Daten weiter an: konsultierte Gesundheitsfachleute, Zahlungs- und Technologiedienstleister (gemäß DSGVO-konformen Auftragsverarbeitungsverträgen) und Behörden, wenn gesetzlich erforderlich.` },
            { icon: Database, title: '6. Speicherfristen', body: `Kontodaten: Vertragslaufzeit + 5 Jahre.\nMedizinische Daten: mindestens 5 Jahre seit der letzten Konsultation.\nRechnungsdaten: 6 Jahre.\nKommunikationsdaten: 1 Jahr.` },
            { icon: Shield, title: '7. Ihre Rechte', body: `Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung, Datenübertragbarkeit und Widerruf der Einwilligung.\n\nKontakt: datenschutz@nexussalud.com. Wir antworten innerhalb von 30 Tagen.\n\nBei Beschwerden können Sie sich an die Datenschutzbehörde (AEPD/BfDI) wenden.` },
            { icon: Lock, title: '8. Datensicherheit', body: `NexusSalud setzt technische und organisatorische Sicherheitsmaßnahmen ein: TLS 1.3 und AES-256-Verschlüsselung, rollenbasierte Zugriffskontrollen, regelmäßige Sicherheitsaudits und einen Notfallplan für Sicherheitsvorfälle.` },
            { icon: Cookie, title: '9. Cookies', body: `Wir verwenden technische Cookies (ohne Einwilligung erforderlich) für Sitzung und Einstellungen sowie optionale Analyse-Cookies für die anonymisierte Nutzungsanalyse.` },
            { icon: Mail, title: '10. Änderungen und Kontakt', body: `Bei Datenschutzfragen:\n📧 datenschutz@nexussalud.com | 📞 +34 900 123 456\nUnser Datenschutzbeauftragter antwortet innerhalb von 30 Tagen.` },
        ],
    },
};

// ─── Componente ───────────────────────────────────────────────────────────────

const PrivacyPage = () => {
    const { language } = useLanguage();
    const c = content[language] || content.es;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container-custom max-w-4xl">

                {/* Cabecera */}
                <div className="mb-8">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {c.backToRegister}
                    </Link>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-green-100 dark:bg-green-900/40 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{c.title}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.lastUpdated}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.subtitle}</p>
                    </div>
                </div>

                {/* Secciones */}
                <div className="space-y-6">
                    {c.sections.map((section, i) => {
                        const Icon = section.icon;
                        return (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                    <Icon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <h2 className="font-bold text-gray-900 dark:text-white">{section.title}</h2>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                        {section.body}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer de página */}
                <div className="mt-10 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                    <p className="text-green-800 dark:text-green-300 font-semibold mb-2">
                        {language === 'es' ? '¿Tienes dudas sobre tu privacidad?' :
                         language === 'en' ? 'Have questions about your privacy?' :
                         language === 'fr' ? 'Des questions sur votre confidentialité ?' :
                         'Fragen zum Datenschutz?'}
                    </p>
                    <p className="text-green-700 dark:text-green-400 text-sm mb-4">
                        {language === 'es' ? 'Nuestro Delegado de Protección de Datos está a tu disposición.' :
                         language === 'en' ? 'Our Data Protection Officer is at your disposal.' :
                         language === 'fr' ? 'Notre Délégué à la Protection des Données est à votre disposition.' :
                         'Unser Datenschutzbeauftragter steht Ihnen zur Verfügung.'}
                    </p>
                    <a
                        href="mailto:privacidad@nexussalud.com"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                        <Mail className="w-4 h-4" />
                        privacidad@nexussalud.com
                    </a>
                </div>

            </div>
        </div>
    );
};

export default PrivacyPage;
