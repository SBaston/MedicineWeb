// ─────────────────────────────────────────────────────────────────────────────
// PhoneInput.jsx
// Prefijo escribible con autocompletado (datalist) + campo de solo dígitos.
// Formato almacenado: E.164 sin espacios, p.ej. "+34600000000"
// Si aparece un nuevo prefijo de país, el usuario simplemente lo escribe.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

// Lista completa de prefijos internacionales (ITU-T E.164).
// Ordenada: países hispanohablantes y europeos primero, resto del mundo después.
export const PREFIXES = [
    // ── Hispanohablantes ───────────────────────────────────────────
    { code: '+34',  flag: '🇪🇸', name: 'España' },
    { code: '+52',  flag: '🇲🇽', name: 'México' },
    { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
    { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
    { code: '+56',  flag: '🇨🇱', name: 'Chile' },
    { code: '+51',  flag: '🇵🇪', name: 'Perú' },
    { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
    { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
    { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
    { code: '+53',  flag: '🇨🇺', name: 'Cuba' },
    { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
    { code: '+1809',flag: '🇩🇴', name: 'República Dominicana' },
    { code: '+504', flag: '🇭🇳', name: 'Honduras' },
    { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
    { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
    { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
    { code: '+507', flag: '🇵🇦', name: 'Panamá' },
    { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
    { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
    { code: '+1787',flag: '🇵🇷', name: 'Puerto Rico' },
    // ── Europa ─────────────────────────────────────────────────────
    { code: '+44',  flag: '🇬🇧', name: 'Reino Unido' },
    { code: '+33',  flag: '🇫🇷', name: 'Francia' },
    { code: '+49',  flag: '🇩🇪', name: 'Alemania' },
    { code: '+39',  flag: '🇮🇹', name: 'Italia' },
    { code: '+351', flag: '🇵🇹', name: 'Portugal' },
    { code: '+31',  flag: '🇳🇱', name: 'Países Bajos' },
    { code: '+32',  flag: '🇧🇪', name: 'Bélgica' },
    { code: '+41',  flag: '🇨🇭', name: 'Suiza' },
    { code: '+43',  flag: '🇦🇹', name: 'Austria' },
    { code: '+46',  flag: '🇸🇪', name: 'Suecia' },
    { code: '+47',  flag: '🇳🇴', name: 'Noruega' },
    { code: '+45',  flag: '🇩🇰', name: 'Dinamarca' },
    { code: '+358', flag: '🇫🇮', name: 'Finlandia' },
    { code: '+48',  flag: '🇵🇱', name: 'Polonia' },
    { code: '+420', flag: '🇨🇿', name: 'República Checa' },
    { code: '+421', flag: '🇸🇰', name: 'Eslovaquia' },
    { code: '+36',  flag: '🇭🇺', name: 'Hungría' },
    { code: '+40',  flag: '🇷🇴', name: 'Rumanía' },
    { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
    { code: '+30',  flag: '🇬🇷', name: 'Grecia' },
    { code: '+385', flag: '🇭🇷', name: 'Croacia' },
    { code: '+381', flag: '🇷🇸', name: 'Serbia' },
    { code: '+386', flag: '🇸🇮', name: 'Eslovenia' },
    { code: '+387', flag: '🇧🇦', name: 'Bosnia y Herzegovina' },
    { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
    { code: '+389', flag: '🇲🇰', name: 'Macedonia del Norte' },
    { code: '+355', flag: '🇦🇱', name: 'Albania' },
    { code: '+373', flag: '🇲🇩', name: 'Moldavia' },
    { code: '+380', flag: '🇺🇦', name: 'Ucrania' },
    { code: '+375', flag: '🇧🇾', name: 'Bielorrusia' },
    { code: '+7',   flag: '🇷🇺', name: 'Rusia' },
    { code: '+372', flag: '🇪🇪', name: 'Estonia' },
    { code: '+371', flag: '🇱🇻', name: 'Letonia' },
    { code: '+370', flag: '🇱🇹', name: 'Lituania' },
    { code: '+354', flag: '🇮🇸', name: 'Islandia' },
    { code: '+353', flag: '🇮🇪', name: 'Irlanda' },
    { code: '+352', flag: '🇱🇺', name: 'Luxemburgo' },
    { code: '+356', flag: '🇲🇹', name: 'Malta' },
    { code: '+357', flag: '🇨🇾', name: 'Chipre' },
    { code: '+376', flag: '🇦🇩', name: 'Andorra' },
    { code: '+377', flag: '🇲🇨', name: 'Mónaco' },
    { code: '+378', flag: '🇸🇲', name: 'San Marino' },
    { code: '+379', flag: '🇻🇦', name: 'Ciudad del Vaticano' },
    { code: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
    // ── América del Norte ──────────────────────────────────────────
    { code: '+1',   flag: '🇺🇸', name: 'EE.UU. / Canadá' },
    // ── América Central y Caribe ───────────────────────────────────
    { code: '+1242',flag: '🇧🇸', name: 'Bahamas' },
    { code: '+1246',flag: '🇧🇧', name: 'Barbados' },
    { code: '+1876',flag: '🇯🇲', name: 'Jamaica' },
    { code: '+1868',flag: '🇹🇹', name: 'Trinidad y Tobago' },
    { code: '+509', flag: '🇭🇹', name: 'Haití' },
    // ── América del Sur ────────────────────────────────────────────
    { code: '+55',  flag: '🇧🇷', name: 'Brasil' },
    { code: '+592', flag: '🇬🇾', name: 'Guyana' },
    { code: '+597', flag: '🇸🇷', name: 'Surinam' },
    // ── Asia ───────────────────────────────────────────────────────
    { code: '+86',  flag: '🇨🇳', name: 'China' },
    { code: '+81',  flag: '🇯🇵', name: 'Japón' },
    { code: '+82',  flag: '🇰🇷', name: 'Corea del Sur' },
    { code: '+91',  flag: '🇮🇳', name: 'India' },
    { code: '+92',  flag: '🇵🇰', name: 'Pakistán' },
    { code: '+880', flag: '🇧🇩', name: 'Bangladés' },
    { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
    { code: '+63',  flag: '🇵🇭', name: 'Filipinas' },
    { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
    { code: '+66',  flag: '🇹🇭', name: 'Tailandia' },
    { code: '+60',  flag: '🇲🇾', name: 'Malasia' },
    { code: '+65',  flag: '🇸🇬', name: 'Singapur' },
    { code: '+95',  flag: '🇲🇲', name: 'Myanmar' },
    { code: '+855', flag: '🇰🇭', name: 'Camboya' },
    { code: '+856', flag: '🇱🇦', name: 'Laos' },
    { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
    { code: '+977', flag: '🇳🇵', name: 'Nepal' },
    { code: '+975', flag: '🇧🇹', name: 'Bután' },
    { code: '+960', flag: '🇲🇻', name: 'Maldivas' },
    { code: '+93',  flag: '🇦🇫', name: 'Afganistán' },
    { code: '+98',  flag: '🇮🇷', name: 'Irán' },
    { code: '+964', flag: '🇮🇶', name: 'Iraq' },
    { code: '+963', flag: '🇸🇾', name: 'Siria' },
    { code: '+961', flag: '🇱🇧', name: 'Líbano' },
    { code: '+962', flag: '🇯🇴', name: 'Jordania' },
    { code: '+972', flag: '🇮🇱', name: 'Israel' },
    { code: '+970', flag: '🇵🇸', name: 'Palestina' },
    { code: '+966', flag: '🇸🇦', name: 'Arabia Saudita' },
    { code: '+971', flag: '🇦🇪', name: 'Emiratos Árabes Unidos' },
    { code: '+974', flag: '🇶🇦', name: 'Catar' },
    { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
    { code: '+973', flag: '🇧🇭', name: 'Baréin' },
    { code: '+968', flag: '🇴🇲', name: 'Omán' },
    { code: '+967', flag: '🇾🇪', name: 'Yemen' },
    { code: '+90',  flag: '🇹🇷', name: 'Turquía' },
    { code: '+994', flag: '🇦🇿', name: 'Azerbaiyán' },
    { code: '+374', flag: '🇦🇲', name: 'Armenia' },
    { code: '+995', flag: '🇬🇪', name: 'Georgia' },
    { code: '+7',   flag: '🇰🇿', name: 'Kazajistán' },
    { code: '+996', flag: '🇰🇬', name: 'Kirguistán' },
    { code: '+992', flag: '🇹🇯', name: 'Tayikistán' },
    { code: '+993', flag: '🇹🇲', name: 'Turkmenistán' },
    { code: '+998', flag: '🇺🇿', name: 'Uzbekistán' },
    { code: '+850', flag: '🇰🇵', name: 'Corea del Norte' },
    { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
    { code: '+886', flag: '🇹🇼', name: 'Taiwán' },
    { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
    { code: '+853', flag: '🇲🇴', name: 'Macao' },
    // ── Oceanía ────────────────────────────────────────────────────
    { code: '+61',  flag: '🇦🇺', name: 'Australia' },
    { code: '+64',  flag: '🇳🇿', name: 'Nueva Zelanda' },
    { code: '+679', flag: '🇫🇯', name: 'Fiyi' },
    { code: '+675', flag: '🇵🇬', name: 'Papúa Nueva Guinea' },
    { code: '+685', flag: '🇼🇸', name: 'Samoa' },
    { code: '+676', flag: '🇹🇴', name: 'Tonga' },
    { code: '+678', flag: '🇻🇺', name: 'Vanuatu' },
    { code: '+686', flag: '🇰🇮', name: 'Kiribati' },
    { code: '+674', flag: '🇳🇷', name: 'Nauru' },
    { code: '+688', flag: '🇹🇻', name: 'Tuvalu' },
    // ── África ─────────────────────────────────────────────────────
    { code: '+20',  flag: '🇪🇬', name: 'Egipto' },
    { code: '+212', flag: '🇲🇦', name: 'Marruecos' },
    { code: '+213', flag: '🇩🇿', name: 'Argelia' },
    { code: '+216', flag: '🇹🇳', name: 'Túnez' },
    { code: '+218', flag: '🇱🇾', name: 'Libia' },
    { code: '+249', flag: '🇸🇩', name: 'Sudán' },
    { code: '+251', flag: '🇪🇹', name: 'Etiopía' },
    { code: '+254', flag: '🇰🇪', name: 'Kenia' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
    { code: '+256', flag: '🇺🇬', name: 'Uganda' },
    { code: '+250', flag: '🇷🇼', name: 'Ruanda' },
    { code: '+27',  flag: '🇿🇦', name: 'Sudáfrica' },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
    { code: '+233', flag: '🇬🇭', name: 'Ghana' },
    { code: '+221', flag: '🇸🇳', name: 'Senegal' },
    { code: '+225', flag: '🇨🇮', name: 'Costa de Marfil' },
    { code: '+237', flag: '🇨🇲', name: 'Camerún' },
    { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
    { code: '+242', flag: '🇨🇬', name: 'Congo' },
    { code: '+244', flag: '🇦🇴', name: 'Angola' },
    { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
    { code: '+263', flag: '🇿🇼', name: 'Zimbabue' },
    { code: '+260', flag: '🇿🇲', name: 'Zambia' },
    { code: '+265', flag: '🇲🇼', name: 'Malaui' },
    { code: '+267', flag: '🇧🇼', name: 'Botsuana' },
    { code: '+264', flag: '🇳🇦', name: 'Namibia' },
    { code: '+266', flag: '🇱🇸', name: 'Lesoto' },
    { code: '+268', flag: '🇸🇿', name: 'Esuatini' },
    { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
    { code: '+230', flag: '🇲🇺', name: 'Mauricio' },
    { code: '+248', flag: '🇸🇨', name: 'Seychelles' },
    { code: '+269', flag: '🇰🇲', name: 'Comoras' },
    { code: '+220', flag: '🇬🇲', name: 'Gambia' },
    { code: '+224', flag: '🇬🇳', name: 'Guinea' },
    { code: '+245', flag: '🇬🇼', name: 'Guinea-Bisáu' },
    { code: '+240', flag: '🇬🇶', name: 'Guinea Ecuatorial' },
    { code: '+239', flag: '🇸🇹', name: 'Santo Tomé y Príncipe' },
    { code: '+238', flag: '🇨🇻', name: 'Cabo Verde' },
    { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
    { code: '+223', flag: '🇲🇱', name: 'Malí' },
    { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
    { code: '+227', flag: '🇳🇪', name: 'Níger' },
    { code: '+228', flag: '🇹🇬', name: 'Togo' },
    { code: '+229', flag: '🇧🇯', name: 'Benín' },
    { code: '+232', flag: '🇸🇱', name: 'Sierra Leona' },
    { code: '+231', flag: '🇱🇷', name: 'Liberia' },
    { code: '+236', flag: '🇨🇫', name: 'Rep. Centroafricana' },
    { code: '+235', flag: '🇹🇩', name: 'Chad' },
    { code: '+241', flag: '🇬🇦', name: 'Gabón' },
    { code: '+253', flag: '🇩🇯', name: 'Yibuti' },
    { code: '+252', flag: '🇸🇴', name: 'Somalia' },
    { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
    { code: '+257', flag: '🇧🇮', name: 'Burundi' },
];

// Detecta el prefijo de un número E.164.
// Prueba primero los más largos para no confundir "+1" con "+1809".
function parsePhoneNumber(full = '') {
    if (!full.startsWith('+')) return { prefix: '+34', local: full.replace(/\D/g, '') };

    const sorted = [...PREFIXES].sort((a, b) => b.code.length - a.code.length);
    for (const p of sorted) {
        if (full.startsWith(p.code)) {
            return { prefix: p.code, local: full.slice(p.code.length).replace(/\D/g, '') };
        }
    }
    // Prefijo desconocido: extraer la parte numérica inicial hasta el primer dígito repetido
    const match = full.match(/^(\+\d{1,4})(\d*)$/);
    if (match) return { prefix: match[1], local: match[2] };
    return { prefix: '+34', local: full.replace(/\D/g, '') };
}

/**
 * Props:
 *   value    – string E.164 completo, p.ej. "+34600000000" (o vacío)
 *   onChange – fn(string) con el nuevo valor combinado
 *   required – boolean
 *   error    – string de error (opcional)
 */
const PhoneInput = ({ value = '', onChange, required = false, error }) => {
    const { prefix: initPrefix, local: initLocal } = parsePhoneNumber(value);
    const [prefix, setPrefix]           = useState(initPrefix);
    const [local, setLocal]             = useState(initLocal);
    const [prefixFocused, setPrefixFocused] = useState(false);

    // Sincronizar solo cuando el perfil llega del servidor,
    // nunca mientras el usuario está escribiendo el prefijo.
    useEffect(() => {
        if (prefixFocused) return;
        const { prefix: p, local: l } = parsePhoneNumber(value);
        setPrefix(p);
        setLocal(l);
    }, [value, prefixFocused]);

    const handlePrefixChange = (e) => {
        // Forzar que empiece por +
        let val = e.target.value.trim();
        if (val && !val.startsWith('+')) val = '+' + val;
        setPrefix(val);
        onChange?.(val + local);
    };

    const handleLocalChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '');
        setLocal(digits);
        onChange?.(prefix + digits);
    };

    const borderClass = error
        ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700';

    const baseInput = [
        'block w-full px-3 py-2.5 rounded-lg border text-sm',
        'text-gray-900 dark:text-white',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'transition-colors',
        borderClass,
    ].join(' ');

    return (
        <>
            {/* datalist con todos los prefijos */}
            <datalist id="phone-prefix-list">
                {PREFIXES.map(p => (
                    <option key={p.code + p.name} value={p.code}>
                        {p.flag} {p.name}
                    </option>
                ))}
            </datalist>

            <div className="flex gap-2">
                {/* Campo de prefijo — escribible + sugerencias */}
                <div className="flex-shrink-0 w-28">
                    <input
                        type="text"
                        list="phone-prefix-list"
                        value={prefix}
                        onChange={handlePrefixChange}
                        onFocus={() => setPrefixFocused(true)}
                        onBlur={() => setPrefixFocused(false)}
                        placeholder="+34"
                        maxLength={6}
                        aria-label="Prefijo de país"
                        className={`${baseInput} text-center`}
                    />
                </div>

                {/* Campo de número — solo dígitos */}
                <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={local}
                        onChange={handleLocalChange}
                        required={required}
                        maxLength={12}
                        placeholder="600000000"
                        aria-label="Número de teléfono"
                        className={`${baseInput} pl-9`}
                    />
                </div>
            </div>
        </>
    );
};

export default PhoneInput;
