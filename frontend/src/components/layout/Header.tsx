import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Plus, CalendarCheck, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Header: React.FC = () => {
  const { user, school } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/students/')) return 'Student Profile';
    if (path.startsWith('/students')) return 'Student Directory';
    if (path.startsWith('/attendance')) return 'Attendance Management';
    if (path.startsWith('/academics')) return 'Academic Performance & Grading';
    if (path.startsWith('/classes')) return 'Classes & Sections';
    if (path.startsWith('/teachers')) return 'Teachers & Staff Directory';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/notifications')) return 'Notification Center';
    if (path.startsWith('/settings')) return 'System Settings & Rules';
    return 'Scholaris';
  };

  return (
    <header className="h-16 bg-surface border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-[17px] font-semibold text-navy-800 tracking-tight">
            {t(getPageTitle(location.pathname))}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Kannada / English Toggle Switch */}
        <button
          onClick={toggleLanguage}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer shadow-xs ${
            language === 'kn'
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-400/20'
              : 'bg-surface border-border-subtle hover:bg-slate-50 text-navy-800'
          }`}
          title={language === 'kn' ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ (Switch to Kannada)'}
        >
          <Languages className={`w-4 h-4 ${language === 'kn' ? 'text-amber-700' : 'text-slate-600'}`} />
          <span>{language === 'kn' ? 'ಕನ್ನಡ' : 'English'}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              language === 'kn' ? 'bg-amber-200/80 text-amber-950' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {language === 'kn' ? 'KN' : 'EN'}
          </span>
        </button>

        {/* Quick action buttons */}
        <button
          onClick={() => navigate('/attendance')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-slate-100 hover:bg-slate-200 text-navy-800 transition-colors cursor-pointer"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-slate" />
          <span>{t('Mark Attendance')}</span>
        </button>

        <button
          onClick={() => navigate('/students?action=new')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('New Student')}</span>
        </button>

        <div className="h-5 w-px bg-border-subtle mx-1" />

        {/* Notifications Icon Button */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 text-slate hover:text-navy-800 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
          title={t('Notifications')}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-amber-text rounded-full ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
};
