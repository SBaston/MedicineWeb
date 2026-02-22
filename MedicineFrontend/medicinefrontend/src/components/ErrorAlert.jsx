import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ error, onClose }) => {
    if (!error) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default ErrorAlert;