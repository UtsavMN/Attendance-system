import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Printer,
  TrendingUp,
  BarChart3,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ClassGroup, StudentListItem } from '../types';
import { downloadAuthorizedFile } from '../utils/download';

interface ClassAnalysisItem {
  class_id: number;
  class_name: string;
  code: string;
  student_count: number;
  attendance_percentage: number;
  total_attendance_sessions: number;
  present_count: number;
  absent_count: number;
  academic_average: number | null;
  pass_rate: number | null;
  overall_grade: string;
  gpa: number | null;
  evaluated_assessments: number;
}

interface ClassAnalysisResponse {
  classes: ClassAnalysisItem[];
  summary: {
    total_classes: number;
    total_enrolled: number;
    school_attendance_avg: number;
    school_academic_avg: number | null;
    evaluated_classes_count: number;
  };
}

export const Reports: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [analyticsMetric, setAnalyticsMetric] = useState<'attendance' | 'academics'>('attendance');

  // Fetch Class Groups for Filter
  const { data: classesData } = useQuery<ClassGroup[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/api/classes/');
      return res.data?.results || res.data;
    },
  });

  // Fetch Class-Wise Analytics Data
  const { data: classAnalysisData, isLoading: isAnalysisLoading } = useQuery<ClassAnalysisResponse>({
    queryKey: ['class-analysis'],
    queryFn: async () => {
      const res = await apiClient.get('/api/reports/class-analysis/');
      return res.data;
    },
  });

  // Fetch Active Students Roster for Individual Report Cards
  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['report-students', selectedClassId],
    queryFn: async () => {
      let url = '/api/students/?status=ACTIVE';
      if (selectedClassId) url += `&class_id=${selectedClassId}`;
      const res = await apiClient.get(url);
      return res.data?.results || [];
    },
  });

  const students: StudentListItem[] = studentsData || [];
  const classList = classAnalysisData?.classes || [];
  const summary = classAnalysisData?.summary;

  // Chart Data preparation
  const chartData = classList.map((c) => ({
    name: c.class_name,
    code: c.code,
    attendance: c.attendance_percentage,
    academic: c.academic_average ?? 0,
    hasAcademic: c.academic_average !== null,
    student_count: c.student_count,
    pass_rate: c.pass_rate,
    grade: c.overall_grade,
    sessions: c.total_attendance_sessions,
    assessments: c.evaluated_assessments,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-navy-800 tracking-tight">Institutional Reports & Analytics</h2>
        <p className="text-[12px] text-slate">Generate, export, and analyze comparative class attendance and academic metrics</p>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate uppercase tracking-wider">Total Classes</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {summary?.total_classes ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">
            {summary?.total_enrolled ?? 0} active students
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate uppercase tracking-wider">School Attendance</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {summary?.school_attendance_avg !== undefined ? `${summary.school_attendance_avg}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">Active class average</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate uppercase tracking-wider">Academic Average</span>
            <GraduationCap className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            {summary?.school_academic_avg !== null && summary?.school_academic_avg !== undefined
              ? `${summary.school_academic_avg}%`
              : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">
            {summary?.evaluated_classes_count ?? 0} evaluated classes
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate uppercase tracking-wider">Mandatory Benchmark</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-navy-800 mt-1">
            75.0%
          </div>
          <span className="text-[11px] text-slate-500">Minimum threshold</span>
        </Card>
      </div>

      {/* Class-Wise Comparative Analytics Chart & Breakdown */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 bg-surface border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-navy-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-navy-800" />
              <span>Class-Wise Comparative Analysis</span>
            </h3>
            <p className="text-[12px] text-slate mt-0.5">
              Side-by-side comparison of attendance compliance and academic examination performance across all classes
            </p>
          </div>

          {/* Metric Selector Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-border-subtle self-start md:self-auto">
            <button
              onClick={() => setAnalyticsMetric('attendance')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                analyticsMetric === 'attendance'
                  ? 'bg-white text-navy-800 shadow-sm font-semibold'
                  : 'text-slate hover:text-navy-800'
              }`}
            >
              Attendance Comparison (%)
            </button>
            <button
              onClick={() => setAnalyticsMetric('academics')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                analyticsMetric === 'academics'
                  ? 'bg-white text-navy-800 shadow-sm font-semibold'
                  : 'text-slate hover:text-navy-800'
              }`}
            >
              Academic Performance (%)
            </button>
          </div>
        </div>

        {/* Recharts Bar Visualization */}
        <div className="p-6 bg-surface">
          {isAnalysisLoading ? (
            <div className="h-72 flex items-center justify-center text-slate text-[13px] animate-pulse">
              Loading class comparative analytics...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate text-[13px]">
              <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
              <span>No class records available for comparative charting.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBF0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#17243A', fontWeight: 500 }}
                      stroke="#E8EBF0"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      stroke="#E8EBF0"
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-navy-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg text-[12px] space-y-1">
                              <p className="font-bold text-[13px] border-b border-navy-700 pb-1">
                                {data.name} ({data.code})
                              </p>
                              <p className="text-slate-200">
                                Enrolled Students: <span className="font-semibold text-white">{data.student_count}</span>
                              </p>
                              {analyticsMetric === 'attendance' ? (
                                <>
                                  <p className="text-emerald-300 font-semibold">
                                    Attendance Rate: {data.attendance}%
                                  </p>
                                  <p className="text-slate-300 text-[11px]">
                                    Sessions Logged: {data.sessions}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-blue-300 font-semibold">
                                    Academic Average: {data.hasAcademic ? `${data.academic}%` : 'Not Evaluated'}
                                  </p>
                                  {data.hasAcademic && (
                                    <>
                                      <p className="text-slate-200">Grade: <span className="font-bold text-amber-300">{data.grade}</span></p>
                                      <p className="text-slate-300 text-[11px]">Pass Rate: {data.pass_rate}%</p>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {analyticsMetric === 'attendance' ? (
                      <>
                        <ReferenceLine
                          y={75}
                          stroke="#EF4444"
                          strokeDasharray="4 4"
                          label={{
                            value: '75% Mandatory Attendance',
                            position: 'top',
                            fill: '#EF4444',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        />
                        <Bar dataKey="attendance" radius={[6, 6, 0, 0]} maxBarSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-att-${index}`}
                              fill={
                                entry.attendance >= 85
                                  ? '#10B981'
                                  : entry.attendance >= 75
                                  ? '#5276A7'
                                  : entry.student_count === 0
                                  ? '#94A3B8'
                                  : '#EF4444'
                              }
                            />
                          ))}
                        </Bar>
                      </>
                    ) : (
                      <>
                        <ReferenceLine
                          y={40}
                          stroke="#64748B"
                          strokeDasharray="4 4"
                          label={{
                            value: '40% Passing Benchmark',
                            position: 'top',
                            fill: '#64748B',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        />
                        <Bar dataKey="academic" radius={[6, 6, 0, 0]} maxBarSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-acad-${index}`}
                              fill={
                                !entry.hasAcademic
                                  ? '#CBD5E1'
                                  : entry.academic >= 80
                                  ? '#10B981'
                                  : entry.academic >= 60
                                  ? '#5276A7'
                                  : '#F59E0B'
                              }
                            />
                          ))}
                        </Bar>
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[11px] text-slate border-t border-border-subtle">
                {analyticsMetric === 'attendance' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                      <span>High Attendance (&ge; 85%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#5276A7] inline-block" />
                      <span>Compliant (75% - 84%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                      <span>At Risk (&lt; 75%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
                      <span>No Attendance Logged</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                      <span>Excellent (&ge; 80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#5276A7] inline-block" />
                      <span>Proficient (60% - 79%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                      <span>Needs Improvement (&lt; 60%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
                      <span>No Marks Logged</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Comparative Table */}
        <div className="overflow-x-auto border-t border-border-subtle">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50/75 border-b border-border-subtle text-slate uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4 text-center">Enrolled</th>
                <th className="py-2.5 px-4 text-center">Attendance Rate</th>
                <th className="py-2.5 px-4 text-center">Academic Average</th>
                <th className="py-2.5 px-4 text-center">Pass Rate</th>
                <th className="py-2.5 px-4 text-center">Overall Grade</th>
                <th className="py-2.5 px-4 text-center">Grade Points (GPA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {classList.length > 0 ? (
                classList.map((c) => (
                  <tr key={c.class_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy-800">{c.class_name}</td>
                    <td className="py-3 px-4 font-mono text-slate text-[11px]">{c.code}</td>
                    <td className="py-3 px-4 text-center font-medium text-navy-800">{c.student_count}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          c.student_count === 0 && c.total_attendance_sessions === 0
                            ? 'slate'
                            : c.attendance_percentage >= 85
                            ? 'green'
                            : c.attendance_percentage >= 75
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                      >
                        {c.total_attendance_sessions > 0 ? `${c.attendance_percentage}%` : 'No Data'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-navy-800">
                      {c.academic_average !== null ? `${c.academic_average}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.pass_rate !== null ? (
                        <span className={`font-semibold ${c.pass_rate >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {c.pass_rate}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={c.overall_grade === 'A' || c.overall_grade === 'A+' ? 'green' : c.overall_grade === '-' ? 'slate' : 'navy'} size="sm">
                        {c.overall_grade}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {c.gpa !== null ? `${c.gpa} / 4.0` : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate">
                    No classes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Official Export Reports Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-800">Export Institutional Attendance Roster</h3>
            <p className="text-[12px] text-slate mt-1">
              Download styled Excel workbook containing term attendance percentages, individual status logs (present, absent, late, excused), and student enrollment metadata.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate">Format: .XLSX</span>
            <button
              onClick={() => downloadAuthorizedFile('/api/reports/export-excel/?type=attendance', 'scholaris_attendance_report.xlsx')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-800">Export Academic Performance Marks</h3>
            <p className="text-[12px] text-slate mt-1">
              Export comprehensive examination marks spreadsheet containing overall averages, letter grades, pass/fail status, and subject breakdown across all enrolled classes.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate">Format: .XLSX</span>
            <button
              onClick={() => downloadAuthorizedFile('/api/reports/export-excel/?type=academics', 'scholaris_academic_report.xlsx')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-navy-800 hover:bg-navy-900 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Individual Official PDF Report Cards Batch List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-navy-800">Individual Student Official PDF Report Cards</h3>
            <p className="text-[12px] text-slate">Server-rendered vector PDF documents formatted with institutional seal and signatures</p>
          </div>

          <div className="flex items-center gap-2 text-[12px]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-2.5 py-1 text-[11px] bg-surface border border-border-subtle rounded-md"
            >
              <option value="">All Classes</option>
              {classesData?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50/50 border-b border-border-subtle text-slate uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Admission No</th>
                <th className="py-2.5 px-4">Class & Section</th>
                <th className="py-2.5 px-4">Attendance %</th>
                <th className="py-2.5 px-4">Academic Avg</th>
                <th className="py-2.5 px-4 text-right">PDF Generator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {students.length > 0 ? (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-semibold text-navy-800">{st.full_name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{st.admission_number}</td>
                    <td className="py-2.5 px-4 text-slate-700">{st.current_class} - {st.current_section}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant={st.attendance_percentage >= 85 ? 'green' : st.attendance_percentage >= 75 ? 'amber' : 'red'} size="sm">
                        {st.attendance_percentage}%
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-navy-800">
                      {st.academic_average !== null ? `${st.academic_average}%` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => downloadAuthorizedFile(`/api/reports/student-report-card-pdf/${st.id}/`, `${st.admission_number}_Report_Card.pdf`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-navy-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Generate PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate">
                    {isStudentsLoading ? 'Loading student roster...' : 'No active students found matching the selected filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
