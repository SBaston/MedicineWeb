import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Shield, Users, CreditCard, AlertTriangle, Scale, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Contenido por idioma ─────────────────────────────────────────────────────

const content = {
    es: {
        title: 'Términos y Condiciones',
        subtitle: 'Por favor, lee atentamente estos términos antes de usar NexusSalud.',
        lastUpdated: 'Última actualización: 1 de enero de 2026',
        backToRegister: 'Volver al registro',
        sections: [
            {
                icon: FileText,
                title: '1. Aceptación de los Términos',
                body: `Al acceder y utilizar la plataforma NexusSalud, aceptas quedar vinculado por estos Términos y Condiciones de Uso. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.

NexusSalud se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma. Tu uso continuado del servicio tras dichas modificaciones constituye tu aceptación de los nuevos términos.`,
            },
            {
                icon: Shield,
                title: '2. Descripción del Servicio',
                body: `NexusSalud es una plataforma digital que facilita la conexión entre pacientes y profesionales de la salud debidamente colegiados. Nuestros servicios incluyen:

• Consultas médicas online en tiempo real o diferidas.
• Acceso a cursos y formación especializada impartida por profesionales sanitarios.
• Gestión de citas y seguimiento de historial de consultas.
• Sistema seguro de mensajería entre paciente y profesional.

NexusSalud actúa exclusivamente como intermediario tecnológico y no es un proveedor de servicios médicos. La relación médico-paciente se establece directamente entre el profesional y el usuario.`,
            },
            {
                icon: Users,
                title: '3. Registro y Elegibilidad',
                body: `Para utilizar NexusSalud debes:

• Ser mayor de 18 años o contar con autorización de un tutor legal.
• Proporcionar información veraz, completa y actualizada durante el registro.
• Mantener la confidencialidad de tus credenciales de acceso.
• No crear más de una cuenta personal.

Los profesionales sanitarios, adicionalmente, deben:

• Estar en posesión del número de colegiado vigente en España.
• Aportar la documentación requerida para la verificación de identidad y titulación.
• Mantener su información profesional actualizada en todo momento.
• Cumplir con el Código Deontológico de su profesión.

NexusSalud se reserva el derecho de suspender o cancelar cuentas que incumplan estos requisitos.`,
            },
            {
                icon: CreditCard,
                title: '4. Pagos y Facturación',
                body: `Las consultas médicas tienen un precio establecido por cada profesional. Al confirmar una cita, el importe correspondiente se cargará en el método de pago registrado.

NexusSalud aplica una comisión de servicio del 15% sobre cada transacción realizada a través de la plataforma. Esta comisión cubre el mantenimiento de la infraestructura tecnológica, los sistemas de seguridad y el soporte al usuario.

Política de reembolso: Las cancelaciones realizadas con más de 24 horas de antelación tendrán reembolso completo. Las cancelaciones entre 2 y 24 horas previas a la cita tendrán un reembolso del 50%. No se realizarán reembolsos en cancelaciones con menos de 2 horas de antelación o en caso de no presentación.

Todos los precios incluyen el IVA correspondiente según la legislación española vigente.`,
            },
            {
                icon: AlertTriangle,
                title: '5. Conducta del Usuario y Limitaciones',
                body: `Queda expresamente prohibido:

• Utilizar la plataforma para fines ilegales o no autorizados.
• Publicar contenido falso, engañoso, difamatorio u ofensivo.
• Intentar acceder de forma no autorizada a sistemas o cuentas de terceros.
• Suplantar la identidad de otro usuario o profesional.
• Compartir credenciales de acceso con terceros.
• Recopilar datos de otros usuarios sin su consentimiento expreso.
• Interferir en el correcto funcionamiento de la plataforma.

El incumplimiento de estas normas podrá resultar en la suspensión o cancelación permanente de la cuenta, sin perjuicio de las acciones legales que pudieran corresponder.`,
            },
            {
                icon: Scale,
                title: '6. Responsabilidad y Limitación de Garantías',
                body: `NexusSalud no será responsable por:

• El contenido, diagnósticos, tratamientos o recomendaciones emitidos por los profesionales de la salud registrados en la plataforma.
• Daños indirectos, incidentales, especiales o consecuentes derivados del uso del servicio.
• Interrupciones del servicio por causas técnicas, de mantenimiento o de fuerza mayor.
• La exactitud o idoneidad de la información médica publicada en la plataforma.

La responsabilidad máxima de NexusSalud frente al usuario en ningún caso excederá el importe total abonado por el usuario durante los últimos tres meses de uso del servicio.

Este servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas.`,
            },
            {
                icon: FileText,
                title: '7. Propiedad Intelectual',
                body: `Todo el contenido disponible en NexusSalud, incluyendo pero no limitado a textos, gráficos, logotipos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de NexusSalud o de sus proveedores de contenido, y está protegido por las leyes de propiedad intelectual aplicables.

Los profesionales que publiquen contenido (cursos, artículos, recursos) en la plataforma otorgan a NexusSalud una licencia no exclusiva, mundial, libre de regalías y sublicenciable para usar, reproducir, modificar y distribuir dicho contenido dentro de la plataforma.`,
            },
            {
                icon: Scale,
                title: '8. Legislación Aplicable y Jurisdicción',
                body: `Estos Términos y Condiciones se rigen por la legislación española, en particular por:

• La Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).
• El Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD).
• La Ley 14/1986, General de Sanidad.
• El Real Decreto Legislativo 1/2007, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios.

Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de Madrid, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.`,
            },
            {
                icon: Mail,
                title: '9. Contacto',
                body: `Si tienes alguna pregunta sobre estos Términos y Condiciones, puedes contactarnos en:

📧 legal@nexussalud.com
📞 +34 900 123 456
📍 NexusSalud S.L. — Madrid, España

Nuestro equipo legal responderá a tu consulta en un plazo máximo de 5 días hábiles.`,
            },
        ],
    },

    en: {
        title: 'Terms and Conditions',
        subtitle: 'Please read these terms carefully before using NexusSalud.',
        lastUpdated: 'Last updated: 1 January 2026',
        backToRegister: 'Back to registration',
        sections: [
            {
                icon: FileText,
                title: '1. Acceptance of Terms',
                body: `By accessing and using the NexusSalud platform, you agree to be bound by these Terms and Conditions of Use. If you disagree with any part of these terms, you may not access the service.

NexusSalud reserves the right to modify these terms at any time. Changes will take effect immediately upon publication on the platform. Your continued use of the service after such modifications constitutes your acceptance of the new terms.`,
            },
            {
                icon: Shield,
                title: '2. Description of Service',
                body: `NexusSalud is a digital platform that facilitates the connection between patients and duly licensed health professionals. Our services include:

• Real-time and asynchronous online medical consultations.
• Access to specialised courses and training provided by health professionals.
• Appointment management and consultation history tracking.
• Secure messaging system between patient and professional.

NexusSalud acts exclusively as a technology intermediary and is not a healthcare service provider. The doctor-patient relationship is established directly between the professional and the user.`,
            },
            {
                icon: Users,
                title: '3. Registration and Eligibility',
                body: `To use NexusSalud you must:

• Be at least 18 years old or have authorisation from a legal guardian.
• Provide truthful, complete and up-to-date information during registration.
• Maintain the confidentiality of your access credentials.
• Not create more than one personal account.

Health professionals must additionally:

• Hold a current medical licence registered in Spain.
• Provide the documentation required for identity and qualification verification.
• Keep their professional information up to date at all times.
• Comply with the Code of Ethics of their profession.

NexusSalud reserves the right to suspend or cancel accounts that do not meet these requirements.`,
            },
            {
                icon: CreditCard,
                title: '4. Payments and Billing',
                body: `Medical consultations are priced individually by each professional. When confirming an appointment, the corresponding amount will be charged to the registered payment method.

NexusSalud applies a 15% service commission on each transaction made through the platform. This commission covers technological infrastructure maintenance, security systems and user support.

Refund policy: Cancellations made more than 24 hours in advance will receive a full refund. Cancellations between 2 and 24 hours before the appointment will receive a 50% refund. No refunds will be made for cancellations less than 2 hours in advance or in the event of no-show.

All prices include applicable VAT in accordance with current Spanish legislation.`,
            },
            {
                icon: AlertTriangle,
                title: '5. User Conduct and Restrictions',
                body: `The following is expressly prohibited:

• Using the platform for illegal or unauthorised purposes.
• Publishing false, misleading, defamatory or offensive content.
• Attempting to gain unauthorised access to systems or third-party accounts.
• Impersonating another user or professional.
• Sharing access credentials with third parties.
• Collecting data from other users without their express consent.
• Interfering with the proper functioning of the platform.

Violation of these rules may result in suspension or permanent cancellation of the account, without prejudice to any legal actions that may apply.`,
            },
            {
                icon: Scale,
                title: '6. Liability and Limitation of Warranties',
                body: `NexusSalud shall not be liable for:

• Content, diagnoses, treatments or recommendations issued by health professionals registered on the platform.
• Indirect, incidental, special or consequential damages arising from the use of the service.
• Service interruptions due to technical, maintenance or force majeure causes.
• The accuracy or suitability of medical information published on the platform.

NexusSalud's maximum liability to the user shall in no case exceed the total amount paid by the user during the last three months of use of the service.

This service is provided "as is" and "as available", without warranties of any kind, express or implied.`,
            },
            {
                icon: FileText,
                title: '7. Intellectual Property',
                body: `All content available on NexusSalud, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads and data compilations, is the property of NexusSalud or its content providers, and is protected by applicable intellectual property laws.

Professionals who publish content (courses, articles, resources) on the platform grant NexusSalud a non-exclusive, worldwide, royalty-free and sublicensable licence to use, reproduce, modify and distribute such content within the platform.`,
            },
            {
                icon: Scale,
                title: '8. Governing Law and Jurisdiction',
                body: `These Terms and Conditions are governed by Spanish law, in particular:

• Law 34/2002 on Information Society Services and Electronic Commerce.
• The General Data Protection Regulation (GDPR) and Organic Law 3/2018 on Personal Data Protection.
• Law 14/1986, General Health Act.
• Royal Legislative Decree 1/2007, approving the revised text of the General Law for the Defence of Consumers and Users.

For the resolution of any dispute, the parties submit to the Courts and Tribunals of Madrid, expressly waiving any other jurisdiction that may apply to them.`,
            },
            {
                icon: Mail,
                title: '9. Contact',
                body: `If you have any questions about these Terms and Conditions, you can contact us at:

📧 legal@nexussalud.com
📞 +34 900 123 456
📍 NexusSalud S.L. — Madrid, Spain

Our legal team will respond to your enquiry within a maximum of 5 business days.`,
            },
        ],
    },

    fr: {
        title: 'Conditions Générales d\'Utilisation',
        subtitle: 'Veuillez lire attentivement ces conditions avant d\'utiliser NexusSalud.',
        lastUpdated: 'Dernière mise à jour : 1er janvier 2026',
        backToRegister: 'Retour à l\'inscription',
        sections: [
            { icon: FileText, title: '1. Acceptation des conditions', body: `En accédant à NexusSalud et en l'utilisant, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'êtes pas d'accord avec l'une des parties de ces conditions, vous ne pourrez pas accéder au service.\n\nNexusSalud se réserve le droit de modifier ces conditions à tout moment. Les modifications prendront effet immédiatement après leur publication sur la plateforme.` },
            { icon: Shield, title: '2. Description du service', body: `NexusSalud est une plateforme numérique qui facilite la mise en relation entre patients et professionnels de santé dûment agréés. Nos services comprennent des consultations médicales en ligne, l'accès à des formations spécialisées, la gestion des rendez-vous et un système de messagerie sécurisée.\n\nNexusSalud agit exclusivement en tant qu'intermédiaire technologique et n'est pas un prestataire de services médicaux.` },
            { icon: Users, title: '3. Inscription et éligibilité', body: `Pour utiliser NexusSalud, vous devez avoir au moins 18 ans, fournir des informations véridiques et complètes, maintenir la confidentialité de vos identifiants, et ne créer qu'un seul compte personnel.\n\nLes professionnels de santé doivent en outre posséder un numéro de licence valide en Espagne et fournir la documentation requise pour la vérification.` },
            { icon: CreditCard, title: '4. Paiements et facturation', body: `Les consultations médicales sont tarifées individuellement par chaque professionnel. NexusSalud applique une commission de service de 15 % sur chaque transaction.\n\nPolitique de remboursement : Annulations plus de 24h à l'avance = remboursement complet. Entre 2 et 24h = 50%. Moins de 2h ou absence = aucun remboursement.` },
            { icon: AlertTriangle, title: '5. Conduite et restrictions', body: `Il est expressément interdit d'utiliser la plateforme à des fins illégales, de publier du contenu faux ou offensant, d'usurper l'identité d'un autre utilisateur, ou d'interférer avec le bon fonctionnement de la plateforme. Le non-respect peut entraîner la suspension du compte.` },
            { icon: Scale, title: '6. Responsabilité', body: `NexusSalud ne sera pas responsable du contenu médical émis par les professionnels, des dommages indirects découlant de l'utilisation du service, ni des interruptions de service pour raisons techniques ou de force majeure.` },
            { icon: FileText, title: '7. Propriété intellectuelle', body: `Tout le contenu disponible sur NexusSalud est protégé par les lois sur la propriété intellectuelle applicables et appartient à NexusSalud ou à ses fournisseurs de contenu.` },
            { icon: Scale, title: '8. Droit applicable', body: `Ces conditions sont régies par la législation espagnole, notamment le RGPD et la loi espagnole sur la protection des données. Pour tout litige, les parties se soumettent aux tribunaux de Madrid.` },
            { icon: Mail, title: '9. Contact', body: `Pour toute question : 📧 legal@nexussalud.com | 📞 +34 900 123 456 | Notre équipe juridique répondra sous 5 jours ouvrables.` },
        ],
    },

    de: {
        title: 'Allgemeine Geschäftsbedingungen',
        subtitle: 'Bitte lesen Sie diese Bedingungen sorgfältig, bevor Sie NexusSalud nutzen.',
        lastUpdated: 'Letzte Aktualisierung: 1. Januar 2026',
        backToRegister: 'Zurück zur Registrierung',
        sections: [
            { icon: FileText, title: '1. Annahme der Bedingungen', body: `Durch den Zugriff auf NexusSalud und dessen Nutzung erklären Sie sich mit diesen Allgemeinen Geschäftsbedingungen einverstanden. NexusSalud behält sich das Recht vor, diese Bedingungen jederzeit zu ändern. Änderungen treten unmittelbar nach der Veröffentlichung auf der Plattform in Kraft.` },
            { icon: Shield, title: '2. Leistungsbeschreibung', body: `NexusSalud ist eine digitale Plattform, die die Verbindung zwischen Patienten und ordnungsgemäß zugelassenen Gesundheitsfachleuten erleichtert. Unsere Dienste umfassen Online-Arztgespräche, Zugang zu Fachkursen, Terminverwaltung und ein sicheres Nachrichtensystem.\n\nNexusSalud handelt ausschließlich als technologischer Vermittler und ist kein Gesundheitsdienstleister.` },
            { icon: Users, title: '3. Registrierung und Berechtigung', body: `Zur Nutzung von NexusSalud müssen Sie mindestens 18 Jahre alt sein, wahrheitsgemäße Informationen angeben, Ihre Zugangsdaten vertraulich behandeln und nur ein persönliches Konto erstellen.\n\nGesundheitsfachleute müssen zusätzlich eine gültige Lizenznummer in Spanien besitzen und die erforderliche Dokumentation zur Verifizierung vorlegen.` },
            { icon: CreditCard, title: '4. Zahlungen und Abrechnung', body: `Arztgespräche werden individuell von jedem Fachmann bepreist. NexusSalud erhebt eine Servicegebühr von 15% auf jede Transaktion.\n\nStornierungsrichtlinie: Stornierungen mehr als 24h im Voraus = vollständige Erstattung. Zwischen 2 und 24h = 50%. Weniger als 2h oder Nichterscheinen = keine Erstattung.` },
            { icon: AlertTriangle, title: '5. Nutzerverhalten und Einschränkungen', body: `Es ist ausdrücklich verboten, die Plattform für illegale Zwecke zu nutzen, falsche oder beleidigende Inhalte zu veröffentlichen, die Identität anderer Nutzer zu missbrauchen oder den ordnungsgemäßen Betrieb der Plattform zu stören. Verstöße können zur Kontosperrung führen.` },
            { icon: Scale, title: '6. Haftung', body: `NexusSalud haftet nicht für medizinische Inhalte der Fachleute, indirekte Schäden aus der Nutzung des Dienstes oder Serviceunterbrechungen aus technischen Gründen oder höherer Gewalt.` },
            { icon: FileText, title: '7. Geistiges Eigentum', body: `Alle auf NexusSalud verfügbaren Inhalte sind durch anwendbare Gesetze zum Schutz des geistigen Eigentums geschützt und gehören NexusSalud oder seinen Inhaltsanbietern.` },
            { icon: Scale, title: '8. Anwendbares Recht', body: `Diese Bedingungen unterliegen spanischem Recht, insbesondere der DSGVO und dem spanischen Datenschutzgesetz. Für Streitigkeiten sind die Gerichte in Madrid zuständig.` },
            { icon: Mail, title: '9. Kontakt', body: `Bei Fragen: 📧 legal@nexussalud.com | 📞 +34 900 123 456 | Unser Rechtsteam antwortet innerhalb von 5 Werktagen.` },
        ],
    },
};

// ─── Componente ───────────────────────────────────────────────────────────────

const TermsPage = () => {
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
                            <div className="bg-primary-100 dark:bg-primary-900/40 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
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
                                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
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
                <div className="mt-10 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 text-center">
                    <p className="text-primary-800 dark:text-primary-300 font-semibold mb-2">
                        {language === 'es' ? '¿Tienes dudas sobre estos términos?' :
                         language === 'en' ? 'Have questions about these terms?' :
                         language === 'fr' ? 'Des questions sur ces conditions ?' :
                         'Fragen zu diesen Bedingungen?'}
                    </p>
                    <p className="text-primary-700 dark:text-primary-400 text-sm mb-4">
                        {language === 'es' ? 'Nuestro equipo legal está disponible para ayudarte.' :
                         language === 'en' ? 'Our legal team is available to help you.' :
                         language === 'fr' ? 'Notre équipe juridique est disponible pour vous aider.' :
                         'Unser Rechtsteam steht Ihnen zur Verfügung.'}
                    </p>
                    <a
                        href="mailto:legal@nexussalud.com"
                        className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                    >
                        <Mail className="w-4 h-4" />
                        legal@nexussalud.com
                    </a>
                </div>

            </div>
        </div>
    );
};

export default TermsPage;
