import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Shield, Sliders, Building, History } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { School } from '../types';

export const Settings: React.FC = () => {
  const { school, updateSchool } = useAuth();
  const queryClient = useQueryClient();

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
      return res.data?.results || res.data;
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
      alert('System configurations successfully updated!');
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
        <h2 className="text-xl font-bold text-navy-800 tracking-tight">System Settings & Policies</h2>
        <p className="text-[12px] text-slate">Configure institution-wide attendance rules, thresholds, and profile</p>
      </div>

      <div className="border-b border-border-subtle flex items-center gap-2 select-none">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === 'rules' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Attendance Rules & Logic</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>School Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-navy-800 text-navy-800' : 'border-transparent text-slate hover:text-navy-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Viewer</span>
        </button>
      </div>

      {activeTab === 'rules' && (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-navy-800">Attendance Policies & Threshold Formulas</h3>
              <p className="text-[12px] text-slate">These rules govern automatic flagging, risk assessments, and report card metrics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[12px]">
              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  Mandatory Minimum Attendance Threshold (%)
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
                  Students below this percentage trigger automatic administrative alerts.
                </span>
              </div>

              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  Warning Threshold (%)
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
                  Amber warning badge threshold for proactive interventions.
                </span>
              </div>

              <div>
                <label className="block text-navy-800 font-semibold mb-1">
                  Late Arrival Absence Deduction Factor (0.0 to 1.0)
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
                  e.g. 0.20 means 5 late arrivals equal 1 instructional absence.
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
                  <span className="font-semibold text-navy-800">Count Excused Absences As Present</span>
                </label>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  If enabled, verified medical or school-sponsored absences count toward eligible sessions.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="px-5 py-2 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updateSettingsMutation.isPending ? 'Updating...' : 'Save Configuration'}</span>
              </button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-4 text-[12px]">
            <h3 className="text-base font-bold text-navy-800">School Profile Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Institution Name</label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Motto / Tagline</label>
                <input
                  type="text"
                  value={schoolForm.motto}
                  onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Campus Physical Address</label>
              <textarea
                rows={2}
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="px-5 py-2 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save School Profile</span>
              </button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-border-subtle">
            <h3 className="text-[14px] font-semibold text-navy-800">Security & Operational Audit Log</h3>
            <p className="text-[12px] text-slate">Immutable timestamped trail of administrative actions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Operator</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Model</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {auditLogs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-semibold text-navy-800">{log.user_name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate">{log.target_model} #{log.target_id}</td>
                    <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
