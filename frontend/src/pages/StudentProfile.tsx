import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Calendar,
  GraduationCap,
  TrendingUp,
  Award,
  FileText,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Download,
  Plus,
  ChevronLeft,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { apiClient, API_BASE_URL } from '../api/client';
import { downloadAuthorizedFile } from '../utils/download';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { StudentFullProfile } from '../types';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      alert('Remark successfully recorded.');
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
        <p className="text-slate font-medium">Student profile not found or server error.</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 px-4 py-2 text-[12px] bg-navy-800 text-white rounded-lg"
        >
          Return to Student Directory
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
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate hover:text-navy-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Student Directory</span>
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
                  {student.status}
                </Badge>
                {attendance_summary.is_low_attendance && (
                  <Badge variant="red" size="sm">
                    Attendance Warning (&lt;{attendance_summary.threshold}%)
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px] text-slate font-medium">
                <span className="font-mono text-navy-800">Adm: {student.admission_number}</span>
                <span>•</span>
                <span>
                  {student.current_enrollment?.class_name} - Section {student.current_enrollment?.section_name}
                </span>
                <span>•</span>
                <span>Roll: #{student.current_enrollment?.roll_number || 'N/A'}</span>
                <span>•</span>
                <span>{student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : 'Other'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsRemarkModalOpen(true)}
              className="px-3 py-2 text-[12px] font-medium rounded-lg border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Remark</span>
            </button>
            <button
              onClick={() => downloadAuthorizedFile(`/api/reports/student-report-card-pdf/${student.id}/`, `${student.admission_number}_Report_Card.pdf`)}
              className="px-3.5 py-2 text-[12px] font-semibold rounded-lg bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Official PDF Report Card</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {attendance_summary.percentage}%
          </div>
          <span className="text-[11px] text-slate-500">
            {attendance_summary.total_sessions} sessions tracked
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            Days Present
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {attendance_summary.present_count}
          </div>
          <span className="text-[11px] text-slate-500">
            + {attendance_summary.late_count} late arrivals
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            Days Absent
          </span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {attendance_summary.absent_count}
          </div>
          <span className="text-[11px] text-slate-500">
            {attendance_summary.excused_count} excused absences
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            Academic Average
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {academic_summary.overall_average !== null ? `${academic_summary.overall_average}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">All examinations</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
            Current Grade & GPA
          </span>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {academic_summary.overall_grade}
          </div>
          <span className="text-[11px] text-slate-500">
            GPA: {academic_summary.current_gpa ?? 'N/A'} / 4.0
          </span>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border-subtle flex items-center gap-1 select-none">
        {[
          { key: 'overview', label: 'Overview', icon: User },
          { key: 'attendance', label: 'Attendance History', icon: Calendar },
          { key: 'academics', label: 'Academics & Grades', icon: GraduationCap },
          { key: 'performance', label: 'Performance Analytics', icon: TrendingUp },
          { key: 'activity', label: 'Activity & Remarks', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
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
                Personal Demographics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
                <div>
                  <span className="text-slate block">Date of Birth</span>
                  <span className="font-semibold text-navy-800">{student.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-slate block">Blood Group</span>
                  <span className="font-semibold text-navy-800">{student.blood_group || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">Admission Date</span>
                  <span className="font-semibold text-navy-800">{student.admission_date}</span>
                </div>
                <div>
                  <span className="text-slate block">Email Address</span>
                  <span className="font-semibold text-navy-800">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">Contact Phone</span>
                  <span className="font-semibold text-navy-800">{student.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block">Previous School</span>
                  <span className="font-semibold text-navy-800">{student.previous_school || 'None'}</span>
                </div>
              </div>
              <div className="mt-3 text-[12px]">
                <span className="text-slate block">Residential Address</span>
                <span className="font-medium text-navy-800">{student.address || 'Address on record'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-3 border-b border-border-subtle pb-2">
                Guardian Information
              </h3>
              {student.guardians && student.guardians.length > 0 ? (
                student.guardians.map((g, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/60 rounded-lg border border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    <div>
                      <span className="text-slate block">Name</span>
                      <span className="font-semibold text-navy-800">{g.guardian.full_name}</span>
                    </div>
                    <div>
                      <span className="text-slate block">Relationship</span>
                      <span className="font-semibold text-navy-800">{g.guardian.relationship}</span>
                    </div>
                    <div>
                      <span className="text-slate block">Phone</span>
                      <span className="font-semibold text-navy-800">{g.guardian.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate block">Occupation</span>
                      <span className="font-semibold text-navy-800">{g.guardian.occupation || 'N/A'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate">No guardian records linked.</p>
              )}
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-navy-800 mb-2 border-b border-border-subtle pb-2">
                Emergency & Health Notes
              </h3>
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <span className="text-slate block">Emergency Contact</span>
                  <span className="font-semibold text-navy-800">{student.emergency_contact_name || 'N/A'}</span>
                  <span className="text-slate-500 block">{student.emergency_contact_phone} ({student.emergency_contact_relation})</span>
                </div>
                <div>
                  <span className="text-slate block">Medical Notes (Restricted)</span>
                  <p className="font-medium text-navy-800 mt-0.5">{student.medical_notes || 'No medical conditions noted.'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Side summary column */}
          <div className="space-y-6">
            <Card>
              <h4 className="text-[13px] font-semibold text-navy-800 mb-3">Academic Summary</h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Overall Average:</span>
                  <span className="font-semibold text-navy-800">
                    {academic_summary.overall_average !== null ? `${academic_summary.overall_average}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Grade Evaluation:</span>
                  <span className="font-semibold text-navy-800">{academic_summary.overall_grade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Examinations Taken:</span>
                  <span className="font-semibold text-navy-800">{academic_summary.examinations.length}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="text-[13px] font-semibold text-navy-800 mb-3">Attendance Summary</h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Attendance Status:</span>
                  <span className={`font-semibold ${attendance_summary.is_low_attendance ? 'text-accent-red-text' : 'text-emerald-700'}`}>
                    {attendance_summary.percentage}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Present / Total Days:</span>
                  <span className="font-semibold text-navy-800">{attendance_summary.present_count} / {attendance_summary.total_sessions}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-slate">Late Arrivals:</span>
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
              <h3 className="text-[14px] font-semibold text-navy-800">Monthly Attendance Progression</h3>
              <p className="text-[12px] text-slate">Attendance percentage month-by-month</p>
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
              <h3 className="text-[14px] font-semibold text-navy-800">Date-wise Attendance Log</h3>
              <span className="text-[11px] text-slate">Showing past 30 sessions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50 text-slate uppercase text-[11px] font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Session</th>
                    <th className="py-2.5 px-4">Attendance Status</th>
                    <th className="py-2.5 px-4">Remarks / Staff Notes</th>
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
                          {r.status}
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
          {academic_summary.examinations.map((ex) => (
            <Card key={ex.exam_id} className="p-0 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-navy-800 text-[14px]">{ex.exam_name}</h3>
                  <span className="text-[11px] text-slate font-medium">{ex.term}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-navy-800">
                    Term Average: {ex.average_percentage}%
                  </span>
                  <Badge variant="navy" size="sm">Grade: {ex.overall_grade}</Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50/40 text-slate uppercase text-[11px] font-semibold border-b border-border-subtle">
                    <tr>
                      <th className="py-2.5 px-5">Subject</th>
                      <th className="py-2.5 px-4 text-center">Max Marks</th>
                      <th className="py-2.5 px-4 text-center">Marks Obtained</th>
                      <th className="py-2.5 px-4 text-center">Percentage</th>
                      <th className="py-2.5 px-4 text-center">Letter Grade</th>
                      <th className="py-2.5 px-5">Teacher Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {ex.subjects.map((sub, sidx) => (
                      <tr key={sidx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-5 font-semibold text-navy-800">{sub.subject}</td>
                        <td className="py-2.5 px-4 text-center text-slate">{sub.max_marks}</td>
                        <td className="py-2.5 px-4 text-center font-semibold text-navy-800">
                          {sub.is_absent ? 'ABS' : sub.marks_obtained}
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
          ))}
        </div>
      )}

      {/* TAB CONTENT 4: PERFORMANCE ANALYTICS */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-[14px] font-semibold text-navy-800 mb-1">Subject Proficiency Breakdown</h3>
            <p className="text-[12px] text-slate mb-4">Average score achieved in each subject discipline</p>
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
              <h3 className="text-[14px] font-semibold text-navy-800 mb-1">Subject Strengths & Focus Areas</h3>
              <p className="text-[12px] text-slate mb-4">Identified academic strengths and recommended focus areas</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[12px] font-semibold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Academic Strengths (&gt;= 75%)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {academic_summary.strengths.length > 0 ? (
                      academic_summary.strengths.map((s, idx) => (
                        <Badge key={idx} variant="green">
                          {s.subject} ({s.average}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-slate">None identified yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Areas for Improvement (&lt; 60%)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {academic_summary.weaknesses.length > 0 ? (
                      academic_summary.weaknesses.map((w, idx) => (
                        <Badge key={idx} variant="amber">
                          {w.subject} ({w.average}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-emerald-700 font-medium">All subjects are performing at or above 60%.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle mt-4 text-[12px] text-slate">
              <span>Overall Standing: </span>
              <span className="font-semibold text-navy-800">
                {academic_summary.overall_average && academic_summary.overall_average >= 80
                  ? 'First Class with Distinction'
                  : 'Satisfactory Academic Standing'}
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
                <h3 className="text-[14px] font-semibold text-navy-800">Official Student Achievements</h3>
                <p className="text-[12px] text-slate">Honors, competitions, Olympiads, and athletic awards</p>
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
              <p className="text-[12px] text-slate py-4 text-center">No official achievements logged yet.</p>
            )}
          </Card>

          {/* Teacher Remarks Feed */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-navy-800">Staff Observations & Remarks</h3>
                <p className="text-[12px] text-slate">Teacher observations on conduct, discipline, and participation</p>
              </div>
              <button
                onClick={() => setIsRemarkModalOpen(true)}
                className="px-3 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Observation</span>
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
                      Recorded by: <span className="text-navy-800">{rem.author_name}</span> ({rem.category})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate py-4 text-center">No disciplinary or academic remarks recorded.</p>
            )}
          </Card>
        </div>
      )}

      {/* Add Remark Modal */}
      <Modal
        isOpen={isRemarkModalOpen}
        onClose={() => setIsRemarkModalOpen(false)}
        title="Record Staff Observation / Remark"
        subtitle={`Adding record for ${student.full_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddRemark} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Title *</label>
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
              <label className="block text-slate-700 font-medium mb-1">Category</label>
              <select
                value={remarkCategory}
                onChange={(e) => setRemarkCategory(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="ACADEMIC">Academic</option>
                <option value="DISCIPLINE">Discipline</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Severity</label>
              <select
                value={remarkSeverity}
                onChange={(e) => setRemarkSeverity(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="POSITIVE">Positive / Praise</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Detailed Description *</label>
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
              className="px-3 py-1.5 text-[12px] border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRemarkMutation.isPending}
              className="px-4 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createRemarkMutation.isPending ? 'Saving...' : 'Record Remark'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
