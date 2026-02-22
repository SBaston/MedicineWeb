import { Check } from 'lucide-react';

const AvatarSelector = ({ selectedAvatar, onSelect, userName = '' }) => {
    // Función para generar avatar con iniciales
    const generateAvatarUrl = (name, backgroundColor, textColor = 'fff') => {
        const encodedName = encodeURIComponent(name);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=${textColor}&size=200&bold=true&font-size=0.4`;
    };

    // Si tenemos el nombre del usuario, generar su avatar personalizado
    const userInitials = userName.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);

    // Paleta de colores profesional
    const colors = [
        { bg: '3b82f6', name: 'Azul' },      // Blue
        { bg: '10b981', name: 'Verde' },     // Green
        { bg: 'f59e0b', name: 'Ámbar' },     // Amber
        { bg: 'ef4444', name: 'Rojo' },      // Red
        { bg: '8b5cf6', name: 'Púrpura' },   // Purple
        { bg: 'ec4899', name: 'Rosa' },      // Pink
        { bg: '06b6d4', name: 'Cian' },      // Cyan
        { bg: '84cc16', name: 'Lima' },      // Lime
        { bg: 'f97316', name: 'Naranja' },   // Orange
        { bg: '14b8a6', name: 'Turquesa' },  // Teal
        { bg: 'a855f7', name: 'Violeta' },   // Violet
        { bg: 'f43f5e', name: 'Rosa fuerte' }, // Rose
    ];

    // Generar avatares con el nombre del usuario
    const avatars = colors.map((color, index) => ({
        id: index + 1,
        url: generateAvatarUrl(userName || 'Usuario', color.bg),
        name: `Avatar ${color.name}`,
        color: color.bg,
    }));

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Foto de perfil
            </label>

            {userName && (
                <p className="text-sm text-gray-600 mb-3">
                    Selecciona un color para tu avatar <strong>{userInitials}</strong>
                </p>
            )}

            <div className="grid grid-cols-4 gap-4">
                {avatars.map((avatar) => (
                    <button
                        key={avatar.id}
                        type="button"
                        onClick={() => onSelect(avatar.url)}
                        className={`relative rounded-full overflow-hidden border-4 transition-all hover:scale-105 ${selectedAvatar === avatar.url
                                ? 'border-primary-600 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        title={avatar.name}
                    >
                        <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                        />
                        {selectedAvatar === avatar.url && (
                            <div className="absolute inset-0 bg-primary-600 bg-opacity-30 flex items-center justify-center">
                                <Check className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <p className="text-xs text-gray-500 mt-3">
                💡 Tu avatar mostrará tus iniciales (<strong>{userInitials || 'XX'}</strong>). Elige tu color favorito.
            </p>
        </div>
    );
};

export default AvatarSelector;