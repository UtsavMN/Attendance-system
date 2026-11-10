import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Users, Plus, BookOpen, UserCheck, ChevronRight, CalendarCheck, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ClassGroup, Subject, Teacher } from '../types';

export const Classes: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAssignSubjectModalOpen, setIsAssignSubjectModalOpen] = useState(false);
  const [assignSubjectClassId, setAssignSubjectClassId] = useState<string>('');
  const [selectedSubjectToAssign, setSelectedSubjectToAssign] = useState<string>('');

  // Add Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');

  // Add Section Form
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [sectionName, setSectionName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [classTeacherId, setClassTeacherId] = useState<string>('');

  // Add Subject Form
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [creditHours, setCreditHours] = useState('3.0');
  const [isElective, setIsElective] = useState(false);

  const { data: classesData, isLoading } = useQuery<ClassGroup[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/api/classes/');
      return res.data?.results || res.data;
    },
  });

  const { data: subjectsData } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/subjects/');
      return res.data?.results || res.data;
    },
  });

  const { data: teachersData } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await apiClient.get('/api/teachers/');
      return res.data?.results || res.data;
    },
  });

  // Create Class Mutation
  const createClassMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/classes/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddClassModalOpen(false);
      setNewClassName('');
      setNewClassCode('');
      alert('Class level successfully created!');
    }
  });

  // Create Section Mutation
  const createSectionMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/sections/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddSectionModalOpen(false);
      setSectionName('');
      setRoomNumber('');
      setClassTeacherId('');
      alert('Section successfully added to class!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create section.');
    }
  });

  // Create Subject Mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/subjects/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsAddSubjectModalOpen(false);
      setSubjectName('');
      setSubjectCode('');
      alert('Subject successfully registered!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create subject.');
    }
  });

  // Assign Subject to Class Mutation
  const assignSubjectMutation = useMutation({
    mutationFn: async (payload: { classId: string; subjectId: string }) => {
      return await apiClient.post(`/api/classes/${payload.classId}/assign_subject/`, {
        subject_id: parseInt(payload.subjectId)
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAssignSubjectModalOpen(false);
      setSelectedSubjectToAssign('');
      alert(res.data?.detail || 'Subject successfully assigned to class!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to assign subject.');
    }
  });

  // Delete Class Mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/classes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      alert('Class level successfully removed.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete class.');
    }
  });

  // Delete Section Mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/sections/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      alert('Section successfully removed.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete section.');
    }
  });

  // Delete Subject Mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/subjects/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      alert('Subject successfully removed.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete subject.');
    }
  });

  const handleDeleteClass = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete class ${name}? This will remove associated sections.`)) {
      deleteClassMutation.mutate(id);
    }
  };

  const handleDeleteSection = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete Section ${name}?`)) {
      deleteSectionMutation.mutate(id);
    }
  };

  const handleDeleteSubject = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete subject ${name}?`)) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectClassId || !selectedSubjectToAssign) return;
    assignSubjectMutation.mutate({
      classId: assignSubjectClassId,
      subjectId: selectedSubjectToAssign
    });
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate({
      name: newClassName,
      code: newClassCode,
      order_index: (classesData?.length || 0) + 1
    });
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    createSectionMutation.mutate({
      class_group: parseInt(targetClassId),
      name: sectionName,
      room_number: roomNumber,
      class_teacher: classTeacherId ? parseInt(classTeacherId) : null,
    });
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate({
      name: subjectName,
      code: subjectCode,
      credit_hours: parseFloat(creditHours),
      is_elective: isElective,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight">Classes & Sections Hierarchy</h2>
          <p className="text-[12px] text-slate">Configure grade levels, section rosters, and instructional subject disciplines</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="px-3 py-2 text-[12px] font-medium border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate" />
            <span>Add Subject</span>
          </button>
          <button
            onClick={() => {
              if (classesData && classesData.length > 0) {
                setTargetClassId(String(classesData[0].id));
              }
              setIsAddSectionModalOpen(true);
            }}
            className="px-3 py-2 text-[12px] font-medium border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate" />
            <span>Add Section</span>
          </button>
          <button
            onClick={() => setIsAddClassModalOpen(true)}
            className="px-3.5 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Level</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classesData && classesData.length > 0 ? (
          classesData.map((cg) => (
            <Card key={cg.id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded">
                      {cg.code}
                    </span>
                    <span className="text-[11px] font-medium text-slate">
                      {cg.total_students || 0} Students Enrolled
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cg.id, cg.name)}
                    title="Delete Class"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-navy-800">{cg.name}</h3>
                <p className="text-[12px] text-slate mt-0.5">
                  {cg.sections?.length || 0} Active Sections
                </p>
              </div>

              <div className="space-y-2 border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate uppercase tracking-wider block">
                    Sections Roster
                  </span>
                  <button
                    onClick={() => {
                      setTargetClassId(String(cg.id));
                      setIsAddSectionModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-accent-blue hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Section</span>
                  </button>
                </div>

                {cg.sections && cg.sections.length > 0 ? (
                  cg.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="p-2.5 rounded-lg border border-border-subtle bg-slate-50/50 flex items-center justify-between text-[12px]"
                    >
                      <div>
                        <span className="font-bold text-navy-800">Section {sec.name}</span>
                        <span className="text-slate-500 text-[11px] block">
                          Teacher: {sec.class_teacher_name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-medium text-navy-800 text-[11px] block">{sec.student_count || 0} students</span>
                          <span className="text-[10px] text-slate-500">{sec.room_number || 'Room TBD'}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSection(sec.id, sec.name)}
                          title="Delete Section"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate py-2">No sections created yet for {cg.name}.</p>
                )}
              </div>

              {/* Class Subjects Display */}
              <div className="space-y-2 border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate uppercase tracking-wider block">
                    Curriculum Subjects ({cg.subjects?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setAssignSubjectClassId(String(cg.id));
                      setIsAssignSubjectModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-accent-blue hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Assign Subject</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {cg.subjects && cg.subjects.length > 0 ? (
                    cg.subjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-2 py-0.5 bg-blue-50 text-navy-800 border border-blue-100 rounded text-[11px] font-medium"
                      >
                        {sub.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No subjects linked to this class yet.</span>
                  )}
                </div>
              </div>

              {/* Action: Take Attendance */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] text-slate">{cg.total_students || 0} enrolled</span>
                <button
                  onClick={() => navigate('/attendance')}
                  className="px-3 py-1.5 text-[11px] font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Take Attendance</span>
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-slate bg-surface rounded-xl border border-border-subtle">
            <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-navy-800 text-sm">No Class Levels Configured</h4>
            <p className="text-[12px] text-slate mt-1 mb-3">Add grade levels (e.g. Grade 9, Grade 10) to begin structuring the school.</p>
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="px-3.5 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-lg"
            >
              Add Class Level
            </button>
          </div>
        )}
      </div>

      {/* Curriculum Subjects Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-navy-800">Curriculum Subjects Directory</h3>
            <p className="text-[12px] text-slate">Approved institutional subject disciplines and credit allocations</p>
          </div>
          <button
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="px-3 py-1.5 text-[11px] font-semibold bg-navy-800 text-white rounded-md flex items-center gap-1 hover:bg-navy-900"
          >
            <Plus className="w-3 h-3" />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Subject Name</th>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Credit Hours</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {subjectsData && subjectsData.length > 0 ? (
                subjectsData.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-navy-800">{sub.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{sub.code}</td>
                    <td className="py-2.5 px-4 text-slate">{sub.credit_hours} hrs/wk</td>
                    <td className="py-2.5 px-4">
                      <Badge variant={sub.is_elective ? 'blue' : 'slate'} size="sm">
                        {sub.is_elective ? 'Elective' : 'Core'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        title="Delete Subject"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate">
                    No curriculum subjects registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        title="Add Class / Grade Level"
        subtitle="Create a new grade level in the academic structure"
        maxWidth="md"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Class Name *</label>
            <input
              type="text"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. Grade 10"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Code / Identifier *</label>
            <input
              type="text"
              required
              value={newClassCode}
              onChange={(e) => setNewClassCode(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none font-mono"
              placeholder="e.g. G10"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddClassModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClassMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createClassMutation.isPending ? 'Saving...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        title="Add Section to Class"
        subtitle="Create a section and assign classroom details"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSection} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Class *</label>
            <select
              required
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none bg-surface"
            >
              <option value="">Select Class</option>
              {classesData?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Section Name *</label>
            <input
              type="text"
              required
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. A, B, or Honors"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Room Number</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. Room 204"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Class Teacher</label>
            <select
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none bg-surface"
            >
              <option value="">Select Teacher (Optional)</option>
              {teachersData?.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddSectionModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSectionMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createSectionMutation.isPending ? 'Saving...' : 'Add Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        title="Add Curriculum Subject"
        subtitle="Register an institutional course subject"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              placeholder="e.g. Biology"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none font-mono"
                placeholder="e.g. BIO-10"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Credit Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={creditHours}
                onChange={(e) => setCreditHours(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isElective"
              checked={isElective}
              onChange={(e) => setIsElective(e.target.checked)}
              className="rounded border-border-subtle text-navy-800"
            />
            <label htmlFor="isElective" className="text-slate-700 font-medium">This is an elective course</label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddSubjectModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubjectMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createSubjectMutation.isPending ? 'Saving...' : 'Register Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Subject to Class Modal */}
      <Modal
        isOpen={isAssignSubjectModalOpen}
        onClose={() => setIsAssignSubjectModalOpen(false)}
        title="Assign Subject to Class"
        subtitle="Select a registered curriculum subject to teach in this class level"
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubject} className="space-y-4 text-[12px]">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Class</label>
            <input
              type="text"
              disabled
              value={classesData?.find((c) => String(c.id) === assignSubjectClassId)?.name || ''}
              className="w-full px-3 py-1.5 bg-slate-100 border border-border-subtle rounded-md font-semibold text-navy-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Subject to Teach *</label>
            <select
              required
              value={selectedSubjectToAssign}
              onChange={(e) => setSelectedSubjectToAssign(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
            >
              <option value="">-- Choose Subject --</option>
              {subjectsData?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAssignSubjectModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSubjectMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50 cursor-pointer"
            >
              {assignSubjectMutation.isPending ? 'Linking...' : 'Assign to Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
