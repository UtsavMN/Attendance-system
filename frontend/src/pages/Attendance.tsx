import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  BookOpen,
  School,
  Check,
  X,
  Clock,
  Save,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  Sparkles,
  History,
  Plus
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ClassGroup, Section, Subject, AttendanceSheetStudent, AttendanceSessionItem } from '../types';

export const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Navigation & selection state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Editable Student Records (Present / Absent)
  const [studentSheet, setStudentSheet] = useState<AttendanceSheetStudent[]>([]);
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{
    subject_name: string;
    marked_at: string;
    present_count: number;
    absent_count: number;
  } | null>(null);

  // 1. Fetch Classes (contains sections and subjects)
  const { data: rawClassesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/api/classes/');
      return res.data?.results || res.data;
    },
  });

  const classes: ClassGroup[] = Array.isArray(rawClassesData)
    ? rawClassesData
    : (rawClassesData as any)?.results || [];

  // Default selection when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const firstClass = classes[0];
      setSelectedClassId(String(firstClass.id));
      if (firstClass.sections && firstClass.sections.length > 0) {
        setSelectedSectionId(String(firstClass.sections[0].id));
      }
      if (firstClass.subjects && firstClass.subjects.length > 0) {
        setSelectedSubjectId(String(firstClass.subjects[0].id));
      }
    }
  }, [classes, selectedClassId]);

  const activeClass = classes.find((c) => c.id === parseInt(selectedClassId));
  const activeSection = activeClass?.sections?.find((s) => s.id === parseInt(selectedSectionId)) || activeClass?.sections?.[0];
  const activeSubject = activeClass?.subjects?.find((sub) => sub.id === parseInt(selectedSubjectId));

  // 2. Fetch Students Sheet for Selected Section, Subject, and Date
  const { data: sheetData, isLoading: isSheetLoading } = useQuery({
    queryKey: ['attendance-sheet', selectedSectionId, selectedSubjectId, selectedDate],
    queryFn: async () => {
      if (!selectedSectionId) return null;
      let url = `/api/attendance/sheet/?section_id=${selectedSectionId}&date=${selectedDate}`;
      if (selectedSubjectId) {
        url += `&subject_id=${selectedSubjectId}`;
      }
      const res = await apiClient.get(url);
      return res.data;
    },
    enabled: !!selectedSectionId,
  });

  // Sync sheet students into local interactive buffer
  useEffect(() => {
    if (sheetData?.students) {
      setStudentSheet(sheetData.students);
    }
  }, [sheetData]);

  // 3. Fetch all attendance sessions taken today for this section
  const { data: todaySessions } = useQuery<AttendanceSessionItem[]>({
    queryKey: ['attendance-sessions', selectedSectionId, selectedDate],
    queryFn: async () => {
      if (!selectedSectionId) return [];
      const res = await apiClient.get(`/api/attendance-sessions/?section_id=${selectedSectionId}&date=${selectedDate}`);
      return res.data?.results || res.data || [];
    },
    enabled: !!selectedSectionId,
  });

  // 4. Save Attendance Mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/attendance/mark/', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });

      setSaveSuccessInfo({
        subject_name: res.data.subject_name || activeSubject?.name || 'Class',
        marked_at: res.data.marked_at,
        present_count: res.data.present_count,
        absent_count: res.data.absent_count,
      });

      // Clear alert after 8 seconds
      setTimeout(() => {
        setSaveSuccessInfo((prev) => (prev?.marked_at === res.data.marked_at ? null : prev));
      }, 8000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to save attendance record.');
    }
  });

  // Quick Action Handlers
  const handleToggleStatus = (studentId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    setStudentSheet((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status: nextStatus as any } : s))
    );
  };

  const handleSetStatus = (studentId: number, statusToSet: 'PRESENT' | 'ABSENT') => {
    setStudentSheet((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status: statusToSet } : s))
    );
  };

  const handleMarkAll = (statusToSet: 'PRESENT' | 'ABSENT') => {
    setStudentSheet((prev) =>
      prev.map((s) => ({ ...s, status: statusToSet }))
    );
  };

  const handleSaveAttendance = () => {
    if (!selectedSectionId) {
      alert('Please select a class section.');
      return;
    }
    saveAttendanceMutation.mutate({
      section_id: parseInt(selectedSectionId),
      subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : undefined,
      date: selectedDate,
      records: studentSheet.map((s) => ({
        student_id: s.student_id,
        status: s.status,
      }))
    });
  };

  // Calculations for quick stats
  const totalCount = studentSheet.length;
  const presentCount = studentSheet.filter((s) => s.status === 'PRESENT').length;
  const absentCount = totalCount - presentCount;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-navy-800" />
            <span>Subject-Wise Class Attendance</span>
          </h2>
          <p className="text-[12px] text-slate mt-0.5">
            Select a class, choose the subject, and mark Present/Absent with real-time timestamp recording.
          </p>
        </div>

        {/* Global Date Selector */}
        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 border border-border-subtle rounded-xl shadow-sm text-[12px]">
          <CalendarIcon className="w-4 h-4 text-slate" />
          <span className="font-semibold text-navy-800">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-medium text-navy-800 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* STEP 1: CLASS & SECTION SELECTOR */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-navy-800 text-white inline-flex items-center justify-center text-[10px]">1</span>
            Select Class & Section
          </span>
          <span className="text-[11px] text-slate">
            {classes.length} Classes available
          </span>
        </div>

        {classes.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <School className="w-8 h-8 text-slate mx-auto" />
            <h4 className="font-semibold text-navy-800 text-[14px]">No Classes Configured</h4>
            <p className="text-[12px] text-slate">Please add a class and section to begin tracking attendance.</p>
            <button
              onClick={() => navigate('/classes')}
              className="px-4 py-2 text-[12px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900"
            >
              Go to Classes & Sections
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map((c) => {
              const isClassSelected = String(c.id) === selectedClassId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedClassId(String(c.id));
                    if (c.sections && c.sections.length > 0) {
                      setSelectedSectionId(String(c.sections[0].id));
                    }
                    if (c.subjects && c.subjects.length > 0) {
                      setSelectedSubjectId(String(c.subjects[0].id));
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isClassSelected
                      ? 'bg-navy-800 text-white border-navy-800 shadow-md ring-2 ring-navy-800/20'
                      : 'bg-surface border-border-subtle hover:border-slate-300 hover:shadow-sm text-navy-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[14px] leading-tight">{c.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isClassSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate'
                    }`}>
                      {c.code}
                    </span>
                  </div>

                  <div className={`text-[11px] mb-3 flex items-center justify-between ${
                    isClassSelected ? 'text-white/80' : 'text-slate'
                  }`}>
                    <span>{c.total_students || 0} Enrolled</span>
                    <span>•</span>
                    <span>{c.subjects?.length || 0} Subjects</span>
                  </div>

                  {/* Section selection pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                    {c.sections && c.sections.length > 0 ? (
                      c.sections.map((sec) => {
                        const isSecSelected = isClassSelected && String(sec.id) === selectedSectionId;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setSelectedClassId(String(c.id));
                              setSelectedSectionId(String(sec.id));
                              if (c.subjects && c.subjects.length > 0 && !selectedSubjectId) {
                                setSelectedSubjectId(String(c.subjects[0].id));
                              }
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                              isSecSelected
                                ? 'bg-emerald-500 text-white font-bold shadow-sm'
                                : isClassSelected
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Sec {sec.name}
                          </button>
                        );
                      })
                    ) : (
                      <span className={`text-[10px] italic ${isClassSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        No sections
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2: SUBJECT SELECTOR */}
      {activeClass && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-navy-800 text-white inline-flex items-center justify-center text-[10px]">2</span>
              Click a Subject to Mark Attendance ({activeClass.name})
            </span>
            <span className="text-[11px] text-slate">
              Each subject has its own daily attendance record
            </span>
          </div>

          {(!activeClass.subjects || activeClass.subjects.length === 0) ? (
            <Card className="p-6 text-center space-y-2">
              <BookOpen className="w-6 h-6 text-slate mx-auto" />
              <p className="text-[13px] font-semibold text-navy-800">No subjects assigned to {activeClass.name}</p>
              <p className="text-[12px] text-slate">Visit Classes & Sections to link academic subjects to this grade.</p>
              <button
                onClick={() => navigate('/classes')}
                className="mt-2 px-3 py-1.5 text-[11px] font-semibold bg-navy-800 text-white rounded-lg"
              >
                Configure Subjects
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeClass.subjects.map((subj) => {
                const isSubjSelected = String(subj.id) === selectedSubjectId;
                // Check if this subject has been marked today
                const sessionForSubject = todaySessions?.find(
                  (sess) => sess.subject === subj.id || sess.subject_name === subj.name
                );

                return (
                  <div
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(String(subj.id))}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSubjSelected
                        ? 'bg-blue-50/80 border-navy-800 ring-2 ring-navy-800/10 shadow-sm'
                        : 'bg-surface border-border-subtle hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {subj.code}
                        </span>
                        {sessionForSubject ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Marked
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[13px] text-navy-800 leading-snug">{subj.name}</h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px]">
                      {sessionForSubject ? (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sessionForSubject.marked_at_formatted ? sessionForSubject.marked_at_formatted.split(',')[0] : 'Saved'}
                        </span>
                      ) : (
                        <span className="text-slate text-[10px]">Click to mark</span>
                      )}
                      <span className={`font-semibold ${isSubjSelected ? 'text-navy-800' : 'text-slate-400'}`}>
                        {isSubjSelected ? '● Active' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: ATTENDANCE ROSTER (PRESENT / ABSENT ONLY) */}
      {activeClass && activeSection && (
        <div className="space-y-4">
          {/* Success Banner upon saving */}
          {saveSuccessInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px]">
                    Attendance Saved for {saveSuccessInfo.subject_name}!
                  </h4>
                  <p className="text-[12px] text-emerald-700 mt-0.5">
                    Recorded at <span className="font-mono font-bold text-emerald-900">{saveSuccessInfo.marked_at}</span> • {saveSuccessInfo.present_count} Present, {saveSuccessInfo.absent_count} Absent.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSaveSuccessInfo(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[12px] font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Controls & Summary Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Step 3: Marking Attendance
                  </span>
                  {sheetData?.marked_at && (
                    <Badge variant="green" size="sm">
                      Last Saved: {sheetData.marked_at}
                    </Badge>
                  )}
                </div>
                <h3 className="text-base font-bold text-navy-800 mt-0.5">
                  {activeClass.name} - Section {activeSection.name} • {activeSubject?.name || 'Class Subject'}
                </h3>
                <span className="text-[12px] text-slate">
                  Date: {selectedDate}
                </span>
              </div>

              {/* Counters & Bulk Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg border border-border-subtle text-[12px]">
                  <span className="text-slate font-medium">Roster: {totalCount}</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {presentCount} Present
                  </span>
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    {absentCount} Absent
                  </span>
                  <span className="font-mono font-semibold text-navy-800">
                    ({attendanceRate}%)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="px-3 py-1.5 text-[11px] font-semibold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={saveAttendanceMutation.isPending || studentSheet.length === 0}
                    className="px-4 py-1.5 text-[12px] font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Student Roster Table (Simple, Clean, Easy to Explain) */}
          <Card className="p-0 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[12px] font-semibold text-navy-800">
                Student Enrollment Roster ({studentSheet.length} Students)
              </span>
              <span className="text-[11px] text-slate">
                Click Present or Absent to mark each student
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 w-16">Roll #</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Admission Number</th>
                    <th className="py-2.5 px-4 text-center w-56">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isSheetLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate">
                        Loading student enrollment roster...
                      </td>
                    </tr>
                  ) : studentSheet.length > 0 ? (
                    studentSheet.map((st) => {
                      const isPresent = st.status === 'PRESENT';
                      return (
                        <tr
                          key={st.student_id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-navy-800">
                            #{st.roll_number}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {st.photo_url ? (
                                <img
                                  src={st.photo_url}
                                  alt={st.full_name}
                                  className="w-7 h-7 rounded-full object-cover border border-border-subtle"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-navy-800 flex items-center justify-center font-bold text-[10px]">
                                  {st.first_name[0]}
                                </div>
                              )}
                              <span className="font-semibold text-navy-800 text-[13px]">
                                {st.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                            {st.admission_number}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {/* Two-Button Toggle: Present vs Absent */}
                            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-border-subtle">
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.student_id, 'PRESENT')}
                                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Present</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.student_id, 'ABSENT')}
                                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  !isPresent
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-rose-700'
                                }`}
                              >
                                <X className="w-3 h-3" />
                                <span>Absent</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-navy-800 text-[13px]">No Students Enrolled in this Section</p>
                        <p className="text-[12px] text-slate-500 mt-1 mb-3">
                          Add students to {activeClass?.name} - Section {activeSection?.name} to begin recording subject attendance.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/students?action=new')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold bg-navy-800 text-white rounded-lg hover:bg-navy-900 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Register Student to this Section</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Trigger */}
            <div className="p-4 bg-slate-50 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[11px] text-slate font-medium">
                Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-border-subtle rounded text-[10px] font-mono">Save Attendance</kbd> to record with current timestamp.
              </span>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saveAttendanceMutation.isPending || studentSheet.length === 0}
                className="px-5 py-2 text-[12px] font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saveAttendanceMutation.isPending ? 'Saving...' : `Save ${activeSubject?.name || ''} Attendance`}</span>
              </button>
            </div>
          </Card>

          {/* Today's Subject Sessions Log (Demonstrates that a day contains multiple subjects with distinct timestamps) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
              <div>
                <h4 className="font-bold text-[13px] text-navy-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate" />
                  <span>Attendance Sessions Marked for {activeClass.name} - Section {activeSection.name} on {selectedDate}</span>
                </h4>
                <p className="text-[11px] text-slate mt-0.5">
                  Verified timestamp log for every academic subject tested today
                </p>
              </div>
            </div>

            {(!todaySessions || todaySessions.length === 0) ? (
              <p className="text-[12px] text-slate italic py-2">
                No attendance sessions recorded yet for this date. Choose a subject above and click Save Attendance.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {todaySessions.map((sess) => (
                  <div key={sess.id} className="p-3 bg-slate-50/70 border border-border-subtle rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13px] text-navy-800">{sess.subject_name || 'General'}</span>
                        <Badge variant="green" size="sm">
                          {sess.summary ? `${sess.summary.percentage}%` : 'Done'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate mt-1 flex items-center gap-2">
                        <span className="text-emerald-700 font-semibold">{sess.summary?.present || 0} Present</span>
                        <span>•</span>
                        <span className="text-rose-700 font-semibold">{sess.summary?.absent || 0} Absent</span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-border-subtle text-[10px] text-slate flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Timestamp: </span>
                      <span className="font-mono font-semibold text-navy-800">
                        {sess.marked_at_formatted || 'Recorded'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
