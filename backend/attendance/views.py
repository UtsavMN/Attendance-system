from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import datetime, date
from academic.models import AcademicYear, Section, ClassGroup, Subject
from students.models import Student, StudentEnrollment
from attendance.models import (
    AttendanceSession, AttendanceRecord, AttendanceAuditLog,
    AttendanceStatus, AttendanceSessionType, AttendanceSessionStatus
)
from attendance.serializers import (
    AttendanceSessionSerializer, AttendanceRecordSerializer, AttendanceAuditLogSerializer
)
from core.permissions import IsTeacherOrAdmin, CanMarkAttendance

class AttendanceOverviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        school = request.user.school
        date_str = request.query_params.get('date', date.today().isoformat())
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = date.today()

        sessions = AttendanceSession.objects.filter(
            section__class_group__school=school,
            date=target_date
        ).prefetch_related('records', 'section__class_group')

        all_sections = Section.objects.filter(class_group__school=school)
        total_sections_count = all_sections.count()

        marked_section_ids = set(sessions.values_list('section_id', flat=True))
        pending_sections = all_sections.exclude(id__in=marked_section_ids).select_related('class_group')

        total_present = 0
        total_absent = 0
        total_late = 0
        total_excused = 0
        total_records = 0

        section_summaries = []
        for s in sessions:
            records = s.records.all()
            tot = records.count()
            p = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
            a = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
            l = sum(1 for r in records if r.status == AttendanceStatus.LATE)
            e = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)
            
            total_present += p
            total_absent += a
            total_late += l
            total_excused += e
            total_records += tot

            pct = round(((p + l * 0.8) / tot) * 100, 1) if tot > 0 else 0.0
            section_summaries.append({
                'session_id': s.id,
                'section_id': s.section.id,
                'section_name': f"{s.section.class_group.name} - {s.section.name}",
                'total': tot,
                'present': p,
                'absent': a,
                'late': l,
                'excused': e,
                'percentage': pct,
                'status': s.status,
                'taken_by': s.taken_by.get_full_name() if s.taken_by else 'Staff'
            })

        overall_pct = round(((total_present + total_late * 0.8) / total_records) * 100, 1) if total_records > 0 else 0.0

        pending_list = [
            {
                'section_id': sec.id,
                'section_name': f"{sec.class_group.name} - {sec.name}",
                'room_number': sec.room_number,
                'class_teacher': sec.class_teacher.user.get_full_name() if sec.class_teacher else 'Unassigned'
            }
            for sec in pending_sections
        ]

        return Response({
            'date': target_date.isoformat(),
            'total_students_enrolled': total_records if total_records > 0 else Student.objects.filter(school=school, status='ACTIVE').count(),
            'total_present': total_present,
            'total_absent': total_absent,
            'total_late': total_late,
            'total_excused': total_excused,
            'overall_percentage': overall_pct,
            'total_sections': total_sections_count,
            'marked_sections_count': len(marked_section_ids),
            'pending_sections_count': len(pending_list),
            'pending_sections': pending_list,
            'marked_sections': section_summaries,
        })


class AttendanceSheetView(views.APIView):
    """Fetches students for marking attendance for a specific section, subject, and date"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        section_id = request.query_params.get('section_id')
        subject_id = request.query_params.get('subject_id')
        date_str = request.query_params.get('date', date.today().isoformat())
        session_type = request.query_params.get('session_type', AttendanceSessionType.FULL_DAY)

        if not section_id:
            return Response({'detail': 'section_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = date.today()

        enrollments = StudentEnrollment.objects.filter(
            section_id=section_id,
            is_active=True
        ).select_related('student').order_by('roll_number', 'student__first_name')

        session_filter = {'section_id': section_id, 'date': target_date}
        if subject_id:
            session_filter['subject_id'] = subject_id
        else:
            session_filter['session_type'] = session_type

        existing_session = AttendanceSession.objects.filter(**session_filter).first()

        existing_records_map = {}
        if existing_session:
            for r in existing_session.records.all():
                existing_records_map[r.student_id] = {
                    'record_id': r.id,
                    'status': r.status,
                    'check_in_time': r.check_in_time.strftime('%H:%M') if r.check_in_time else '',
                    'remarks': r.remarks
                }

        students_data = []
        for enr in enrollments:
            st = enr.student
            rec = existing_records_map.get(st.id, {
                'record_id': None,
                'status': AttendanceStatus.PRESENT,
                'check_in_time': '',
                'remarks': ''
            })
            students_data.append({
                'student_id': st.id,
                'roll_number': enr.roll_number,
                'admission_number': st.admission_number,
                'first_name': st.first_name,
                'last_name': st.last_name,
                'full_name': st.full_name,
                'photo_url': st.photo_url,
                'record_id': rec['record_id'],
                'status': rec['status'] if rec['status'] in [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT] else AttendanceStatus.PRESENT,
                'check_in_time': rec['check_in_time'],
                'remarks': rec['remarks']
            })

        marked_at_str = None
        if existing_session:
            t = existing_session.marked_at or existing_session.created_at
            marked_at_str = t.strftime('%I:%M %p, %b %d, %Y')

        return Response({
            'section_id': int(section_id),
            'subject_id': int(subject_id) if subject_id else None,
            'subject_name': existing_session.subject.name if existing_session and existing_session.subject else None,
            'date': target_date.isoformat(),
            'session_type': session_type,
            'is_existing': existing_session is not None,
            'session_id': existing_session.id if existing_session else None,
            'notes': existing_session.notes if existing_session else '',
            'marked_at': marked_at_str,
            'students': students_data
        })


class AttendanceMarkView(views.APIView):
    """Submits or updates attendance records with atomic safety and audit logging"""
    permission_classes = [permissions.IsAuthenticated, CanMarkAttendance]

    @transaction.atomic
    def post(self, request):
        section_id = request.data.get('section_id')
        subject_id = request.data.get('subject_id')
        academic_year_id = request.data.get('academic_year_id')
        date_str = request.data.get('date')
        session_type = request.data.get('session_type', AttendanceSessionType.FULL_DAY)
        notes = request.data.get('notes', '')
        records_data = request.data.get('records', [])
        audit_reason = request.data.get('audit_reason', 'Routine attendance marking')

        if not section_id or not date_str:
            return Response({'detail': 'section_id and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fallback to current academic year if not passed
        if not academic_year_id:
            ay = AcademicYear.objects.filter(school=request.user.school, is_current=True).first()
            if not ay:
                ay = AcademicYear.objects.filter(school=request.user.school).first()
            if not ay:
                return Response({'detail': 'No academic year configured for this school.'}, status=status.HTTP_400_BAD_REQUEST)
            academic_year_id = ay.id

        session_lookup = {
            'section_id': section_id,
            'date': target_date,
        }
        subject_obj = None
        if subject_id:
            subject_obj = Subject.objects.filter(id=subject_id, school=request.user.school).first()
            if not subject_obj:
                return Response({'detail': 'Subject not found for this school.'}, status=status.HTTP_404_NOT_FOUND)
            session_lookup['subject'] = subject_obj
        else:
            session_lookup['session_type'] = session_type

        session, created = AttendanceSession.objects.get_or_create(
            **session_lookup,
            defaults={
                'academic_year_id': academic_year_id,
                'taken_by': request.user,
                'status': AttendanceSessionStatus.SUBMITTED,
                'notes': notes
            }
        )

        session.taken_by = request.user
        session.status = AttendanceSessionStatus.SUBMITTED
        session.notes = notes
        session.save() # auto updates marked_at

        audit_entries = []
        for r in records_data:
            student_id = r.get('student_id')
            raw_status = r.get('status', AttendanceStatus.PRESENT)
            st_status = AttendanceStatus.PRESENT if raw_status == AttendanceStatus.PRESENT else AttendanceStatus.ABSENT
            remarks = r.get('remarks', '')

            existing_record = AttendanceRecord.objects.filter(session=session, student_id=student_id).first()

            if existing_record:
                if existing_record.status != st_status:
                    audit_entries.append(AttendanceAuditLog(
                        attendance_record=existing_record,
                        modified_by=request.user,
                        previous_status=existing_record.status,
                        new_status=st_status,
                        reason=audit_reason
                    ))
                existing_record.status = st_status
                existing_record.remarks = remarks
                existing_record.save()
            else:
                AttendanceRecord.objects.create(
                    session=session,
                    student_id=student_id,
                    status=st_status,
                    remarks=remarks
                )

        if audit_entries:
            AttendanceAuditLog.objects.bulk_create(audit_entries)

        present_count = sum(1 for r in records_data if r.get('status') == AttendanceStatus.PRESENT)
        absent_count = len(records_data) - present_count
        formatted_timestamp = session.marked_at.strftime('%I:%M:%S %p, %b %d, %Y')

        return Response({
            'detail': f'Attendance successfully saved at {formatted_timestamp}',
            'created': created,
            'session_id': session.id,
            'subject_id': session.subject_id,
            'subject_name': session.subject.name if session.subject else None,
            'marked_at': formatted_timestamp,
            'timestamp': session.marked_at.isoformat(),
            'records_count': len(records_data),
            'present_count': present_count,
            'absent_count': absent_count,
            'audits_generated': len(audit_entries)
        })


class AttendanceCalendarView(views.APIView):
    """Provides monthly aggregated attendance counts for the interactive calendar"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        school = request.user.school
        section_id = request.query_params.get('section_id')
        year = int(request.query_params.get('year', date.today().year))
        month = int(request.query_params.get('month', date.today().month))

        qs = AttendanceRecord.objects.filter(
            session__section__class_group__school=school,
            session__date__year=year,
            session__date__month=month
        )

        if section_id:
            qs = qs.filter(session__section_id=section_id)

        # Aggregate daily numbers
        daily_records = {}
        for r in qs.select_related('session'):
            d_str = r.session.date.isoformat()
            if d_str not in daily_records:
                daily_records[d_str] = {'date': d_str, 'present': 0, 'absent': 0, 'late': 0, 'excused': 0, 'total': 0}
            daily_records[d_str]['total'] += 1
            st = r.status.lower()
            if st in daily_records[d_str]:
                daily_records[d_str][st] += 1

        for d_str, item in daily_records.items():
            tot = item['total']
            item['percentage'] = round(((item['present'] + item['late'] * 0.8) / tot) * 100, 1) if tot > 0 else 0.0

        return Response(list(daily_records.values()))


class AttendanceSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = AttendanceSession.objects.filter(
            section__class_group__school=self.request.user.school
        ).select_related('section__class_group', 'subject', 'taken_by').prefetch_related('records')
        section_id = self.request.query_params.get('section_id')
        subject_id = self.request.query_params.get('subject_id')
        date_str = self.request.query_params.get('date')
        if section_id:
            qs = qs.filter(section_id=section_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if date_str:
            qs = qs.filter(date=date_str)
        return qs[:50]


class AttendanceAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttendanceAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        return AttendanceAuditLog.objects.filter(
            attendance_record__session__section__class_group__school=self.request.user.school
        ).select_related('attendance_record__student', 'attendance_record__session', 'modified_by')
