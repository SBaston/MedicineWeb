// ═══════════════════════════════════════════════════════════════
// DoctorSocialMediaPage.jsx
// Gestión de redes sociales del doctor
// Route: /doctor/social-media
// ═══════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import SocialMediaSection from '../components/SocialMediaSection';

const DoctorSocialMediaPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <span className="text-slate-300">/</span>
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-teal-600" />
                        <h1 className="text-lg font-bold text-slate-900">Redes Sociales</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <SocialMediaSection />
            </div>
        </div>
    );
};

export default DoctorSocialMediaPage;
