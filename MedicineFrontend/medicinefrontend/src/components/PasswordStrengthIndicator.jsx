import { Check, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password }) => {
    const requirements = [
        { label: 'Al menos 8 caracteres', test: (pwd) => pwd.length >= 8 },
        { label: 'Una letra mayúscula', test: (pwd) => /[A-Z]/.test(pwd) },
        { label: 'Una letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
        { label: 'Un número', test: (pwd) => /\d/.test(pwd) },
        { label: 'Un carácter especial (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) },
    ];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-gray-700">Requisitos de la contraseña:</p>
            <div className="space-y-1">
                {requirements.map((req, index) => {
                    const isPassed = req.test(password);
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            {isPassed ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <X className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={isPassed ? 'text-green-600' : 'text-gray-500'}>
                                {req.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PasswordStrengthIndicator;