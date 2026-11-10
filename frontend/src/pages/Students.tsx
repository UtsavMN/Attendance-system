import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { StudentListItem, ClassGroup } from '../types';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [attendanceFilter, setAttendanceFilter] = useState<string>(
    searchParams.get('filter') === 'attention' ? 'low' : ''
  );
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'new');

  // Form State for Add Student
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    admission_number: `ADM-2025-${Math.floor(100 + Math.random() * 900)}`,
    admission_date: new Date().toISOString().split('T')[0],
    date_of_birth: '2009-05-15',
    gender: 'MALE',
    blood_group: 'O+',
    photo_url: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: 'Parent',
    medical_notes: '',
    previous_school: '',
    status: 'ACTIVE',
    class_id: '',
    section_id: '',
    roll_number: '',
    guardian_name: '',
    guardian_relationship: 'Father',
    guardian_phone: '',
    guardian_email: '',
  });

  // Query Students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', search, selectedClass, selectedStatus, page],
    queryFn: async () => {
      let url = `/api/students/?page=${page}&status=${selectedStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedClass) url += `&class_id=${selectedClass}`;
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  // Query Classes for filter dropdown & form
  const { data: rawClassesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/api/classes/');
      return res.data;
    },
  });

  const classesList: ClassGroup[] = Array.isArray(rawClassesData)
    ? rawClassesData
    : (rawClassesData as any)?.results || [];

  // Query Academic Years
  const { data: rawAcademicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await apiClient.get('/api/academic-years/');
      return res.data;
    },
  });

  const academicYearsList = Array.isArray(rawAcademicYears)
    ? rawAcademicYears
    : (rawAcademicYears as any)?.results || [];

  const handleOpenAddModal = () => {
    if (classesList.length > 0) {
      const activeClass = classesList.find((c) => String(c.id) === formData.class_id) || classesList[0];
      const activeSec = activeClass.sections?.[0];
      setFormData((prev) => ({
        ...prev,
        class_id: String(activeClass.id),
        section_id: activeSec ? String(activeSec.id) : '',
      }));
    }
    setIsAddModalOpen(true);
  };

  React.useEffect(() => {
    if (classesList.length > 0) {
      const classExists = classesList.some((c) => String(c.id) === formData.class_id);
      if (!formData.class_id || !classExists) {
        const firstClass = classesList[0];
        const firstSec = firstClass.sections?.[0];
        setFormData((prev) => ({
          ...prev,
          class_id: String(firstClass.id),
          section_id: firstSec ? String(firstSec.id) : '',
        }));
      }
    }
  }, [classesList, formData.class_id]);

  // Add Student Mutation
  const createStudentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/students/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsAddModalOpen(false);
      alert('Student record successfully registered!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create student. Please verify admission number uniqueness.');
    }
  });

  // Delete Student Mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/students/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      alert('Student record deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete student.');
    }
  });

  const handleDeleteStudent = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}? This will remove all their records.`)) {
      deleteStudentMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentAY = academicYearsList?.find((ay: any) => ay.is_current) || academicYearsList?.[0];
    const payload = {
      ...formData,
      academic_year_id: currentAY?.id,
      section_id: formData.section_id ? parseInt(formData.section_id) : undefined,
    };
    createStudentMutation.mutate(payload);
  };

  // Client-side attendance filtering if selected
  let studentsList: StudentListItem[] = studentsData?.results || [];
  if (attendanceFilter === 'low') {
    studentsList = studentsList.filter((s) => s.attendance_percentage < 75);
  } else if (attendanceFilter === 'warning') {
    studentsList = studentsList.filter((s) => s.attendance_percentage >= 75 && s.attendance_percentage < 85);
  } else if (attendanceFilter === 'high') {
    studentsList = studentsList.filter((s) => s.attendance_percentage >= 85);
  }

  const selectedClassObj = classesList.find((c) => c.id === parseInt(formData.class_id));

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight">Student Directory</h2>
          <p className="text-[12px] text-slate">Manage enrolled students, digital profiles, attendance & grades</p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`${API_BASE_URL}/api/reports/export-excel/?type=attendance`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg border border-border-subtle bg-surface hover:bg-slate-50 text-navy-800 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate" />
            <span>Export Roster</span>
          </a>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-lg bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50/50 border border-border-subtle rounded-lg focus:outline-none focus:border-navy-800 transition-colors"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-[12px] font-medium bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-navy-800"
            >
              <option value="">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Attendance Filter */}
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="px-3 py-1.5 text-[12px] font-medium bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-navy-800"
            >
              <option value="">Attendance: All</option>
              <option value="high">High (&gt;85%)</option>
              <option value="warning">Warning (75-85%)</option>
              <option value="low">At Risk (&lt;75%)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-[12px] font-medium bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-navy-800"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="GRADUATED">Graduated</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student Directory Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50/75 border-b border-border-subtle text-[11px] font-semibold uppercase tracking-wider text-slate">
              <tr>
                <th className="py-3 px-5">Student Details</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Academic Avg</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-5">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : studentsList.length > 0 ? (
                studentsList.map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {st.photo_url ? (
                          <img
                            src={st.photo_url}
                            alt={st.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-border-subtle flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-navy-800 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                            {st.first_name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-navy-800 hover:text-accent-blue transition-colors">
                            {st.full_name}
                          </div>
                          <div className="text-[11px] text-slate capitalize">{st.gender.toLowerCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-700">
                      {st.admission_number}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {st.current_class} - {st.current_section}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-600">
                      #{st.roll_number}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          st.attendance_percentage >= 85
                            ? 'green'
                            : st.attendance_percentage >= 75
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                      >
                        {st.attendance_percentage}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {st.academic_average !== null ? (
                        <span className="font-semibold text-navy-800">
                          {st.academic_average}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={st.status === 'ACTIVE' ? 'green' : 'slate'}
                        size="sm"
                      >
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/students/${st.id}`)}
                          className="px-2.5 py-1 text-[11px] font-medium text-navy-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.full_name)}
                          title="Delete Student"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate">
                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-navy-800 text-[14px]">No Students Registered Yet</p>
                    <p className="text-[12px] text-slate-500 mt-1 mb-4">Register your first student to begin tracking attendance and academic records.</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-lg bg-navy-800 hover:bg-navy-900 text-white shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register New Student</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {studentsData && studentsData.count > 20 && (
          <div className="px-5 py-3 border-t border-border-subtle bg-slate-50/50 flex items-center justify-between text-[12px] text-slate">
            <div>
              Showing <span className="font-semibold text-navy-800">{studentsList.length}</span> of{' '}
              <span className="font-semibold text-navy-800">{studentsData.count}</span> students
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={!studentsData.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-border-subtle hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">Page {page}</span>
              <button
                disabled={!studentsData.next}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded border border-border-subtle hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Student Modal (Multi-Section Form) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student"
        subtitle="Complete student personal, academic enrollment, and guardian profiles"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          {/* Section 1: Personal Information */}
          <div>
            <h4 className="text-[13px] font-semibold text-navy-800 border-b border-border-subtle pb-1.5 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate" /> Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-3.5 text-[12px]">
              <div>
                <label className="block text-slate-700 font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="e.g. Julian"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="e.g. Vance"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Blood Group</label>
                <input
                  type="text"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="e.g. O+, A-, B+"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Admission & Enrollment */}
          <div>
            <h4 className="text-[13px] font-semibold text-navy-800 border-b border-border-subtle pb-1.5 mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate" /> Admission & Class Assignment
            </h4>
            <div className="grid grid-cols-3 gap-3.5 text-[12px]">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Admission Number *</label>
                <input
                  type="text"
                  required
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Admission Date</label>
                <input
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Class *</label>
                {classesList.length === 0 ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                    No classes exist yet.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        navigate('/classes');
                      }}
                      className="font-bold underline text-navy-800"
                    >
                      Create Class first &rarr;
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const c = classesList.find((item) => item.id === parseInt(newClassId));
                      const firstSec = c?.sections?.[0];
                      setFormData({
                        ...formData,
                        class_id: newClassId,
                        section_id: firstSec ? String(firstSec.id) : '',
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  >
                    <option value="" disabled>Select Grade</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Section *</label>
                {selectedClassObj && (!selectedClassObj.sections || selectedClassObj.sections.length === 0) ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                    No sections in this class.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        navigate('/classes');
                      }}
                      className="font-bold underline text-navy-800"
                    >
                      Add Section &rarr;
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    disabled={!formData.class_id}
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none disabled:bg-slate-100"
                  >
                    <option value="" disabled>Select Section</option>
                    {selectedClassObj?.sections?.map((s) => (
                      <option key={s.id} value={s.id}>Section {s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Roll Number</label>
                <input
                  type="text"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Guardian Details */}
          <div>
            <h4 className="text-[13px] font-semibold text-navy-800 border-b border-border-subtle pb-1.5 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate" /> Primary Guardian Information
            </h4>
            <div className="grid grid-cols-2 gap-3.5 text-[12px]">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Guardian Full Name</label>
                <input
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="e.g. Robert Vance"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Relationship</label>
                <select
                  value={formData.guardian_relationship}
                  onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Guardian Phone</label>
                <input
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={formData.guardian_email}
                  onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                  placeholder="parent@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-[12px] font-medium rounded-lg border border-border-subtle text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudentMutation.isPending}
              className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {createStudentMutation.isPending ? 'Registering...' : 'Save Student Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
