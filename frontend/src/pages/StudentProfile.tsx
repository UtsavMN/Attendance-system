import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Calendar,
  GraduationCap,
  TrendingUp,
  Award,
  Download,
  Plus,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../api/client';
import { downloadAuthorizedFile } from '../utils/download';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { StudentFullProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'academics' | 'performance' | 'activity'>('overview');
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);

  // New Remark Form
  const [remarkTitle, setRemarkTitle] = useState('');
  const [remarkCategory, setRemarkCategory] = useState('ACADEMIC');
  const [remarkSeverity, setRemarkSeverity] = useState('POSITIVE');
  const [remarkDescription, setRemarkDescription] = useState('');

  const { data: profile, isLoading, error } = useQuery<StudentFullProfile>({
    queryKey: ['student-profile', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/students/${id}/full-profile/`);
      return res.data;
    },
    enabled: !!id,
  });

  const createRemarkMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/student-remarks/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile', id] });
      setIsRemarkModalOpen(false);
      setRemarkTitle('');
      setRemarkDescription('');
      alert(t('Remark successfully recorded.', 'ಷರಾ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ.'));
    }
  });

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    createRemarkMutation.mutate({
      student: id,
      title: remarkTitle,
      category: remarkCategory,
      severity: remarkSeverity,
      description: remarkDescription,
      date: new Date().toISOString().split('T')[0]
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-surface rounded-xl border border-border-subtle" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="h-96 bg-surface rounded-xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-12 text-center bg-surface rounded-xl border border-border-subtle">
        <p className="text-slate font-medium">{t('Student profile not found or server error.', 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಸರ್ವರ್ ದೋಷ.')}</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 px-4 py-2 text-[12px] bg-navy-800 text-white rounded-lg cursor-pointer"
        >
          {t('Return to Student Directory', 'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ')}
        </button>
      </div>
    );
  }

  const { student, attendance_summary, academic_summary, remarks, achievements } = profile;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate hover:text-navy-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('Back to Student Directory')}</span>
        </button>
      </div>

      {/* Executive Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-border-subtle shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-200 text-navy-800 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                {student.first_name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-navy-800 tracking-tight">
                  {student.full_name}
                </h1>
                <Badge variant={student.status === 'ACTIVE' ? 'green' : 'slate'} size="sm">
                  {t(student.status)}
                </Badge>
                {attendance_summary.is_low_attendance && (
                  <Badge variant="red" size="sm">
                    {t('Attendance Warning', 'ಹಾಜರಾತಿ ಎಚ್ಚರಿಕೆ')} (&lt;{attendance_summary.threshold}%)
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px] text-slate font-medium">
                <span className="font-mono text-navy-800">{t('Admission No')}: {student.admission_number}</span>
                <span>•</span>
                <span>
                  {student.current_enrollment?.class_name} - {t('Section')} {student.current_enrollment?.section_name}
                </span>
                <span>•</span>
                <span>{t('Roll No')}: #{student.current_enrollment?.roll_number || 'N/A'}</span>
                <span>•</span>
                <span>{t(student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : 'Other')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsRemarkModalOpen(true)}
              className="px-3 py-2 text-[12px] font-medium rounded-lg border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Add Remark')}</span>
            </button>
            <button
              onClick={() => downloadAuthorizedFile(`/api/reports/student-report-card-pdf/${student.id}/`, `${student.admission_number}_Report_Card.pdf`)}
              className="px-3.5 py-2 text-[12px] font-semibold rounded-lg bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Official PDF Report Card')}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            {t('Attendance Rate')}
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {attendance_summary.percentage}%
          </div>
          <span className="text-[11px] text-slate-500">
            {attendance_summary.total_sessions} {t('sessions tracked')}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            {t('Days Present')}
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {attendance_summary.present_count}
          </div>
          <span className="text-[11px] text-slate-500">
            + {attendance_summary.late_count} {t('Late Arrivals')}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            {t('Days Absent')}
          </span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {attendance_summary.absent_count}
          </div>
          <span className="text-[11px] text-slate-500">
            {attendance_summary.excused_count} {t('Excused')}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            {t('Academic Average')}
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {academic_summary.overall_average !== null && academic_summary.overall_average !== undefined ? `${academic_summary.overall_average}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">{t('All examinations')}</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            {t('Current Grade & GPA')}
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {academic_summary.overall_grade || 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">
            GPA: {academic_summary.current_gpa ?? 'N/A'} / 4.0
          </span>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border-subtle flex items-center gap-1 select-none overflow-x-auto">
        {[
          { key: 'overview', label: t('Overview'), icon: User },
          { key: 'attendance', label: t('Attendance History'), icon: Calendar },
          { key: 'academics', label: t('Academics & Grades'), icon: GraduationCap },
          { key: 'performance', label: t('Performance Analytics'), icon: TrendingUp },
          { key: 'activity', label: t('Activity & Remarks'), icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-navy-800 text-navy-800 font-semibold'
                  : 'border-transparent text-slate hover:text-navy-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-3 border-b border-border-subtle pb-2">
                {t('Personal Demographics')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
                <div>
                  <span className="text-slate block">{t('Date of Birth')}</span>
                  <span className="font-semibold text-navy-800">{student.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Blood Group')}</span>
                  <span className="font-semibold text-navy-800">{student.blood_group || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Admission Date')}</span>
                  <span className="font-semibold text-navy-800">{student.admission_date}</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Email Address')}</span>
                  <span className="font-semibold text-navy-800">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Contact Phone')}</span>
                  <span className="font-semibold text-navy-800">{student.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Previous School')}</span>
                  <span className="font-semibold text-navy-800">{student.previous_school || 'None'}</span>
                </div>
              </div>
              <div className="mt-3 text-[12px]">
                <span className="text-slate block">{t('Residential Address')}</span>
                <span className="font-medium text-navy-800">{student.address || 'Address on record'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-3 border-b border-border-subtle pb-2">
                {t('Guardian Information')}
              </h3>
              {student.guardians && student.guardians.length > 0 ? (
                student.guardians.map((g, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/60 rounded-lg border border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    <div>
                      <span className="text-slate block">{t('Name')}</span>
                      <span className="font-semibold text-navy-800">{g.guardian.full_name}</span>
                    </div>
                    <div>
                      <span className="text-slate block">{t('Relationship')}</span>
                      <span className="font-semibold text-navy-800">{t(g.guardian.relationship)}</span>
                    </div>
                    <div>
                      <span className="text-slate block">{t('Phone')}</span>
                      <span className="font-semibold text-navy-800">{g.guardian.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate block">{t('Occupation')}</span>
                      <span className="font-semibold text-navy-800">{g.guardian.occupation || 'N/A'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate">{t('No guardian records linked.')}</p>
              )}
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-2 border-b border-border-subtle pb-2">
                {t('Emergency & Health Notes')}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <span className="text-slate block">{t('Emergency Contact')}</span>
                  <span className="font-semibold text-navy-800">{student.emergency_contact_name || 'N/A'}</span>
                  <span className="text-slate-500 block">{student.emergency_contact_phone} ({student.emergency_contact_relation})</span>
                </div>
                <div>
                  <span className="text-slate block">{t('Medical Notes (Restricted)')}</span>
                  <p className="font-medium text-navy-800 mt-0.5">{student.medical_notes || 'No medical conditions noted.'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Side summary column */}
          <div className="space-y-6">
            <Card>
              <h4 className="text-[13px] font-semibold text-navy-800 mb-3">{t('Academic Summary')}</h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Overall Average:')}</span>
                  <span className="font-semibold text-navy-800">
                    {academic_summary.overall_average !== null && academic_summary.overall_average !== undefined ? `${academic_summary.overall_average}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Grade Evaluation:')}</span>
                  <span className="font-semibold text-navy-800">{academic_summary.overall_grade || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Examinations Taken:')}</span>
                  <span className="font-semibold text-navy-800">{academic_summary.examinations.length}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="text-[13px] font-semibold text-navy-800 mb-3">{t('Attendance Summary')}</h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Attendance Status:')}</span>
                  <span className={`font-semibold ${attendance_summary.is_low_attendance ? 'text-accent-red-text' : 'text-emerald-700'}`}>
                    {attendance_summary.percentage}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Present / Total Days:')}</span>
                  <span className="font-semibold text-navy-800">{attendance_summary.present_count} / {attendance_summary.total_sessions}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">{t('Late Arrivals:')}</span>
                  <span className="font-semibold text-amber-700">{attendance_summary.late_count}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-navy-800">{t('Monthly Attendance Progression', 'ಮಾಸಿಕ ಹಾಜರಾತಿ ಪ್ರಗತಿ')}</h3>
              <p className="text-[12px] text-slate">{t('Attendance percentage month-by-month', 'ತಿಂಗಳುವಾರು ಹಾಜರಾತಿ ಶೇಕಡಾವಾರು')}</p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendance_summary.monthly_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" unit="%" />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#17243A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-navy-800">{t('Date-wise Attendance Log', 'ದಿನಾಂಕವಾರು ಹಾಜರಾತಿ ದಾಖಲೆ')}</h3>
              <span className="text-[11px] text-slate">{t('Showing past sessions', 'ಹಿಂದಿನ ಅವಧಿಗಳು')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50 text-slate uppercase text-[11px] font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-4">{t('Date')}</th>
                    <th className="py-2.5 px-4">{t('Subject')}</th>
                    <th className="py-2.5 px-4">{t('Status')}</th>
                    <th className="py-2.5 px-4">{t('Staff Notes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {attendance_summary.recent_records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-medium text-navy-800">{r.date}</td>
                      <td className="py-2.5 px-4 text-slate capitalize">
                        {(r as any).subject_name || (r.session_type ? r.session_type.replace('_', ' ').toLowerCase() : 'Class Session')}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            r.status === 'PRESENT'
                              ? 'green'
                              : r.status === 'LATE'
                              ? 'amber'
                              : r.status === 'EXCUSED'
                              ? 'blue'
                              : 'red'
                          }
                          size="sm"
                        >
                          {t(r.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate">{r.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: ACADEMICS & GRADES */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          {academic_summary.examinations.length === 0 ? (
            <Card className="p-10 text-center text-slate">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-navy-800 text-[14px]">{t('No Examination Marks Recorded Yet', 'ಇನ್ನೂ ಯಾವುದೇ ಪರೀಕ್ಷಾ ಅಂಕಗಳು ದಾಖಲಾಗಿಲ್ಲ')}</p>
              <p className="text-[12px] text-slate-500 mt-1">{t('Enter examination marks in the Academics module to view grade transcripts.', 'ಅಂಕಗಳ ಪಟ್ಟಿಯನ್ನು ವೀಕ್ಷಿಸಲು ಶೈಕ್ಷಣಿಕ ವಿಭಾಗದಲ್ಲಿ ಅಂಕಗಳನ್ನು ನಮೂದಿಸಿ.')}</p>
            </Card>
          ) : (
            academic_summary.examinations.map((ex) => (
              <Card key={ex.exam_id} className="p-0 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-navy-800 text-[14px]">{ex.exam_name}</h3>
                    <span className="text-[11px] text-slate font-medium">{ex.term}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-navy-800">
                      {t('Term Average:')} {ex.average_percentage}%
                    </span>
                    <Badge variant="navy" size="sm">{t('Grade')}: {ex.overall_grade}</Badge>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-slate-50/40 text-slate uppercase text-[11px] font-semibold border-b border-border-subtle">
                      <tr>
                        <th className="py-2.5 px-5">{t('Subject')}</th>
                        <th className="py-2.5 px-4 text-center">{t('Max Marks')}</th>
                        <th className="py-2.5 px-4 text-center">{t('Marks Obtained')}</th>
                        <th className="py-2.5 px-4 text-center">{t('Percentage')}</th>
                        <th className="py-2.5 px-4 text-center">{t('Letter Grade')}</th>
                        <th className="py-2.5 px-5">{t('Teacher Feedback')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {ex.subjects.map((sub, sidx) => (
                        <tr key={sidx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-5 font-semibold text-navy-800">{sub.subject}</td>
                          <td className="py-2.5 px-4 text-center text-slate">{sub.max_marks}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-navy-800">
                            {sub.is_absent ? t('Absent') : sub.marks_obtained}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {sub.is_absent ? '-' : `${sub.percentage}%`}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Badge variant={sub.percentage >= 70 ? 'green' : sub.percentage >= 50 ? 'amber' : 'red'} size="sm">
                              {sub.grade}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-5 text-slate">{sub.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 4: PERFORMANCE ANALYTICS */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-[14px] font-semibold text-navy-800 mb-1">{t('Subject Proficiency Breakdown', 'ವಿಷಯವಾರು ಪ್ರಾವೀಣ್ಯತೆಯ ವಿಶ್ಲೇಷಣೆ')}</h3>
            <p className="text-[12px] text-slate mb-4">{t('Average score achieved in each subject discipline', 'ಪ್ರತಿ ವಿಷಯದಲ್ಲಿ ಸಾಧಿಸಿದ ಸರಾಸರಿ ಅಂಕಗಳು')}</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={academic_summary.subject_performance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8EBF0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#E8EBF0" unit="%" />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} stroke="#E8EBF0" />
                  <Tooltip />
                  <Bar dataKey="average" fill="#5276A7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-1">{t('Subject Strengths & Focus Areas', 'ವಿಷಯದ ಸಾಮರ್ಥ್ಯಗಳು & ಗಮನ ಅಗತ್ಯವಿರುವ ಕ್ಷೇತ್ರಗಳು')}</h3>
              <p className="text-[12px] text-slate mb-4">{t('Identified academic strengths and recommended focus areas', 'ಗುರುತಿಸಲಾದ ಶೈಕ್ಷಣಿಕ ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಸುಧಾರಣೆಯ ಕ್ಷೇತ್ರಗಳು')}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[12px] font-semibold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('Academic Strengths', 'ಶೈಕ್ಷಣಿಕ ಸಾಮರ್ಥ್ಯಗಳು')} (&gt;= 75%)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {academic_summary.strengths.length > 0 ? (
                      academic_summary.strengths.map((s, idx) => (
                        <Badge key={idx} variant="green">
                          {s.subject} ({s.average}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-slate">{t('None identified yet.', 'ಇನ್ನೂ ಗುರುತಿಸಲಾಗಿಲ್ಲ.')}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> {t('Areas for Improvement', 'ಸುಧಾರಣೆಯ ಕ್ಷೇತ್ರಗಳು')} (&lt; 60%)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {academic_summary.weaknesses.length > 0 ? (
                      academic_summary.weaknesses.map((w, idx) => (
                        <Badge key={idx} variant="amber">
                          {w.subject} ({w.average}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-emerald-700 font-medium">{t('All subjects are performing at or above 60%.', 'ಎಲ್ಲಾ ವಿಷಯಗಳಲ್ಲಿ 60% ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಸಾಧನೆ ಇದೆ.')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle mt-4 text-[12px] text-slate">
              <span>{t('Overall Standing: ', 'ಒಟ್ಟಾರೆ ಶ್ರೇಣಿ: ')}</span>
              <span className="font-semibold text-navy-800">
                {academic_summary.overall_average && academic_summary.overall_average >= 80
                  ? t('First Class with Distinction', 'ವಿಶಿಷ್ಟ ಪ್ರಥಮ ಶ್ರೇಣಿ')
                  : t('Satisfactory Academic Standing', 'ತೃಪ್ತಿದಾಯಕ ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ')}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: ACTIVITY & REMARKS */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Achievements Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-navy-800">{t('Official Student Achievements', 'ಅಧಿಕೃತ ವಿದ್ಯಾರ್ಥಿ ಸಾಧನೆಗಳು')}</h3>
                <p className="text-[12px] text-slate">{t('Honors, competitions, Olympiads, and athletic awards', 'ಪ್ರಶಸ್ತಿಗಳು, ಸ್ಪರ್ಧೆಗಳು, ಒಲಿಂಪಿಯಾಡ್ ಮತ್ತು ಕ್ರೀಡಾ ಪುರಸ್ಕಾರಗಳು')}</p>
              </div>
            </div>

            {achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                {achievements.map((ach) => (
                  <div key={ach.id} className="p-3.5 rounded-lg border border-border-subtle bg-slate-50/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-800">{ach.title}</h4>
                      <p className="text-slate-600 mt-0.5">{ach.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                        <span>{ach.award_date}</span>
                        <span>•</span>
                        <span>{ach.category}</span>
                        {ach.award_level && <span>• {ach.award_level}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate py-4 text-center">{t('No official achievements logged yet.', 'ಇನ್ನೂ ಯಾವುದೇ ಸಾಧನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.')}</p>
            )}
          </Card>

          {/* Teacher Remarks Feed */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-navy-800">{t('Staff Observations & Remarks', 'ಸಿಬ್ಬಂದಿ ಅವಲೋಕನಗಳು & ಷರಾಗಳು')}</h3>
                <p className="text-[12px] text-slate">{t('Teacher observations on conduct, discipline, and participation', 'ನಡತೆ, ಶಿಸ್ತು ಮತ್ತು ಭಾಗವಹಿಸುವಿಕೆಯ ಕುರಿತು ಶಿಕ್ಷಕರ ಟಿಪ್ಪಣಿಗಳು')}</p>
              </div>
              <button
                onClick={() => setIsRemarkModalOpen(true)}
                className="px-3 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Remark')}</span>
              </button>
            </div>

            {remarks && remarks.length > 0 ? (
              <div className="space-y-3">
                {remarks.map((rem) => (
                  <div key={rem.id} className="p-4 rounded-lg border border-border-subtle bg-surface">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy-800 text-[13px]">{rem.title}</span>
                        <Badge
                          variant={
                            rem.severity === 'POSITIVE'
                              ? 'green'
                              : rem.severity === 'WARNING'
                              ? 'amber'
                              : rem.severity === 'CRITICAL'
                              ? 'red'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {rem.severity}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate">{rem.date}</span>
                    </div>
                    <p className="text-[12px] text-slate-700">{rem.description}</p>
                    <div className="mt-2 text-[11px] text-slate-500 font-medium">
                      {t('Recorded by: ')} <span className="text-navy-800">{rem.author_name}</span> ({rem.category})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate py-4 text-center">{t('No disciplinary or academic remarks recorded.', 'ಯಾವುದೇ ಶಿಸ್ತು ಅಥವಾ ಶೈಕ್ಷಣಿಕ ಷರಾಗಳು ದಾಖಲಾಗಿಲ್ಲ.')}</p>
            )}
          </Card>
        </div>
      )}

      {/* Add Remark Modal */}
      <Modal
        isOpen={isRemarkModalOpen}
        onClose={() => setIsRemarkModalOpen(false)}
        title={t('Record Staff Observation / Remark', 'ಸಿಬ್ಬಂದಿ ಅವಲೋಕನ / ಷರಾ ದಾಖಲಿಸಿ')}
        subtitle={`${t('Adding record for')} ${student.full_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddRemark} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">{t('Title *', 'ಶೀರ್ಷಿಕೆ *')}</label>
            <input
              type="text"
              required
              value={remarkTitle}
              onChange={(e) => setRemarkTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. Outstanding class participation"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('Category', 'ವರ್ಗ')}</label>
              <select
                value={remarkCategory}
                onChange={(e) => setRemarkCategory(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="ACADEMIC">{t('Academic')}</option>
                <option value="DISCIPLINE">{t('Discipline', 'ಶಿಸ್ತು')}</option>
                <option value="ATTENDANCE">{t('Attendance')}</option>
                <option value="ACHIEVEMENT">{t('Achievement', 'ಸಾಧನೆ')}</option>
                <option value="GENERAL">{t('General', 'ಸಾಮಾನ್ಯ')}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('Severity', 'ತೀವ್ರತೆ')}</label>
              <select
                value={remarkSeverity}
                onChange={(e) => setRemarkSeverity(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="POSITIVE">{t('Positive / Praise', 'ಪ್ರಶಂಸನೀಯ')}</option>
                <option value="NEUTRAL">{t('Neutral', 'ತಟಸ್ಥ')}</option>
                <option value="WARNING">{t('Warning', 'ಎಚ್ಚರಿಕೆ')}</option>
                <option value="CRITICAL">{t('Critical', 'ಗಂಭೀರ')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">{t('Detailed Description *', 'ವಿವರವಾದ ವಿವರಣೆ *')}</label>
            <textarea
              required
              rows={3}
              value={remarkDescription}
              onChange={(e) => setRemarkDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="Provide comprehensive details for school audit logs..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsRemarkModalOpen(false)}
              className="px-3 py-1.5 text-[12px] border border-border-subtle rounded-md hover:bg-slate-100 cursor-pointer"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={createRemarkMutation.isPending}
              className="px-4 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50 cursor-pointer"
            >
              {createRemarkMutation.isPending ? t('Saving...') : t('Save', 'ದಾಖಲಿಸಿ')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
