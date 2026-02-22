import { User } from 'lucide-react';

/**
 * Componente de Avatar del usuario
 * Muestra la imagen de perfil o iniciales si no hay imagen
 */
const UserAvatar = ({
    user,
    size = 'md',
    showName = false,
    className = ''
}) => {
    // Generar iniciales desde el nombre
    const getInitials = () => {
        if (!user) return 'U';

        const firstName = user.firstName || '';
        const lastName = user.lastName || '';

        if (!firstName && !lastName) return 'U';

        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        return initials || 'U';
    };

    // Generar avatar por defecto con las iniciales del usuario
    const generateDefaultAvatar = () => {
        const fullName = user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : 'Usuario';

        const encodedName = encodeURIComponent(fullName);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=3b82f6&color=fff&size=200&bold=true&font-size=0.4`;
    };

    // Determinar qué avatar mostrar
    const avatarUrl = user?.profilePictureUrl || generateDefaultAvatar();
    const initials = getInitials();
    const fullName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : 'Usuario';

    // Tamaños predefinidos
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
    };

    const sizeClasses = sizes[size] || sizes.md;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Avatar */}
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={fullName}
                    className={`${sizeClasses} rounded-full object-cover border-2 border-gray-200`}
                    onError={(e) => {
                        // Si falla la carga de la imagen, mostrar avatar de respaldo
                        e.target.src = generateDefaultAvatar();
                    }}
                />
            ) : (
                <div className={`${sizeClasses} rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200`}>
                    {initials}
                </div>
            )}

            {/* Nombre (opcional) */}
            {showName && (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{fullName}</span>
                    {user?.role && (
                        <span className="text-xs text-gray-500">
                            {user.role === 'Patient' ? 'Paciente' : user.role === 'Doctor' ? 'Doctor' : 'Admin'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;