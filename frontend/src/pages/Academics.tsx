import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Plus,
  Save,
  CheckCircle2,
  FileText,
  BarChart3,
  Award,
  BookOpen,
  Send,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Examination, GradingScale, ClassGroup } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Academics: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'marks' | 'examinations' | 'grading' | 'analytics'>('marks');

  // Selected Exam Subject for Marks Entry
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState<string>('');

  // Editable Student Marks State
  const [marksSheet, setMarksSheet] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Create Exam Form
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [examTerm, setExamTerm] = useState('Term 1');
  const [examStartDate, setExamStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [examEndDate, setExamEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Exam Subject Form
  const [isExamSubjectModalOpen, setIsExamSubjectModalOpen] = useState(false);
  const [targetExamId, setTargetExamId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [examMaxMarks, setExamMaxMarks] = useState<number>(100);
  const [examPassMarks, setExamPassMarks] = useState<number>(40);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Query Examinations
  const { data: examsData } = useQuery<Examination[]>({
    queryKey: ['examinations'],
    queryFn: async () => {
      const res = await apiClient.get('/api/examinations/');
      return res.data?.results || res.data;
    },
  });

  // Query Classes
  const { data: classesData } = useQuery<ClassGroup[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/api/classes/');
      return res.data?.results || res.data;
    },
  });

  // Query Subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/subjects/');
      return res.data?.results || res.data;
    },
  });

  // Query Academic Years
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await apiClient.get('/api/academic-years/');
      return res.data?.results || res.data;
    },
  });

  // Query Grading Scales
  const { data: gradingScales } = useQuery<GradingScale[]>({
    queryKey: ['grading-scales'],
    queryFn: async () => {
      const res = await apiClient.get('/api/grading-scales/');
      return res.data?.results || res.data;
    },
  });

  // Query Academic Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['academic-analytics', selectedExamId],
    queryFn: async () => {
      const url = selectedExamId
        ? `/api/academic-analytics/?examination_id=${selectedExamId}`
        : '/api/academic-analytics/';
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  // Auto-select first exam and its first exam subject
  React.useEffect(() => {
    if (examsData && examsData.length > 0 && !selectedExamId) {
      setSelectedExamId(String(examsData[0].id));
      if (examsData[0].exam_subjects && examsData[0].exam_subjects.length > 0) {
        setSelectedExamSubjectId(String(examsData[0].exam_subjects[0].id));
      }
    }
  }, [examsData, selectedExamId]);

  const activeExam = examsData?.find((e) => e.id === parseInt(selectedExamId));

  // Query Marks Sheet when exam subject changes
  const { data: sheetData, isLoading: isSheetLoading } = useQuery({
    queryKey: ['marks-sheet', selectedExamSubjectId],
    queryFn: async () => {
      if (!selectedExamSubjectId) return null;
      const res = await apiClient.get(`/api/marks/sheet/?exam_subject_id=${selectedExamSubjectId}`);
      return res.data;
    },
    enabled: !!selectedExamSubjectId,
  });

  React.useEffect(() => {
    if (sheetData?.students) {
      setMarksSheet(sheetData.students);
      setIsDirty(false);
      const hasExistingMarks = sheetData.students.some((s: any) => s.marks_obtained !== null || s.is_absent);
      if (hasExistingMarks && !lastSavedTime) {
        setLastSavedTime('Previously recorded');
      }
    }
  }, [sheetData]);

  // Submit Marks Mutation
  const saveMarksMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/marks/entry/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['academic-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['report-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsDirty(false);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      alert('Examination marks saved successfully! Student profiles, report cards, and analytics updated.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to record marks.');
    }
  });

  // Publish Exam Mutation (auto-saves any unsaved marks in the sheet first)
  const publishExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      if (selectedExamSubjectId && marksSheet.length > 0) {
        await apiClient.post('/api/marks/entry/', {
          exam_subject_id: parseInt(selectedExamSubjectId),
          marks: marksSheet.map((s) => ({
            student_id: s.student_id,
            marks_obtained: s.marks_obtained,
            is_absent: s.is_absent,
            remarks: s.remarks,
          })),
        });
      }
      return await apiClient.post(`/api/examinations/${examId}/publish/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      queryClient.invalidateQueries({ queryKey: ['marks-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['academic-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['report-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsDirty(false);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      alert('Examination marks saved and results published! Student profiles, report cards, and analytics are now live.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to publish examination results.');
    }
  });

  // Create Exam Mutation
  const createExamMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/examinations/', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setIsExamModalOpen(false);
      setExamName('');
      if (res.data?.id) {
        setSelectedExamId(String(res.data.id));
      }
      alert('Examination created successfully.');
    }
  });

  // Add Exam Subject Mutation
  const addExamSubjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/exam-subjects/', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      queryClient.invalidateQueries({ queryKey: ['academic-analytics'] });
      setIsExamSubjectModalOpen(false);
      if (res.data?.examination) {
        setSelectedExamId(String(res.data.examination));
      }
      if (res.data?.id) {
        setSelectedExamSubjectId(String(res.data.id));
      }
      alert('Subject successfully assigned to examination!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to add subject to examination.');
    }
  });

  const handleCreateExamSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetExamId || !targetClassId || !targetSubjectId) {
      alert('Please fill out examination, class, and subject.');
      return;
    }
    addExamSubjectMutation.mutate({
      examination: parseInt(targetExamId),
      class_group: parseInt(targetClassId),
      subject: parseInt(targetSubjectId),
      max_marks: Number(examMaxMarks),
      pass_marks: Number(examPassMarks),
      exam_date: examDate,
    });
  };

  const handleMarkChange = (studentId: number, val: string) => {
    setIsDirty(true);
    setMarksSheet((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, marks_obtained: val === '' ? null : parseFloat(val) } : s))
    );
  };

  const handleAbsentToggle = (studentId: number, isAbsent: boolean) => {
    setIsDirty(true);
    setMarksSheet((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, is_absent: isAbsent, marks_obtained: isAbsent ? null : s.marks_obtained } : s))
    );
  };

  const handleRemarksChange = (studentId: number, rem: string) => {
    setIsDirty(true);
    setMarksSheet((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks: rem } : s))
    );
  };

  const handleSaveMarks = () => {
    if (!selectedExamSubjectId) return;
    saveMarksMutation.mutate({
      exam_subject_id: parseInt(selectedExamSubjectId),
      marks: marksSheet.map((s) => ({
        student_id: s.student_id,
        marks_obtained: s.marks_obtained,
        is_absent: s.is_absent,
        remarks: s.remarks,
      }))
    });
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const currAY = academicYears?.find((a: any) => a.is_current) || academicYears?.[0];
    createExamMutation.mutate({
      name: examName,
      term: examTerm,
      start_date: examStartDate,
      end_date: examEndDate,
      academic_year: currAY?.id,
      is_published: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight">{t('Academic Performance & Grading')}</h2>
          <p className="text-[12px] text-slate">{t('Manage examination terms, subject marks rosters, and automatic GPA grading')}</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border-subtle rounded-xl shadow-sm text-[12px] font-medium">
          <button
            onClick={() => setActiveTab('marks')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'marks' ? 'bg-navy-800 text-white font-semibold' : 'text-slate hover:text-navy-800'
            }`}
          >
            {t('Marks Entry')}
          </button>
          <button
            onClick={() => setActiveTab('examinations')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'examinations' ? 'bg-navy-800 text-white font-semibold' : 'text-slate hover:text-navy-800'
            }`}
          >
            {t('Examinations')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'bg-navy-800 text-white font-semibold' : 'text-slate hover:text-navy-800'
            }`}
          >
            {t('Class-Wise Comparative Analysis', 'ತರಗತಿ ವಿಶ್ಲೇಷಣೆ')}
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'grading' ? 'bg-navy-800 text-white font-semibold' : 'text-slate hover:text-navy-800'
            }`}
          >
            {t('Grading Scales')}
          </button>
        </div>
      </div>

      {/* TAB 1: MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          {(!examsData || examsData.length === 0) ? (
            <Card className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-navy-800">No Examinations Scheduled</h3>
              <p className="text-[12px] text-slate max-w-md mx-auto">
                Schedule an examination first, then assign curriculum subjects to record student scores and calculate GPA.
              </p>
              <button
                onClick={() => setIsExamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule First Examination</span>
              </button>
            </Card>
          ) : (!activeExam?.exam_subjects || activeExam.exam_subjects.length === 0) ? (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-navy-800">No Subjects Configured for {activeExam?.name}</h3>
              <p className="text-[12px] text-slate max-w-md mx-auto">
                This examination has no subjects scheduled yet. Add a subject with max marks to record marks.
              </p>
              <button
                onClick={() => {
                  setTargetExamId(selectedExamId);
                  setIsExamSubjectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject to Examination</span>
              </button>
            </Card>
          ) : (
            <>
              {/* Controls Bar */}
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Select Examination</label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => {
                        setSelectedExamId(e.target.value);
                        const ex = examsData?.find((item) => item.id === parseInt(e.target.value));
                        if (ex && ex.exam_subjects && ex.exam_subjects.length > 0) {
                          setSelectedExamSubjectId(String(ex.exam_subjects[0].id));
                        } else {
                          setSelectedExamSubjectId('');
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-surface border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                    >
                      {examsData?.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.term}) {ex.is_published ? '— [Published]' : '— [Draft]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Select Class & Subject</label>
                    <select
                      value={selectedExamSubjectId}
                      onChange={(e) => setSelectedExamSubjectId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                    >
                      {activeExam?.exam_subjects?.map((es) => (
                        <option key={es.id} value={es.id}>
                          {es.class_name} : {es.subject_name} (Max: {es.max_marks})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-slate block text-[11px]">Assessment Limits:</span>
                      <span className="font-semibold text-navy-800">
                        Max: {sheetData?.exam_subject?.max_marks || 100} | Pass: {sheetData?.exam_subject?.pass_marks || 40}
                      </span>
                    </div>
                    <button
                      onClick={handleSaveMarks}
                      disabled={saveMarksMutation.isPending || marksSheet.length === 0}
                      className="px-4 py-1.5 bg-navy-800 text-white rounded-lg font-semibold hover:bg-navy-900 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saveMarksMutation.isPending ? 'Saving...' : 'Save Marks'}</span>
                    </button>
                  </div>
                </div>
              </Card>

          {/* Marks Entry Sheet */}
          <Card className="p-0 overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[13px] font-semibold text-navy-800">
                {sheetData?.exam_subject?.exam_name} — {sheetData?.exam_subject?.subject_name} Roster
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveMarks}
                  disabled={saveMarksMutation.isPending || marksSheet.length === 0}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveMarksMutation.isPending ? t('Saving...', 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...') : t('Save Marks')}</span>
                </button>
                {activeExam && !activeExam.is_published && (
                  <button
                    onClick={() => publishExamMutation.mutate(activeExam.id)}
                    disabled={publishExamMutation.isPending}
                    className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{publishExamMutation.isPending ? t('Publishing...', 'ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...') : t('Save & Publish')}</span>
                  </button>
                )}
                {activeExam?.is_published && (
                  <Badge variant="green" size="sm">{t('Results Published')}</Badge>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 w-16">{t('Roll #')}</th>
                    <th className="py-2.5 px-4">{t('Student Name')}</th>
                    <th className="py-2.5 px-4">{t('Admission No')}</th>
                    <th className="py-2.5 px-4 text-center">{t('Marks Obtained')} (/{sheetData?.exam_subject?.max_marks || 100})</th>
                    <th className="py-2.5 px-4 text-center">{t('Absent')}?</th>
                    <th className="py-2.5 px-4 text-center">{t('Grade')}</th>
                    <th className="py-2.5 px-4">{t('Teacher Evaluation Remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isSheetLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate">
                        Loading student marks roster...
                      </td>
                    </tr>
                  ) : marksSheet.length > 0 ? (
                    marksSheet.map((st) => {
                      const maxM = sheetData?.exam_subject?.max_marks || 100;
                      const passM = sheetData?.exam_subject?.pass_marks || 40;
                      const isPassing = (st.marks_obtained !== null && st.marks_obtained >= passM);
                      return (
                        <tr key={st.student_id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono font-semibold text-navy-800">
                            #{st.roll_number}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-navy-800">{st.full_name}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate">{st.admission_number}</td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxM}
                              step="0.5"
                              disabled={st.is_absent}
                              value={st.marks_obtained ?? ''}
                              onChange={(e) => handleMarkChange(st.student_id, e.target.value)}
                              className={`w-20 px-2 py-1 text-center font-bold border rounded outline-none ${
                                st.is_absent
                                  ? 'bg-slate-100 text-slate-400'
                                  : isPassing
                                  ? 'border-emerald-300 text-emerald-800 focus:border-navy-800'
                                  : 'border-rose-300 text-rose-800 focus:border-navy-800'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={st.is_absent}
                              onChange={(e) => handleAbsentToggle(st.student_id, e.target.checked)}
                              className="rounded border-border-subtle text-navy-800 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Badge
                              variant={st.is_absent ? 'slate' : isPassing ? 'green' : 'red'}
                              size="sm"
                            >
                              {st.is_absent ? 'ABS' : st.grade}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              placeholder="Feedback on performance..."
                              value={st.remarks || ''}
                              onChange={(e) => handleRemarksChange(st.student_id, e.target.value)}
                              className="w-full px-2.5 py-1 text-[11px] bg-surface border border-border-subtle rounded focus:border-navy-800 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate">
                        No students enrolled for this exam subject.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Sticky Action / Evaluation Status Bar */}
            <div className="p-4 bg-slate-50 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px]">
                <span className="font-semibold text-navy-800">
                  {marksSheet.filter((s) => s.marks_obtained !== null || s.is_absent).length} of {marksSheet.length} students evaluated
                </span>
                {isDirty && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved marks detected — click Save Marks
                  </span>
                )}
                {lastSavedTime && !isDirty && (
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Marks saved ({lastSavedTime})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSaveMarks}
                  disabled={saveMarksMutation.isPending || marksSheet.length === 0}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-[12px] font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveMarksMutation.isPending ? t('Saving...', 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...') : t('Save Examination Marks')}</span>
                </button>
                {activeExam && !activeExam.is_published && (
                  <button
                    onClick={() => publishExamMutation.mutate(activeExam.id)}
                    disabled={publishExamMutation.isPending}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[12px] font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{publishExamMutation.isPending ? t('Publishing...', 'ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...') : t('Save & Publish Results')}</span>
                  </button>
                )}
              </div>
            </div>
          </Card>
          </>
          )}
        </div>
      )}

      {/* TAB 2: EXAMINATIONS DIRECTORY */}
      {activeTab === 'examinations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate">Examinations and their assigned class curricula</p>
            <div className="flex items-center gap-2">
              {examsData && examsData.length > 0 && (
                <button
                  onClick={() => {
                    setTargetExamId(selectedExamId || String(examsData[0]?.id));
                    setIsExamSubjectModalOpen(true);
                  }}
                  className="px-3.5 py-2 text-[12px] font-semibold border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject to Exam</span>
                </button>
              )}
              <button
                onClick={() => setIsExamModalOpen(true)}
                className="px-3.5 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Examination</span>
              </button>
            </div>
          </div>

          {(!examsData || examsData.length === 0) ? (
            <Card className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-navy-800">No Examinations Scheduled</h3>
              <p className="text-[12px] text-slate max-w-md mx-auto">
                Schedule an examination first to configure subjects, enter marks, and generate report cards.
              </p>
              <button
                onClick={() => setIsExamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Examination</span>
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examsData.map((ex) => (
                <Card key={ex.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={ex.is_published ? 'green' : 'amber'} size="sm">
                        {ex.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate uppercase">{ex.term}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-navy-800">{ex.name}</h3>
                    <p className="text-[11px] text-slate mt-1">
                      Dates: {ex.start_date} to {ex.end_date}
                    </p>

                    <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Configured Subjects:</span>
                        <span>{ex.exam_subjects?.length || 0}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {ex.exam_subjects && ex.exam_subjects.length > 0 ? (
                          ex.exam_subjects.map((es) => (
                            <span
                              key={es.id}
                              className="px-2 py-0.5 bg-slate-100 text-navy-800 rounded text-[10px] font-medium"
                              title={`${es.class_name} - Max: ${es.max_marks}`}
                            >
                              {es.subject_name} ({es.class_name})
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No subjects added yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-[12px]">
                    <button
                      onClick={() => {
                        setTargetExamId(String(ex.id));
                        setIsExamSubjectModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium border border-border-subtle hover:bg-slate-100 text-navy-800 rounded-md cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Subject</span>
                    </button>
                    {!ex.is_published && (
                      <button
                        onClick={() => publishExamMutation.mutate(ex.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md cursor-pointer"
                      >
                        Publish Results
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASS ANALYTICS */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-[14px] font-semibold text-navy-800 mb-1">Subject Average Scores</h3>
            <p className="text-[12px] text-slate mb-4">Average percentage scored per discipline in active assessment</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.subject_averages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} stroke="#E8EBF0" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#E8EBF0" unit="%" />
                  <Tooltip />
                  <Bar dataKey="average" fill="#17243A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-[14px] font-semibold text-navy-800 mb-1">Grade Distribution Histogram</h3>
            <p className="text-[12px] text-slate mb-4">Total number of students receiving each letter grade</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.grade_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11 }} stroke="#E8EBF0" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#E8EBF0" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#5276A7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: GRADING SCALES */}
      {activeTab === 'grading' && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-navy-800">School-Wide Grading Scale Standards</h3>
            <p className="text-[12px] text-slate">Configured letter grades, percentage boundaries, and GPA equivalencies</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-border-subtle text-slate uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Marks Range</th>
                  <th className="py-2.5 px-4">Grade</th>
                  <th className="py-2.5 px-4">GPA Equivalent</th>
                  <th className="py-2.5 px-4">Performance Evaluation Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {gradingScales?.[0]?.rules?.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-medium text-navy-800">
                      {rule.min}% – {rule.max}%
                    </td>
                    <td className="py-2.5 px-4 font-bold text-navy-800">{rule.grade}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{rule.gpa.toFixed(1)}</td>
                    <td className="py-2.5 px-4 text-slate">{rule.label || 'Standard'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Examination Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Schedule New Examination"
        subtitle="Define examination term and scheduling parameters"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExam} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Examination Title *</label>
            <input
              type="text"
              required
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. Second Term Assessment 2026"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Academic Term *</label>
            <select
              value={examTerm}
              onChange={(e) => setExamTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
              <option value="Annual / Final Assessment">Annual / Final Assessment</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Start Date</label>
              <input
                type="date"
                required
                value={examStartDate}
                onChange={(e) => setExamStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">End Date</label>
              <input
                type="date"
                required
                value={examEndDate}
                onChange={(e) => setExamEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExamMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createExamMutation.isPending ? 'Scheduling...' : 'Create Examination'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Subject to Examination Modal */}
      <Modal
        isOpen={isExamSubjectModalOpen}
        onClose={() => setIsExamSubjectModalOpen(false)}
        title="Assign Subject to Examination"
        subtitle="Configure assessment discipline, maximum scoring weight, and test date"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExamSubject} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Examination *</label>
            <select
              required
              value={targetExamId}
              onChange={(e) => setTargetExamId(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
            >
              <option value="">-- Choose Examination --</option>
              {examsData?.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.term})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Target Class *</label>
              <select
                required
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="">-- Select Class --</option>
                {classesData?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Subject *</label>
              <select
                required
                value={targetSubjectId}
                onChange={(e) => setTargetSubjectId(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              >
                <option value="">-- Select Subject --</option>
                {subjectsData?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Max Marks *</label>
              <input
                type="number"
                min={10}
                max={500}
                required
                value={examMaxMarks}
                onChange={(e) => setExamMaxMarks(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Pass Marks *</label>
              <input
                type="number"
                min={0}
                max={examMaxMarks}
                required
                value={examPassMarks}
                onChange={(e) => setExamPassMarks(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsExamSubjectModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addExamSubjectMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50 cursor-pointer"
            >
              {addExamSubjectMutation.isPending ? 'Assigning...' : 'Assign Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
