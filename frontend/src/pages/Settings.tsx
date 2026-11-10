import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Sliders, Building, History } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { School } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Settings: React.FC = () => {
  const { school, updateSchool } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'rules' | 'profile' | 'audit'>('rules');

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    motto: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    attendance_threshold: 75.0,
    warning_threshold: 85.0,
    late_penalty_weight: 0.2,
    excused_counts_as_present: false,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/api/audit-logs/');
      return res.data?.results || (Array.isArray(res.data) ? res.data : []);
    },
    enabled: activeTab === 'audit',
  });

  useEffect(() => {
    if (school) {
      setSchoolForm({
        name: school.name || '',
        motto: school.motto || '',
        phone: school.phone || '',
        email: school.email || '',
        website: school.website || '',
        address: school.address || '',
        attendance_threshold: Number(school.attendance_threshold) || 75.0,
        warning_threshold: Number(school.warning_threshold) || 85.0,
        late_penalty_weight: Number(school.late_penalty_weight) || 0.2,
        excused_counts_as_present: Boolean(school.excused_counts_as_present),
      });
    }
  }, [school]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch('/api/school/settings/', payload);
      return res.data;
    },
    onSuccess: (data: School) => {
      updateSchool(data);
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      alert(t('System configurations successfully updated!', 'ವ್ಯವಸ್ಥೆಯ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಣಗೊಂಡಿವೆ!'));
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update settings.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(schoolForm);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-navy-800 tracking-tight">{t('System Settings & Policies')}</h2>
        <p className="text-[12px] text-slate">{t('Configure institution-wide attendance rules, thresholds, and profile')}</p>
      </div>

      <div className="border-b border-border-subtle flex items-center gap-2 select-none">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'rules' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t('Attendance Rules & Logic')}</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{t('School Profile')}</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('Audit Logs')}</span>
        </button>
      </div>

      {activeTab === 'rules' && (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-navy-800">{t('Attendance Policies & Threshold Formulas', 'ಹಾಜರಾತಿ ನೀತಿಗಳು ಮತ್ತು ಮಾನದಂಡ ಸೂತ್ರಗಳು')}</h3>
              <p className="text-[12px] text-slate">{t('These rules govern automatic flagging, risk assessments, and report card metrics', 'ಈ ನಿಯಮಗಳು ಸ್ವಯಂಚಾಲಿತ ಎಚ್ಚರಿಕೆ ಮತ್ತು ಪ್ರಗತಿ ಪತ್ರಿಕೆಯ ಮಾನದಂಡಗಳನ್ನು ನಿಯಂತ್ರಿಸುತ್ತವೆ')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[12px]">
              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  {t('Mandatory Minimum Attendance Threshold (%)', 'ಕಡ್ಡಾಯ ಕನಿಷ್ಠ ಹಾಜರಾತಿ ಮಿತಿ (%)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={schoolForm.attendance_threshold}
                  onChange={(e) => setSchoolForm({ ...schoolForm, attendance_threshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg focus:border-navy-800 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t('Students below this percentage trigger automatic administrative alerts.', 'ಈ ಶೇಕಡಾವಾರುಗಿಂತ ಕಡಿಮೆ ಇರುವ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗುತ್ತದೆ.')}
                </span>
              </div>

              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  {t('Warning Threshold (%)', 'ಎಚ್ಚರಿಕೆ ಮಿತಿ (%)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={schoolForm.warning_threshold}
                  onChange={(e) => setSchoolForm({ ...schoolForm, warning_threshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg focus:border-navy-800 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t('Amber warning badge threshold for proactive interventions.', 'ಪೂರ್ವಭಾವಿ ಗಮನಕ್ಕಾಗಿ ಎಚ್ಚರಿಕೆಯ ಬ್ಯಾಡ್ಜ್ ಮಿತಿ.')}
                </span>
              </div>

              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  {t('Late Arrival Absence Deduction Factor (0.0 to 1.0)', 'ತಡವಾಗಿ ಆಗಮನದ ಗೈರುಹಾಜರಿ ಕಡಿತದ ಅಂಶ')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={schoolForm.late_penalty_weight}
                  onChange={(e) => setSchoolForm({ ...schoolForm, late_penalty_weight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg focus:border-navy-800 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t('e.g. 0.20 means 5 late arrivals equal 1 instructional absence.', 'ಉದಾ: 0.20 ಎಂದರೆ 5 ತಡವಾದ ಆಗಮನಗಳು 1 ದಿನದ ಗೈರುಹಾಜರಿಗೆ ಸಮ.')}
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schoolForm.excused_counts_as_present}
                    onChange={(e) => setSchoolForm({ ...schoolForm, excused_counts_as_present: e.target.checked })}
                    className="w-4 h-4 rounded border-border-subtle text-navy-800 focus:ring-0"
                  />
                  <span className="font-semibold text-navy-800">{t('Count Excused Absences As Present', 'ಅನುಮತಿ ಪಡೆದ ಗೈರುಹಾಜರಿಯನ್ನು ಹಾಜರೆಂದು ಪರಿಗಣಿಸಿ')}</span>
                </label>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t('If enabled, verified medical or school-sponsored absences count toward eligible sessions.', 'ಸಕ್ರಿಯಗೊಳಿಸಿದರೆ, ವೈದ್ಯಕೀಯ ರಜೆಗಳನ್ನು ಹಾಜರೆಂದು ಲೆಕ್ಕಿಸಲಾಗುತ್ತದೆ.')}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="px-5 py-2 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{updateSettingsMutation.isPending ? t('Updating...', 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...') : t('Save Configuration')}</span>
              </button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-4 text-[12px]">
            <h3 className="text-base font-bold text-navy-800">{t('School Profile Details', 'ಶಾಲಾ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('School Name')}</label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('Motto / Tagline')}</label>
                <input
                  type="text"
                  value={schoolForm.motto}
                  onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('Official Email')}</label>
                <input
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('Official Phone')}</label>
                <input
                  type="text"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('Campus Address')}</label>
              <textarea
                rows={2}
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
            <div className="pt-3 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="px-4 py-2 font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 cursor-pointer disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? t('Updating...', 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...') : t('Save Configuration')}
              </button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-border-subtle">
            <h3 className="text-[14px] font-semibold text-navy-800">{t('Audit Logs')}</h3>
            <p className="text-[12px] text-slate">{t('Chronological system operations and modifications', 'ಸಿಸ್ಟಮ್ ಕಾರ್ಯಾಚರಣೆಗಳು ಮತ್ತು ಬದಲಾವಣೆಗಳ ದಾಖಲೆ')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">{t('Date')}</th>
                  <th className="py-2.5 px-4">{t('Actions')}</th>
                  <th className="py-2.5 px-4">{t('Staff Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 text-slate">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-4 font-mono font-medium text-navy-800">{log.action}</td>
                      <td className="py-2 px-4 text-slate-700">{log.description || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate">
                      {t('No system audit events recorded yet.', 'ಯಾವುದೇ ಆಡಿಟ್ ಘಟನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
