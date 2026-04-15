// Mapa de mensajes de error del backend (en español) a claves de traducción.
// Permite mostrar los errores del servidor en el idioma activo del usuario.
const ERROR_MAP = {
    'El email ya está registrado':                        'errors.emailTaken',
    'El número de colegiado ya está registrado':          'errors.licenseTaken',
    'La imagen frontal del carnet de colegiado es obligatoria': 'errors.licenseFrontRequired',
    'La imagen trasera del carnet de colegiado es obligatoria': 'errors.licenseBackRequired',
    'La imagen frontal del DNI es obligatoria':           'errors.idFrontRequired',
    'La imagen trasera del DNI es obligatoria':           'errors.idBackRequired',
    'El título de especialidad es obligatorio':           'errors.specialtyDegreeRequired',
    'El título universitario es obligatorio':             'errors.universityDegreeRequired',
    'Error interno del servidor':                         'errors.serverError',
    'Email o contraseña incorrectos':                    'errors.wrongCredentials',
    'Ya existe un usuario con ese email.':               'errors.userEmailTaken',
    'Ya existe una especialidad con ese nombre':         'errors.specialtyExists',
};

/**
 * Traduce un mensaje de error del backend al idioma activo.
 * Si el mensaje no está en el mapa, lo devuelve sin cambios.
 *
 * @param {string} message  - Mensaje recibido del servidor
 * @param {Function} t      - Función de traducción de useLanguage
 * @returns {string}
 */
export function translateError(message, t) {
    if (!message) return message;
    const key = ERROR_MAP[message.trim()];
    return key ? t(key) : message;
}
