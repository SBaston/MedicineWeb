import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileCompletionAlert = ({ completion, missingFields }) => {
    if (completion === 100) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-green-800 font-semibold mb-1">
                        ¡Perfil completo!
                    </h3>
                    <p className="text-green-700 text-sm">
                        Tu perfil está completo al 100%. Ahora puedes reservar citas con total normalidad.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-yellow-800 font-semibold mb-1">
                        Completa tu perfil ({completion}%)
                    </h3>
                    <p className="text-yellow-700 text-sm">
                        Para poder reservar citas y recibir mejor atención médica, completa la información de tu perfil.
                    </p>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3">
                <div className="w-full bg-yellow-100 rounded-full h-2">
                    <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completion}%` }}
                    />
                </div>
            </div>

            {/* Campos faltantes */}
            <div className="mb-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                    Campos faltantes:
                </p>
                <div className="flex flex-wrap gap-2">
                    {missingFields.map((field, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-white border border-yellow-200 rounded-full text-xs text-yellow-700"
                        >
                            {field}
                        </span>
                    ))}
                </div>
            </div>

            {/* Botón para completar */}
            <Link
                to="/profile/edit"
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
                Completar perfil
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

export default ProfileCompletionAlert;