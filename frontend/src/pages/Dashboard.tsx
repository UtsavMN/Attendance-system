import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  School,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useLanguage } from '../context/LanguageContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/overview/');
      return res.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-border-subtle" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-surface rounded-xl lg:col-span-2 border border-border-subtle" />
          <div className="h-80 bg-surface rounded-xl border border-border-subtle" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-surface rounded-xl border border-border-subtle">
        <p className="text-slate font-medium">Failed to load dashboard metrics. Ensure backend is running.</p>
      </div>
    );
  }

  const { stats, trends, distribution, class_attendance, attention_needed, recent_activity } = data;

  const totalDistribution = distribution.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0);

  const statCards = [
    {
      label: 'Total Students',
      value: stats.total_students,
      change: `${stats.total_students} enrolled`,
      icon: Users,
      color: 'blue',
      onClick: () => navigate('/students'),
    },
    {
      label: 'Present Today',
      value: stats.present_today,
      change: 'Active on campus',
      icon: UserCheck,
      color: 'green',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Absent Today',
      value: stats.absent_today,
      change: `${stats.absent_today} unexcused`,
      icon: UserX,
      color: 'red',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendance_percentage}%`,
      change: stats.attendance_percentage >= 90 ? 'High attendance' : 'Institutional rate',
      icon: Percent,
      color: stats.attendance_percentage >= 90 ? 'green' : 'amber',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Total Classes',
      value: stats.total_classes,
      change: `${stats.total_sections} active sections`,
      icon: School,
      color: 'slate',
      onClick: () => navigate('/classes'),
    },
    {
      label: 'Requires Attention',
      value: stats.students_requiring_attention,
      change: 'Below 75% threshold',
      icon: AlertTriangle,
      color: stats.students_requiring_attention > 0 ? 'amber' : 'green',
      onClick: () => navigate('/students?filter=attention'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stat Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              onClick={card.onClick}
              className="p-4 flex flex-col justify-between hover:border-slate-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate uppercase tracking-wider">
                  {t(card.label)}
                </span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-navy-800 transition-colors" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold text-navy-800 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {card.change}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Line Chart (Span 2) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-navy-800">Daily Attendance Trend</h3>
              <p className="text-[12px] text-slate">Institutional daily attendance over the last 14 school days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <TrendingUp className="w-3 h-3" /> Average: {stats.attendance_percentage}%
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5276A7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5276A7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-surface p-3 rounded-lg border border-border-subtle shadow-dropdown text-[12px]">
                          <p className="font-semibold text-navy-800">{item.full_date}</p>
                          <p className="text-slate mt-1">Attendance: <span className="font-bold text-navy-800">{item.percentage}%</span></p>
                          <p className="text-emerald-700">Present: {item.present}</p>
                          <p className="text-rose-700">Absent: {item.absent}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#17243A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Distribution Donut Chart */}
        <Card>
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-navy-800">Attendance Distribution</h3>
            <p className="text-[12px] text-slate">Breakdown of today's attendance statuses</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {totalDistribution > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate py-8">
                <p className="text-[12px] font-medium text-slate-500">No attendance marked for today yet</p>
                <button
                  onClick={() => navigate('/attendance')}
                  className="mt-2 px-3 py-1 text-[11px] font-semibold bg-navy-800 text-white rounded-md"
                >
                  Mark Attendance
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px]">
            {distribution.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate font-medium">{item.name}:</span>
                <span className="font-semibold text-navy-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Secondary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class-wise Comparison */}
        <Card>
          <div className="mb-4">
            <h3 className="text-[15px] font-semibold text-navy-800">Class Attendance Comparison</h3>
            <p className="text-[12px] text-slate">Average attendance rate across grade levels</p>
          </div>

          {class_attendance && class_attendance.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={class_attendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                  <XAxis dataKey="class_name" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8EBF0" unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-surface p-2.5 rounded-lg border border-border-subtle shadow-dropdown text-[12px]">
                            <p className="font-semibold text-navy-800">{item.class_name}</p>
                            <p className="text-slate">Attendance: <span className="font-bold text-navy-800">{item.attendance_percentage}%</span></p>
                            <p className="text-slate">Students: {item.student_count}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="attendance_percentage" fill="#17243A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center text-center text-slate">
              <p className="text-[12px] font-medium text-slate-500">No classes configured yet</p>
              <button
                onClick={() => navigate('/classes')}
                className="mt-2 px-3 py-1 text-[11px] font-semibold bg-navy-800 text-white rounded-md hover:bg-navy-900"
              >
                Add Class
              </button>
            </div>
          )}
        </Card>

        {/* Students Requiring Attention */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-navy-800">Students Requiring Attention</h3>
              <p className="text-[12px] text-slate">Students flagged for low attendance (&lt;75%) or failing grades</p>
            </div>
            <button
              onClick={() => navigate('/students')}
              className="text-[12px] font-semibold text-navy-800 hover:text-accent-blue flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-border-subtle text-slate font-medium text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Class</th>
                  <th className="pb-2.5">Attendance</th>
                  <th className="pb-2.5">Academic Avg</th>
                  <th className="pb-2.5">Flagged Reason</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {attention_needed.length > 0 ? (
                  attention_needed.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5">
                        <div className="font-semibold text-navy-800">{st.name}</div>
                        <div className="text-[10px] text-slate">{st.admission_number}</div>
                      </td>
                      <td className="py-2.5 text-slate-700">{st.class_name} - {st.section_name}</td>
                      <td className="py-2.5">
                        <span className={`font-semibold ${st.attendance_percentage < 75 ? 'text-accent-red-text' : 'text-navy-800'}`}>
                          {st.attendance_percentage}%
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`font-semibold ${st.academic_average !== null && st.academic_average < 50 ? 'text-accent-red-text' : 'text-navy-800'}`}>
                          {st.academic_average !== null ? `${st.academic_average}%` : '-'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <Badge variant="red" size="sm">
                          {st.reason}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/students/${st.id}`)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-navy-800 transition-colors"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate">
                      No students currently flagged below alert thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent School Activity Stream */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-navy-800">Recent School Audit & Activity Stream</h3>
            <p className="text-[12px] text-slate">Real-time audit log of attendance submissions, enrollments, and academic actions</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-[12px] font-semibold text-navy-800 hover:text-accent-blue"
          >
            Audit Log
          </button>
        </div>

        {recent_activity && recent_activity.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
            {recent_activity.map((act: any) => (
              <div key={act.id} className="p-3 rounded-lg border border-border-subtle bg-slate-50/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {act.target_model}
                    </span>
                    <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                  </div>
                  <p className="font-semibold text-navy-800 truncate" title={act.action}>
                    {act.action.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 truncate">
                  by <span className="font-medium text-navy-800">{act.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate py-4 text-[12px]">No recent operational activity recorded.</p>
        )}
      </Card>
    </div>
  );
};
