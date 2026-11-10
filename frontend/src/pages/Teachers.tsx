import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Mail, Phone, BookOpen, Award, School, Plus, User } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Teacher } from '../types';

export const Teachers: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);

  const [teacherForm, setTeacherForm] = useState({
    first_name: '',
    last_name: '',
    employee_id: `T-${Math.floor(100 + Math.random() * 900)}`,
    designation: 'Senior Faculty',
    department: 'Mathematics',
    qualification: 'M.Sc. Education',
    staff_email: '',
    staff_phone: '',
    password: 'teacher123',
    joining_date: new Date().toISOString().split('T')[0],
  });

  const { data: teachersData, isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await apiClient.get('/api/teachers/');
      return res.data?.results || res.data;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/api/teachers/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsAddTeacherModalOpen(false);
      setTeacherForm({
        first_name: '',
        last_name: '',
        employee_id: `T-${Math.floor(100 + Math.random() * 900)}`,
        designation: 'Senior Faculty',
        department: 'Mathematics',
        qualification: 'M.Sc. Education',
        staff_email: '',
        staff_phone: '',
        password: 'teacher123',
        joining_date: new Date().toISOString().split('T')[0],
      });
      alert('Faculty member successfully registered and user account created!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to register faculty member.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeacherMutation.mutate(teacherForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight">Faculty & Instructional Staff</h2>
          <p className="text-[12px] text-slate">Authorized teachers, department heads, and classroom instructors</p>
        </div>
        <button
          onClick={() => setIsAddTeacherModalOpen(true)}
          className="px-3.5 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="h-60 animate-pulse bg-surface" />
          ))
        ) : teachersData && teachersData.length > 0 ? (
          teachersData.map((t) => (
            <Card key={t.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3.5">
                {t.user?.avatar_url ? (
                  <img
                    src={t.user.avatar_url}
                    alt={t.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border-subtle flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200 text-navy-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {t.name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-navy-800 text-[14px]">{t.name}</h3>
                    <Badge variant={t.is_active ? 'green' : 'slate'} size="sm">
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-slate font-medium block">
                    ID: {t.employee_id}
                  </span>
                  <span className="text-[12px] font-semibold text-accent-blue block mt-0.5">
                    {t.designation}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[12px] text-slate-700 border-t border-border-subtle pt-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dept: <span className="font-medium text-navy-800">{t.department || 'General Faculty'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned: <span className="font-medium text-navy-800">{t.assigned_sections_count} Section(s)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{t.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.phone || 'Phone on record'}</span>
                </div>
              </div>

              {t.qualification && (
                <div className="p-2 bg-slate-50 rounded-md border border-border-subtle text-[11px] text-slate-600">
                  <span className="font-medium text-navy-800">Qualification: </span>
                  {t.qualification}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-slate bg-surface rounded-xl border border-border-subtle">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-navy-800 text-sm">No Faculty Registered</h4>
            <p className="text-[12px] text-slate mt-1 mb-3">Add faculty instructors and staff members to assign classes and attendance.</p>
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="px-3.5 py-1.5 text-[12px] font-semibold bg-navy-800 text-white rounded-lg"
            >
              Add Faculty Member
            </button>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        title="Register Faculty Member"
        subtitle="Create faculty instructor profile and portal authentication credentials"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">First Name *</label>
              <input
                type="text"
                required
                value={teacherForm.first_name}
                onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="e.g. Rachel"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={teacherForm.last_name}
                onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="e.g. Green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={teacherForm.employee_id}
                onChange={(e) => setTeacherForm({ ...teacherForm, employee_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Designation *</label>
              <input
                type="text"
                required
                value={teacherForm.designation}
                onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="e.g. Senior Instructor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Department</label>
              <input
                type="text"
                value={teacherForm.department}
                onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="e.g. Science"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Qualification</label>
              <input
                type="text"
                value={teacherForm.qualification}
                onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="e.g. Ph.D. Biology"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={teacherForm.staff_email}
                onChange={(e) => setTeacherForm({ ...teacherForm, staff_email: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="rachel.green@scholaris.edu"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
              <input
                type="tel"
                value={teacherForm.staff_phone}
                onChange={(e) => setTeacherForm({ ...teacherForm, staff_phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Initial Password</label>
            <input
              type="password"
              value={teacherForm.password}
              onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
              className="w-full px-3 py-1.5 border border-border-subtle rounded-md focus:border-navy-800 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddTeacherModalOpen(false)}
              className="px-3 py-1.5 border border-border-subtle rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeacherMutation.isPending}
              className="px-4 py-1.5 font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900 disabled:opacity-50"
            >
              {createTeacherMutation.isPending ? 'Registering...' : 'Register Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
