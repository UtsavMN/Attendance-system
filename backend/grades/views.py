from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Avg, Max, Min, Count
from grades.models import GradingScale, Examination, ExamSubject, StudentMark
from grades.serializers import (
    GradingScaleSerializer, ExaminationSerializer,
    ExamSubjectSerializer, StudentMarkSerializer
)
from students.models import Student, StudentEnrollment
from core.models import AuditLog, Notification, NotificationCategory, UserRole
from core.permissions import IsTeacherOrAdmin, CanEnterMarks, IsSchoolAdmin

class GradingScaleViewSet(viewsets.ModelViewSet):
    serializer_class = GradingScaleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        return GradingScale.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class ExaminationViewSet(viewsets.ModelViewSet):
    serializer_class = ExaminationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = Examination.objects.filter(school=self.request.user.school).prefetch_related('exam_subjects__subject', 'exam_subjects__class_group')
        academic_year_id = self.request.query_params.get('academic_year_id')
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSchoolAdmin])
    def publish(self, request, pk=None):
        exam = self.get_object()
        exam.is_published = True
        exam.save(update_fields=['is_published', 'updated_at'])

        # Notify teachers and school users
        school = exam.school
        users = school.users.filter(role__in=[UserRole.TEACHER, UserRole.SCHOOL_ADMIN])
        notifications = [
            Notification(
                school=school,
                recipient=u,
                title=f"Results Published: {exam.name}",
                message=f"Official academic examination results for {exam.name} have been published.",
                category=NotificationCategory.EXAM_RESULT,
                link=f"/academics"
            )
            for u in users
        ]
        Notification.objects.bulk_create(notifications)

        AuditLog.objects.create(
            school=school,
            user=request.user,
            action='EXAMINATION_RESULTS_PUBLISHED',
            target_model='Examination',
            target_id=str(exam.id),
            details={'exam_name': exam.name, 'term': exam.term},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({'detail': f'Examination {exam.name} published successfully.'})


class ExamSubjectViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = ExamSubject.objects.filter(examination__school=self.request.user.school).select_related('examination', 'class_group', 'subject')
        exam_id = self.request.query_params.get('examination_id')
        class_id = self.request.query_params.get('class_id')
        if exam_id:
            qs = qs.filter(examination_id=exam_id)
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        return qs


class MarksEntryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, CanEnterMarks]

    def get(self, request):
        exam_subject_id = request.query_params.get('exam_subject_id')
        section_id = request.query_params.get('section_id')

        if not exam_subject_id:
            return Response({'detail': 'exam_subject_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam_subject = ExamSubject.objects.select_related('examination', 'class_group', 'subject').get(
                id=exam_subject_id,
                examination__school=request.user.school
            )
        except ExamSubject.DoesNotExist:
            return Response({'detail': 'Exam Subject not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrollments_qs = StudentEnrollment.objects.filter(
            academic_year=exam_subject.examination.academic_year,
            section__class_group=exam_subject.class_group,
            is_active=True
        ).select_related('student', 'section').order_by('section__name', 'roll_number')

        if section_id:
            enrollments_qs = enrollments_qs.filter(section_id=section_id)

        existing_marks = {
            m.student_id: m
            for m in StudentMark.objects.filter(exam_subject=exam_subject)
        }

        scale = GradingScale.objects.filter(school=request.user.school, is_default=True).first()

        students_list = []
        for enr in enrollments_qs:
            st = enr.student
            mark = existing_marks.get(st.id)
            obtained = float(mark.marks_obtained) if mark and mark.marks_obtained is not None else None
            is_abs = mark.is_absent if mark else False
            pct = round((obtained / float(exam_subject.max_marks)) * 100, 1) if (obtained is not None and not is_abs) else 0.0
            grade = scale.get_grade_for_percentage(pct).get('grade', 'F') if (scale and obtained is not None and not is_abs) else ('ABS' if is_abs else '-')

            students_list.append({
                'student_id': st.id,
                'admission_number': st.admission_number,
                'full_name': st.full_name,
                'section_name': enr.section.name,
                'roll_number': enr.roll_number,
                'marks_obtained': obtained,
                'is_absent': is_abs,
                'remarks': mark.remarks if mark else '',
                'percentage': pct,
                'grade': grade,
                'is_pass': (obtained >= float(exam_subject.pass_marks)) if (obtained is not None and not is_abs) else False
            })

        return Response({
            'exam_subject': {
                'id': exam_subject.id,
                'exam_name': exam_subject.examination.name,
                'subject_name': exam_subject.subject.name,
                'class_name': exam_subject.class_group.name,
                'max_marks': float(exam_subject.max_marks),
                'pass_marks': float(exam_subject.pass_marks),
                'is_published': exam_subject.examination.is_published,
            },
            'students': students_list
        })

    @transaction.atomic
    def post(self, request):
        exam_subject_id = request.data.get('exam_subject_id')
        marks_data = request.data.get('marks', [])

        if not exam_subject_id:
            return Response({'detail': 'exam_subject_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam_subject = ExamSubject.objects.get(
                id=exam_subject_id,
                examination__school=request.user.school
            )
        except ExamSubject.DoesNotExist:
            return Response({'detail': 'Exam Subject not found.'}, status=status.HTTP_404_NOT_FOUND)

        max_marks = float(exam_subject.max_marks)
        updated_count = 0

        for item in marks_data:
            student_id = item.get('student_id')
            marks_val = item.get('marks_obtained')
            is_absent = item.get('is_absent', False)
            remarks = item.get('remarks', '')

            # Validation
            if marks_val is not None and not is_absent:
                marks_num = float(marks_val)
                if marks_num < 0 or marks_num > max_marks:
                    return Response(
                        {'detail': f'Marks {marks_num} for student #{student_id} exceeds maximum permitted ({max_marks})'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                marks_num = None

            mark_obj, created = StudentMark.objects.update_or_create(
                exam_subject=exam_subject,
                student_id=student_id,
                defaults={
                    'marks_obtained': marks_num if not is_absent else None,
                    'is_absent': is_absent,
                    'remarks': remarks,
                    'entered_by': request.user
                }
            )
            updated_count += 1

        AuditLog.objects.create(
            school=request.user.school,
            user=request.user,
            action='EXAMINATION_MARKS_RECORDED',
            target_model='ExamSubject',
            target_id=str(exam_subject.id),
            details={'subject': exam_subject.subject.name, 'records_count': updated_count},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'detail': f'Successfully saved marks for {updated_count} students.',
            'exam_subject_id': exam_subject.id
        })


class AcademicDashboardStatsView(views.APIView):
    """Provides high-level academic metrics, subject averages, and distribution"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        school = request.user.school
        exam_id = request.query_params.get('examination_id')

        exams_qs = Examination.objects.filter(school=school)
        if exam_id:
            active_exam = exams_qs.filter(id=exam_id).first()
        else:
            active_exam = exams_qs.first()

        if not active_exam:
            return Response({
                'exams': [],
                'active_exam': None,
                'overall_average': 0,
                'pass_percentage': 0,
                'subject_averages': [],
                'grade_distribution': []
            })

        marks = StudentMark.objects.filter(
            exam_subject__examination=active_exam,
            is_absent=False,
            marks_obtained__isnull=False
        ).select_related('exam_subject__subject', 'exam_subject')

        total_entries = marks.count()
        passing_entries = sum(1 for m in marks if float(m.marks_obtained) >= float(m.exam_subject.pass_marks))
        pass_pct = round((passing_entries / total_entries) * 100, 1) if total_entries > 0 else 0.0

        # Subject averages
        subj_stats = {}
        for m in marks:
            s_name = m.exam_subject.subject.name
            if s_name not in subj_stats:
                subj_stats[s_name] = {'subject': s_name, 'percentages': [], 'max_marks': float(m.exam_subject.max_marks)}
            pct = (float(m.marks_obtained) / float(m.exam_subject.max_marks)) * 100
            subj_stats[s_name]['percentages'].append(pct)

        subj_averages = []
        for s_name, data in subj_stats.items():
            plist = data['percentages']
            avg = round(sum(plist) / len(plist), 1) if plist else 0.0
            subj_averages.append({
                'subject': s_name,
                'average': avg,
                'students_tested': len(plist)
            })

        scale = GradingScale.objects.filter(school=school, is_default=True).first()
        grade_dist = {'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
        for m in marks:
            pct = (float(m.marks_obtained) / float(m.exam_subject.max_marks)) * 100
            g = scale.get_grade_for_percentage(pct).get('grade', 'F') if scale else 'F'
            grade_dist[g] = grade_dist.get(g, 0) + 1

        overall_avg = round(sum(m['average'] for m in subj_averages) / len(subj_averages), 1) if subj_averages else 0.0

        all_exams = ExaminationSerializer(exams_qs, many=True).data

        return Response({
            'exams': all_exams,
            'active_exam': ExaminationSerializer(active_exam).data,
            'overall_average': overall_avg,
            'pass_percentage': pass_pct,
            'total_students_tested': total_entries,
            'subject_averages': subj_averages,
            'grade_distribution': [{'grade': k, 'count': v} for k, v in grade_dist.items()]
        })
