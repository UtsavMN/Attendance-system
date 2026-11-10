import io
from datetime import date, timedelta, datetime
from django.http import HttpResponse
from django.db.models import Avg, Count, Q
from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

class QueryParamOrHeaderJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.query_params.get('token')
        if token:
            try:
                validated_token = self.get_validated_token(token)
                return self.get_user(validated_token), validated_token
            except Exception:
                pass
        return super().authenticate(request)

from core.models import School, AuditLog, Notification
from academic.models import ClassGroup, Section, AcademicYear, Subject
from students.models import Student, StudentEnrollment
from attendance.models import AttendanceRecord, AttendanceSession, AttendanceStatus
from grades.models import Examination, ExamSubject, StudentMark, GradingScale
from core.permissions import IsTeacherOrAdmin

# ReportLab for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# openpyxl for Excel generation
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

class DashboardOverviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        school = request.user.school
        today = date.today()

        # 1. Total Students & Classes
        total_students = Student.objects.filter(school=school, status='ACTIVE').count()
        total_classes = ClassGroup.objects.filter(school=school).count()
        total_sections = Section.objects.filter(class_group__school=school).count()

        # 2. Today's Attendance
        today_records = AttendanceRecord.objects.filter(
            session__section__class_group__school=school,
            session__date=today
        )
        today_total = today_records.count()
        present_today = today_records.filter(status=AttendanceStatus.PRESENT).count()
        absent_today = today_records.filter(status=AttendanceStatus.ABSENT).count()
        late_today = today_records.filter(status=AttendanceStatus.LATE).count()
        excused_today = today_records.filter(status=AttendanceStatus.EXCUSED).count()

        today_pct = round(((present_today + late_today * 0.8) / today_total) * 100, 1) if today_total > 0 else 0.0

        # 3. Attendance Trend (Last 14 days)
        trend_start = today - timedelta(days=13)
        sessions_14 = AttendanceSession.objects.filter(
            section__class_group__school=school,
            date__gte=trend_start,
            date__lte=today
        ).prefetch_related('records')

        daily_agg = {}
        for d_offset in range(14):
            day_d = trend_start + timedelta(days=d_offset)
            # Skip Sundays for school days
            if day_d.weekday() != 6:
                daily_agg[day_d.isoformat()] = {
                    'date': day_d.strftime('%b %d'),
                    'full_date': day_d.isoformat(),
                    'total': 0,
                    'present': 0,
                    'absent': 0,
                    'late': 0,
                    'percentage': 0.0
                }

        for s in sessions_14:
            d_key = s.date.isoformat()
            if d_key in daily_agg:
                records = s.records.all()
                p = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
                a = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
                l = sum(1 for r in records if r.status == AttendanceStatus.LATE)
                daily_agg[d_key]['total'] += records.count()
                daily_agg[d_key]['present'] += p
                daily_agg[d_key]['absent'] += a
                daily_agg[d_key]['late'] += l

        trend_list = []
        for d_key, data in daily_agg.items():
            tot = data['total']
            data['percentage'] = round(((data['present'] + data['late'] * 0.8) / tot) * 100, 1) if tot > 0 else 0.0
            trend_list.append(data)

        # 4. Attendance Distribution
        distribution = [
            {'name': 'Present', 'value': present_today, 'color': '#166534'},
            {'name': 'Late', 'value': late_today, 'color': '#D97706'},
            {'name': 'Absent', 'value': absent_today, 'color': '#DC2626'},
            {'name': 'Excused', 'value': excused_today, 'color': '#5276A7'},
        ]

        # 5. Class-wise Attendance
        class_groups = ClassGroup.objects.filter(school=school).prefetch_related('sections')
        class_attendance = []
        for cg in class_groups:
            cg_records = AttendanceRecord.objects.filter(
                session__section__class_group=cg,
                session__date__gte=today - timedelta(days=30)
            )
            cg_total = cg_records.count()
            cg_present = cg_records.filter(status=AttendanceStatus.PRESENT)
            cg_late = cg_records.filter(status=AttendanceStatus.LATE).count()
            cg_present_cnt = cg_present.count()
            cg_pct = round(((cg_present_cnt + cg_late * 0.8) / cg_total) * 100, 1) if cg_total > 0 else 0.0
            class_attendance.append({
                'class_id': cg.id,
                'class_name': cg.name,
                'attendance_percentage': cg_pct,
                'student_count': cg.sections.aggregate(total=Count('enrollments', filter=Q(enrollments__is_active=True)))['total'] or 0
            })

        # 6. Students Requiring Attention (Low attendance or low grades)
        threshold = float(school.attendance_threshold) if school else 75.0
        attention_list = []
        active_students = Student.objects.filter(school=school, status='ACTIVE').prefetch_related(
            'enrollments__section__class_group',
            'attendance_records',
            'exam_marks'
        )[:50]

        for st in active_students:
            recs = st.attendance_records.all()
            tot = recs.count()
            p_cnt = sum(1 for r in recs if r.status == AttendanceStatus.PRESENT)
            l_cnt = sum(1 for r in recs if r.status == AttendanceStatus.LATE)
            att_pct = round(((p_cnt + l_cnt * 0.8) / tot) * 100, 1) if tot > 0 else 100.0

            # Academic average
            m_list = [m.percentage for m in st.exam_marks.filter(is_absent=False, marks_obtained__isnull=False)]
            acad_avg = round(sum(m_list) / len(m_list), 1) if m_list else None

            reasons = []
            if att_pct < threshold and tot >= 3:
                reasons.append(f"Low Attendance ({att_pct}%)")
            if acad_avg is not None and acad_avg < 50.0:
                reasons.append(f"Low Academics ({acad_avg}%)")

            if reasons:
                enr = st.enrollments.filter(is_active=True).first()
                attention_list.append({
                    'id': st.id,
                    'name': st.full_name,
                    'admission_number': st.admission_number,
                    'class_name': enr.section.class_group.name if enr else '-',
                    'section_name': enr.section.name if enr else '-',
                    'attendance_percentage': att_pct,
                    'academic_average': acad_avg,
                    'reason': ", ".join(reasons)
                })

        # 7. Recent Activity stream
        audit_activities = AuditLog.objects.filter(school=school).select_related('user')[:8]
        activity_list = [
            {
                'id': a.id,
                'action': a.action,
                'target_model': a.target_model,
                'user_name': a.user.get_full_name() if a.user else 'System',
                'details': a.details,
                'timestamp': a.timestamp.strftime('%b %d, %H:%M')
            }
            for a in audit_activities
        ]

        return Response({
            'stats': {
                'total_students': total_students,
                'present_today': present_today,
                'absent_today': absent_today,
                'attendance_percentage': today_pct,
                'total_classes': total_classes,
                'total_sections': total_sections,
                'students_requiring_attention': len(attention_list),
            },
            'trends': trend_list,
            'distribution': distribution,
            'class_attendance': class_attendance,
            'attention_needed': attention_list[:10],
            'recent_activity': activity_list,
        })


class ClassAnalysisView(views.APIView):
    """Provides class-wise comparative analytics for attendance and academic performance"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        school = request.user.school
        class_groups = ClassGroup.objects.filter(school=school).order_by('order_index', 'name')
        grading_scale = (
            GradingScale.objects.filter(school=school, is_default=True).first()
            or GradingScale.objects.filter(school=school).first()
        )

        class_analysis = []
        for cg in class_groups:
            # Active students in this class
            enrolled_students = Student.objects.filter(
                school=school,
                status='ACTIVE',
                enrollments__section__class_group=cg,
                enrollments__is_active=True
            ).distinct()
            st_count = enrolled_students.count()

            # Attendance for this class
            records = AttendanceRecord.objects.filter(
                session__section__class_group=cg
            )
            total_records = records.count()
            present_cnt = records.filter(status=AttendanceStatus.PRESENT).count()
            absent_cnt = records.filter(status=AttendanceStatus.ABSENT).count()
            late_cnt = records.filter(status=AttendanceStatus.LATE).count()
            att_pct = round(((present_cnt + late_cnt * 0.8) / total_records) * 100, 1) if total_records > 0 else 0.0

            # Academic marks for this class
            marks = StudentMark.objects.filter(
                student__in=enrolled_students,
                is_absent=False,
                marks_obtained__isnull=False
            ).select_related('exam_subject')

            mark_pcts = [m.percentage for m in marks]
            acad_avg = round(sum(mark_pcts) / len(mark_pcts), 1) if mark_pcts else None
            pass_cnt = sum(1 for m in marks if float(m.marks_obtained) >= float(m.exam_subject.pass_marks))
            pass_rate = round((pass_cnt / len(marks)) * 100, 1) if marks else None
            grade_info = grading_scale.get_grade_for_percentage(acad_avg) if (grading_scale and acad_avg is not None) else {'grade': 'N/A', 'gpa': 0.0}

            class_analysis.append({
                'class_id': cg.id,
                'class_name': cg.name,
                'code': cg.code,
                'student_count': st_count,
                'attendance_percentage': att_pct,
                'total_attendance_sessions': total_records,
                'present_count': present_cnt,
                'absent_count': absent_cnt,
                'academic_average': acad_avg,
                'pass_rate': pass_rate,
                'overall_grade': grade_info.get('grade', 'N/A') if acad_avg is not None else '-',
                'gpa': grade_info.get('gpa', 0.0) if acad_avg is not None else None,
                'evaluated_assessments': len(marks)
            })

        active_att_classes = [c['attendance_percentage'] for c in class_analysis if c['total_attendance_sessions'] > 0]
        active_acad_classes = [c['academic_average'] for c in class_analysis if c['academic_average'] is not None]

        return Response({
            'classes': class_analysis,
            'summary': {
                'total_classes': len(class_analysis),
                'total_enrolled': sum(c['student_count'] for c in class_analysis),
                'school_attendance_avg': round(sum(active_att_classes) / len(active_att_classes), 1) if active_att_classes else 0.0,
                'school_academic_avg': round(sum(active_acad_classes) / len(active_acad_classes), 1) if active_acad_classes else None,
                'evaluated_classes_count': len(active_acad_classes),
            }
        })


class ExportExcelView(views.APIView):
    """Generates styled Excel spreadsheets for Attendance and Academic records"""
    authentication_classes = [QueryParamOrHeaderJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        report_type = request.query_params.get('type', 'attendance')
        school = request.user.school

        wb = openpyxl.Workbook()
        ws = wb.active

        # Styling definitions
        header_fill = PatternFill(start_color="17243A", end_color="17243A", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=14, bold=True, color="17243A")
        sub_font = Font(name="Calibri", size=10, italic=True, color="64748B")
        border_thin = Border(
            left=Side(style='thin', color='E8EBF0'),
            right=Side(style='thin', color='E8EBF0'),
            top=Side(style='thin', color='E8EBF0'),
            bottom=Side(style='thin', color='E8EBF0')
        )

        ws['A1'] = school.name if school else 'Scholaris Academy'
        ws['A1'].font = title_font
        ws['A2'] = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')} | Report Type: {report_type.upper()}"
        ws['A2'].font = sub_font

        if report_type == 'attendance':
            ws.title = "Attendance Summary"
            headers = ["Admission No", "Student Name", "Class", "Section", "Total Days", "Present", "Late", "Absent", "Excused", "Attendance %"]
            start_row = 4
            for col_idx, h in enumerate(headers, 1):
                cell = ws.cell(row=start_row, column=col_idx, value=h)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center" if col_idx > 4 else "left")

            students = Student.objects.filter(school=school, status='ACTIVE').prefetch_related(
                'enrollments__section__class_group', 'attendance_records'
            )

            current_row = 5
            for st in students:
                enr = st.enrollments.filter(is_active=True).first()
                recs = st.attendance_records.all()
                tot = recs.count()
                p = sum(1 for r in recs if r.status == AttendanceStatus.PRESENT)
                l = sum(1 for r in recs if r.status == AttendanceStatus.LATE)
                a = sum(1 for r in recs if r.status == AttendanceStatus.ABSENT)
                e = sum(1 for r in recs if r.status == AttendanceStatus.EXCUSED)
                pct = round(((p + l * 0.8) / tot) * 100, 1) if tot > 0 else 0.0

                row_vals = [
                    st.admission_number,
                    st.full_name,
                    enr.section.class_group.name if enr else '-',
                    enr.section.name if enr else '-',
                    tot, p, l, a, e, f"{pct}%"
                ]
                for c_idx, val in enumerate(row_vals, 1):
                    c = ws.cell(row=current_row, column=c_idx, value=val)
                    c.border = border_thin
                    if c_idx > 4:
                        c.alignment = Alignment(horizontal="center")
                current_row += 1

        else: # academics report
            ws.title = "Academic Performance"
            headers = ["Admission No", "Student Name", "Class", "Section", "Examination", "Overall Average %", "Grade", "Status"]
            start_row = 4
            for col_idx, h in enumerate(headers, 1):
                cell = ws.cell(row=start_row, column=col_idx, value=h)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center" if col_idx > 4 else "left")

            scale = GradingScale.objects.filter(school=school, is_default=True).first()
            current_row = 5
            students = Student.objects.filter(school=school, status='ACTIVE').prefetch_related(
                'enrollments__section__class_group', 'exam_marks__exam_subject__examination'
            )
            for st in students:
                enr = st.enrollments.filter(is_active=True).first()
                marks = st.exam_marks.filter(is_absent=False, marks_obtained__isnull=False)
                if marks.exists():
                    pcts = [m.percentage for m in marks]
                    avg = round(sum(pcts) / len(pcts), 1)
                    grade = scale.get_grade_for_percentage(avg).get('grade', 'F') if scale else 'N/A'
                    exam_names = ", ".join(set(m.exam_subject.examination.name for m in marks))
                else:
                    avg = 0.0
                    grade = '-'
                    exam_names = 'None'

                row_vals = [
                    st.admission_number,
                    st.full_name,
                    enr.section.class_group.name if enr else '-',
                    enr.section.name if enr else '-',
                    exam_names,
                    f"{avg}%",
                    grade,
                    "Passed" if avg >= 40 else "Needs Improvement"
                ]
                for c_idx, val in enumerate(row_vals, 1):
                    c = ws.cell(row=current_row, column=c_idx, value=val)
                    c.border = border_thin
                    if c_idx in [5, 6, 7, 8]:
                        c.alignment = Alignment(horizontal="center")
                current_row += 1

        # Adjust column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response['Content-Disposition'] = f'attachment; filename="scholaris_{report_type}_report.xlsx"'
        return response


class StudentReportCardPdfView(views.APIView):
    """Generates an official high-resolution PDF Report Card with ReportLab"""
    authentication_classes = [QueryParamOrHeaderJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, student_id):
        school = request.user.school
        try:
            student = Student.objects.get(id=student_id, school=school)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        elements = []
        styles = getSampleStyleSheet()

        # Styles
        school_title_style = ParagraphStyle(
            'SchoolTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#17243A'),
            alignment=1
        )
        sub_header_style = ParagraphStyle(
            'SubHeader',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#64748B'),
            alignment=1
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#17243A'),
            spaceBefore=8,
            spaceAfter=4
        )
        normal_style = ParagraphStyle(
            'NormalStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )
        bold_style = ParagraphStyle(
            'BoldStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#17243A')
        )

        # School Header
        school_name = school.name if school else 'SCHOLARIS ACADEMY'
        school_addr = school.address if (school and school.address) else '100 Academic Blvd, Metro District, Education City'
        school_contact = f"Phone: {school.phone or '+1 (555) 019-2834'} | Email: {school.email or 'admin@scholaris.edu'}"

        elements.append(Paragraph(school_name.upper(), school_title_style))
        elements.append(Spacer(1, 2))
        elements.append(Paragraph(school_addr, sub_header_style))
        elements.append(Paragraph(school_contact, sub_header_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#17243A'), spaceBefore=2, spaceAfter=8))

        # Document Title
        report_title = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#17243A'),
            alignment=1
        )
        elements.append(Paragraph("OFFICIAL STUDENT ACADEMIC REPORT CARD", report_title))
        elements.append(Spacer(1, 6))

        # Student Details Table
        enrollment = student.enrollments.filter(is_active=True).first()
        academic_year = enrollment.academic_year.name if enrollment else '2025-2026'
        class_name = f"{enrollment.section.class_group.name} - Section {enrollment.section.name}" if enrollment else '-'
        roll_no = enrollment.roll_number if enrollment else '-'

        student_info = [
            [
                Paragraph("<b>Student Name:</b>", bold_style), Paragraph(student.full_name, normal_style),
                Paragraph("<b>Admission No:</b>", bold_style), Paragraph(student.admission_number, normal_style),
            ],
            [
                Paragraph("<b>Class & Section:</b>", bold_style), Paragraph(class_name, normal_style),
                Paragraph("<b>Roll Number:</b>", bold_style), Paragraph(roll_no, normal_style),
            ],
            [
                Paragraph("<b>Academic Year:</b>", bold_style), Paragraph(academic_year, normal_style),
                Paragraph("<b>Date of Birth:</b>", bold_style), Paragraph(student.date_of_birth.strftime('%b %d, %Y'), normal_style),
            ],
        ]
        info_table = Table(student_info, colWidths=[100, 170, 95, 175])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7F8FA')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8EBF0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8EBF0')),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 12))

        # Academic Performance Table
        elements.append(Paragraph("ACADEMIC EVALUATION", section_heading))

        marks = student.exam_marks.select_related('exam_subject__subject', 'exam_subject__examination').order_by('exam_subject__subject__name')
        scale = GradingScale.objects.filter(school=school, is_default=True).first()

        table_data = [
            [
                Paragraph("<b>Subject</b>", bold_style),
                Paragraph("<b>Max Marks</b>", bold_style),
                Paragraph("<b>Pass Marks</b>", bold_style),
                Paragraph("<b>Marks Obtained</b>", bold_style),
                Paragraph("<b>Percentage</b>", bold_style),
                Paragraph("<b>Grade</b>", bold_style),
                Paragraph("<b>Remarks</b>", bold_style),
            ]
        ]

        total_max = 0
        total_obt = 0
        for m in marks:
            max_m = float(m.exam_subject.max_marks)
            pass_m = float(m.exam_subject.pass_marks)
            obt = float(m.marks_obtained) if (m.marks_obtained is not None and not m.is_absent) else 0.0
            pct = round((obt / max_m) * 100, 1) if max_m > 0 else 0.0
            grade = scale.get_grade_for_percentage(pct).get('grade', 'F') if (scale and not m.is_absent) else ('ABS' if m.is_absent else '-')
            
            total_max += max_m
            total_obt += obt

            table_data.append([
                Paragraph(m.exam_subject.subject.name, normal_style),
                Paragraph(str(int(max_m)), normal_style),
                Paragraph(str(int(pass_m)), normal_style),
                Paragraph(str(int(obt)) if not m.is_absent else 'ABS', normal_style),
                Paragraph(f"{pct}%" if not m.is_absent else '-', normal_style),
                Paragraph(grade, bold_style),
                Paragraph(m.remarks or ('Satisfactory' if pct >= 60 else 'Needs Focus'), normal_style),
            ])

        overall_pct = round((total_obt / total_max) * 100, 1) if total_max > 0 else 0.0
        overall_grade = scale.get_grade_for_percentage(overall_pct).get('grade', 'F') if scale else '-'

        # Summary Row
        table_data.append([
            Paragraph("<b>TOTAL / OVERALL</b>", bold_style),
            Paragraph(f"<b>{int(total_max)}</b>", bold_style),
            Paragraph("-", bold_style),
            Paragraph(f"<b>{int(total_obt)}</b>", bold_style),
            Paragraph(f"<b>{overall_pct}%</b>", bold_style),
            Paragraph(f"<b>{overall_grade}</b>", bold_style),
            Paragraph("<b>" + ("Passed" if overall_pct >= 40 else "Under Review") + "</b>", bold_style),
        ])

        marks_table = Table(table_data, colWidths=[120, 60, 60, 80, 70, 50, 100])
        marks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#17243A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-2, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8EBF0')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F1F5F9')),
        ]))
        elements.append(marks_table)
        elements.append(Spacer(1, 12))

        # Attendance & Remarks Section
        elements.append(Paragraph("ATTENDANCE RECORD", section_heading))
        att_recs = student.attendance_records.all()
        att_total = att_recs.count()
        att_present = sum(1 for r in att_recs if r.status == AttendanceStatus.PRESENT)
        att_late = sum(1 for r in att_recs if r.status == AttendanceStatus.LATE)
        att_absent = sum(1 for r in att_recs if r.status == AttendanceStatus.ABSENT)
        att_excused = sum(1 for r in att_recs if r.status == AttendanceStatus.EXCUSED)
        att_pct = round(((att_present + att_late * 0.8) / att_total) * 100, 1) if att_total > 0 else 100.0

        att_summary = [
            [
                Paragraph("<b>Total Working Days:</b>", bold_style), Paragraph(str(att_total), normal_style),
                Paragraph("<b>Days Present:</b>", bold_style), Paragraph(str(att_present), normal_style),
                Paragraph("<b>Attendance Percentage:</b>", bold_style), Paragraph(f"<b>{att_pct}%</b>", bold_style),
            ],
            [
                Paragraph("<b>Days Late:</b>", bold_style), Paragraph(str(att_late), normal_style),
                Paragraph("<b>Days Absent:</b>", bold_style), Paragraph(str(att_absent), normal_style),
                Paragraph("<b>Excused Absences:</b>", bold_style), Paragraph(str(att_excused), normal_style),
            ]
        ]
        att_table = Table(att_summary, colWidths=[110, 70, 95, 75, 120, 70])
        att_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7F8FA')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8EBF0')),
        ]))
        elements.append(att_table)
        elements.append(Spacer(1, 20))

        # Signatures
        sig_data = [
            [
                Paragraph("__________________________<br/><b>Class Teacher Signature</b>", normal_style),
                Paragraph("__________________________<br/><b>Principal Signature</b>", normal_style),
                Paragraph("__________________________<br/><b>Parent / Guardian Signature</b>", normal_style),
            ]
        ]
        sig_table = Table(sig_data, colWidths=[180, 180, 180])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="report_card_{student.admission_number}.pdf"'
        return response
