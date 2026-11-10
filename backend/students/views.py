from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Avg, Count, Case, When, IntegerField, F
from students.models import Student, Guardian, StudentGuardian, StudentEnrollment, StudentRemark, StudentAchievement
from students.serializers import (
    StudentListSerializer, StudentDetailSerializer, StudentCreateUpdateSerializer,
    StudentRemarkSerializer, StudentAchievementSerializer, StudentEnrollmentSerializer
)
from attendance.models import AttendanceRecord
from grades.models import StudentMark, GradingScale
from core.permissions import IsTeacherOrAdmin, IsSchoolAdmin

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        school = user.school
        qs = Student.objects.filter(school=school).prefetch_related(
            'enrollments__section__class_group',
            'attendance_records',
            'exam_marks__exam_subject__subject'
        )

        # Filters
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(admission_number__icontains=search)
            )

        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(enrollments__section__class_group_id=class_id, enrollments__is_active=True)

        section_id = self.request.query_params.get('section_id')
        if section_id:
            qs = qs.filter(enrollments__section_id=section_id, enrollments__is_active=True)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return StudentCreateUpdateSerializer
        return StudentDetailSerializer

    @action(detail=True, methods=['get'], url_path='full-profile')
    def full_profile(self, request, pk=None):
        student = self.get_object()
        
        # 1. Profile details
        detail_data = StudentDetailSerializer(student).data

        # 2. Attendance History & Analytics
        records = student.attendance_records.select_related('session__section').order_by('-session__date')
        total_sessions = records.count()
        present_count = records.filter(status='PRESENT').count()
        absent_count = records.filter(status='ABSENT').count()
        late_count = records.filter(status='LATE').count()
        excused_count = records.filter(status='EXCUSED').count()

        threshold = float(student.school.attendance_threshold) if student.school else 75.0
        # Calculate percentage
        if total_sessions > 0:
            effective_present = present_count + (late_count * 0.8)
            if student.school and student.school.excused_counts_as_present:
                effective_present += excused_count
            attendance_pct = round((effective_present / total_sessions) * 100, 1)
        else:
            attendance_pct = 0.0

        # Monthly breakdown
        monthly_stats = {}
        for r in records:
            month_key = r.session.date.strftime('%Y-%m')
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {'month': month_key, 'total': 0, 'present': 0, 'absent': 0, 'late': 0, 'excused': 0}
            monthly_stats[month_key]['total'] += 1
            st = r.status.lower()
            if st in monthly_stats[month_key]:
                monthly_stats[month_key][st] += 1

        monthly_list = []
        for m in sorted(monthly_stats.keys()):
            item = monthly_stats[m]
            tot = item['total']
            pct = round(((item['present'] + item['late'] * 0.8) / tot) * 100, 1) if tot > 0 else 0.0
            item['percentage'] = pct
            monthly_list.append(item)

        recent_attendance = [
            {
                'id': r.id,
                'date': r.session.date.strftime('%Y-%m-%d'),
                'status': r.status,
                'remarks': r.remarks,
                'session_type': r.session.session_type or 'General',
                'subject_name': r.session.subject.name if r.session.subject else (r.session.session_type or 'General'),
            }
            for r in records[:30]
        ]

        # 3. Academics & Grading
        marks_qs = student.exam_marks.select_related(
            'exam_subject__examination',
            'exam_subject__subject'
        ).order_by('exam_subject__examination__start_date')

        grading_scale = GradingScale.objects.filter(school=student.school, is_default=True).first()
        if not grading_scale:
            grading_scale = GradingScale.objects.filter(school=student.school).first()

        exam_groups = {}
        subject_performance = {}

        for m in marks_qs:
            exam_name = m.exam_subject.examination.name
            term_name = m.exam_subject.examination.term
            subj_name = m.exam_subject.subject.name

            if exam_name not in exam_groups:
                exam_groups[exam_name] = {
                    'exam_id': m.exam_subject.examination.id,
                    'exam_name': exam_name,
                    'term': term_name,
                    'subjects': [],
                    'total_max': 0,
                    'total_obtained': 0,
                    'is_published': m.exam_subject.examination.is_published,
                }

            obtained = float(m.marks_obtained) if (m.marks_obtained is not None and not m.is_absent) else 0.0
            max_m = float(m.exam_subject.max_marks)
            pct = round((obtained / max_m) * 100, 1) if max_m > 0 else 0.0
            grade_info = grading_scale.get_grade_for_percentage(pct) if grading_scale else {'grade': 'N/A', 'gpa': 0.0}

            exam_groups[exam_name]['subjects'].append({
                'subject': subj_name,
                'max_marks': max_m,
                'pass_marks': float(m.exam_subject.pass_marks),
                'marks_obtained': obtained if not m.is_absent else None,
                'is_absent': m.is_absent,
                'percentage': pct if not m.is_absent else 0.0,
                'grade': grade_info.get('grade', 'F') if not m.is_absent else 'ABS',
                'remarks': m.remarks,
            })
            exam_groups[exam_name]['total_max'] += max_m
            exam_groups[exam_name]['total_obtained'] += obtained

            # Subject aggregation
            if subj_name not in subject_performance:
                subject_performance[subj_name] = {'subject': subj_name, 'percentages': []}
            if not m.is_absent and m.marks_obtained is not None:
                subject_performance[subj_name]['percentages'].append(pct)

        # Finalize exam aggregates
        exams_list = []
        overall_percentages = []
        for e_name, e_data in exam_groups.items():
            tot_max = e_data['total_max']
            tot_obt = e_data['total_obtained']
            avg_pct = round((tot_obt / tot_max) * 100, 1) if tot_max > 0 else 0.0
            e_data['average_percentage'] = avg_pct
            e_data['overall_grade'] = grading_scale.get_grade_for_percentage(avg_pct).get('grade', 'N/A') if grading_scale else 'N/A'
            exams_list.append(e_data)
            overall_percentages.append(avg_pct)

        subject_summary = []
        for s_name, s_data in subject_performance.items():
            p_list = s_data['percentages']
            avg_p = round(sum(p_list) / len(p_list), 1) if p_list else 0.0
            subject_summary.append({
                'subject': s_name,
                'average': avg_p,
                'grade': grading_scale.get_grade_for_percentage(avg_p).get('grade', 'N/A') if grading_scale else 'N/A',
                'assessments_count': len(p_list)
            })

        subject_summary.sort(key=lambda x: x['average'], reverse=True)
        strengths = [s for s in subject_summary if s['average'] >= 75]
        weaknesses = [s for s in subject_summary if s['average'] < 60]

        academic_avg = round(sum(overall_percentages) / len(overall_percentages), 1) if overall_percentages else None
        current_gpa = grading_scale.get_grade_for_percentage(academic_avg).get('gpa', 0.0) if (grading_scale and academic_avg) else None

        response_payload = {
            'student': detail_data,
            'attendance_summary': {
                'total_sessions': total_sessions,
                'present_count': present_count,
                'absent_count': absent_count,
                'late_count': late_count,
                'excused_count': excused_count,
                'percentage': attendance_pct,
                'is_low_attendance': attendance_pct < threshold,
                'threshold': threshold,
                'monthly_breakdown': monthly_list,
                'recent_records': recent_attendance,
            },
            'academic_summary': {
                'overall_average': academic_avg,
                'overall_grade': grading_scale.get_grade_for_percentage(academic_avg).get('grade', 'N/A') if (grading_scale and academic_avg) else 'N/A',
                'current_gpa': current_gpa,
                'examinations': exams_list,
                'subject_performance': subject_summary,
                'strengths': strengths,
                'weaknesses': weaknesses,
            },
            'remarks': detail_data.get('remarks', []),
            'achievements': detail_data.get('achievements', []),
        }

        return Response(response_payload)


class StudentRemarkViewSet(viewsets.ModelViewSet):
    serializer_class = StudentRemarkSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        student_id = self.request.query_params.get('student_id')
        qs = StudentRemark.objects.filter(student__school=self.request.user.school)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class StudentAchievementViewSet(viewsets.ModelViewSet):
    serializer_class = StudentAchievementSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        student_id = self.request.query_params.get('student_id')
        qs = StudentAchievement.objects.filter(student__school=self.request.user.school)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs
