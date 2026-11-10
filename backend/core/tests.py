from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from core.models import School, User, UserRole, AuditLog
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher
from students.models import Student, StudentEnrollment
from attendance.models import AttendanceSession, AttendanceRecord, AttendanceStatus, AttendanceAuditLog
from grades.models import Examination, ExamSubject, StudentMark, GradingScale

class ScholarisBackendTestSuite(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. School
        self.school = School.objects.create(
            name="Test Horizon Academy",
            code="horizon",
            attendance_threshold=75.0,
            warning_threshold=85.0
        )

        # 2. Users
        self.admin = User.objects.create_user(
            username="admin_test",
            password="password123",
            role=UserRole.SCHOOL_ADMIN,
            school=self.school
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_test",
            password="password123",
            role=UserRole.TEACHER,
            school=self.school
        )

        # Teacher profile
        self.teacher = Teacher.objects.create(
            school=self.school,
            user=self.teacher_user,
            employee_id="T-001",
            designation="Math Teacher"
        )

        # 3. Academic Structure
        self.ay = AcademicYear.objects.create(
            school=self.school,
            name="2025-2026",
            start_date=date(2025, 8, 1),
            end_date=date(2026, 6, 30),
            is_current=True
        )
        self.class_group = ClassGroup.objects.create(
            school=self.school,
            name="Grade 10",
            code="G10",
            order_index=1
        )
        self.section = Section.objects.create(
            class_group=self.class_group,
            name="A",
            class_teacher=self.teacher
        )
        self.subject = Subject.objects.create(
            school=self.school,
            name="Mathematics",
            code="MATH"
        )

        # 4. Student & Enrollment
        self.student = Student.objects.create(
            school=self.school,
            admission_number="ADM-001",
            admission_date=date(2025, 8, 1),
            first_name="Lucas",
            last_name="Scott",
            date_of_birth=date(2009, 5, 12),
            gender="MALE",
            status="ACTIVE"
        )
        self.enrollment = StudentEnrollment.objects.create(
            student=self.student,
            academic_year=self.ay,
            section=self.section,
            roll_number="01",
            is_active=True
        )

        # 5. Grading Scale
        self.scale = GradingScale.objects.create(
            school=self.school,
            name="Standard Scale",
            is_default=True,
            rules=[
                {"min": 90, "max": 100, "grade": "A+", "gpa": 4.0},
                {"min": 80, "max": 89.99, "grade": "A", "gpa": 3.7},
                {"min": 70, "max": 79.99, "grade": "B", "gpa": 3.0},
                {"min": 50, "max": 69.99, "grade": "C", "gpa": 2.0},
                {"min": 0, "max": 49.99, "grade": "F", "gpa": 0.0},
            ]
        )

        # Login admin by default
        login_res = self.client.post(reverse('auth-login'), {
            'username': 'admin_test',
            'password': 'password123'
        })
        self.token = login_res.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_01_authentication_and_user_profile(self):
        """Test valid login, token generation, and current user profile fetch"""
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'admin_test')
        self.assertEqual(response.data['school']['code'], 'horizon')

    def test_02_student_list_and_filters(self):
        """Test student directory search and filtering"""
        response = self.client.get(reverse('student-list'), {'search': 'Lucas'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['admission_number'], 'ADM-001')

    def test_03_attendance_marking_and_duplicate_prevention(self):
        """Test marking attendance, duplicate session safety, and audit logs"""
        url = reverse('attendance-mark')
        payload = {
            'section_id': self.section.id,
            'academic_year_id': self.ay.id,
            'date': '2026-11-10',
            'records': [
                {'student_id': self.student.id, 'status': 'PRESENT', 'remarks': 'On time'}
            ]
        }
        res1 = self.client.post(url, payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['created'], True)

        # Verify duplicate session is updated, not duplicated
        res2 = self.client.post(url, payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['created'], False)

        # Verify attendance sessions count in DB is exactly 1
        sessions_count = AttendanceSession.objects.filter(section=self.section, date='2026-11-10').count()
        self.assertEqual(sessions_count, 1)

        # Modify status to ABSENT to verify audit log trigger
        payload_update = {
            'section_id': self.section.id,
            'academic_year_id': self.ay.id,
            'date': '2026-11-10',
            'audit_reason': 'Parent notified fever',
            'records': [
                {'student_id': self.student.id, 'status': 'ABSENT', 'remarks': 'Sick leave'}
            ]
        }
        res3 = self.client.post(url, payload_update, format='json')
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data['audits_generated'], 1)

        audit = AttendanceAuditLog.objects.filter(attendance_record__student=self.student).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.previous_status, 'PRESENT')
        self.assertEqual(audit.new_status, 'ABSENT')
        self.assertEqual(audit.reason, 'Parent notified fever')

    def test_04_marks_entry_and_grade_calculation(self):
        """Test entering examination marks and automatic grade calculation"""
        exam = Examination.objects.create(
            school=self.school,
            academic_year=self.ay,
            name="Term 1 Midterms",
            term="Term 1",
            start_date=date(2025, 10, 1),
            end_date=date(2025, 10, 10)
        )
        exam_subj = ExamSubject.objects.create(
            examination=exam,
            class_group=self.class_group,
            subject=self.subject,
            max_marks=100.0,
            pass_marks=40.0
        )

        # Submit marks
        marks_res = self.client.post(reverse('marks-entry'), {
            'exam_subject_id': exam_subj.id,
            'marks': [
                {'student_id': self.student.id, 'marks_obtained': 92.5, 'remarks': 'Superb work'}
            ]
        }, format='json')
        self.assertEqual(marks_res.status_code, status.HTTP_200_OK)

        mark = StudentMark.objects.get(exam_subject=exam_subj, student=self.student)
        self.assertEqual(float(mark.marks_obtained), 92.5)
        self.assertEqual(mark.percentage, 92.5)

        # Check full student profile calculation
        profile_res = self.client.get(f"/api/students/{self.student.id}/full-profile/")
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['academic_summary']['overall_average'], 92.5)
        self.assertEqual(profile_res.data['academic_summary']['overall_grade'], 'A+')

    def test_05_dashboard_overview_metrics(self):
        """Test dashboard overview statistics aggregation"""
        res = self.client.get(reverse('dashboard-overview'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('stats', res.data)
        self.assertIn('trends', res.data)
        self.assertIn('distribution', res.data)
        self.assertIn('class_attendance', res.data)
        self.assertEqual(res.data['stats']['total_students'], 1)

    def test_06_report_card_pdf_generation(self):
        """Test server-side PDF report card rendering"""
        res = self.client.get(f"/api/reports/student-report-card-pdf/{self.student.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertTrue(len(res.content) > 1000)

    def test_07_excel_export_generation(self):
        """Test Excel report generation"""
        res = self.client.get(reverse('export-excel'), {'type': 'attendance'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', res['Content-Type'])
        self.assertTrue(len(res.content) > 500)

    def test_08_subject_wise_attendance_sessions(self):
        """Test subject-wise attendance with independent sessions and timestamps"""
        science = Subject.objects.create(school=self.school, name="Science", code="SCI")
        self.class_group.subjects.add(self.subject, science)

        url = reverse('attendance-mark')
        target_date = '2026-11-10'

        # Session 1: Mathematics - Mark PRESENT
        res_math = self.client.post(url, {
            'section_id': self.section.id,
            'subject_id': self.subject.id,
            'date': target_date,
            'records': [{'student_id': self.student.id, 'status': 'PRESENT'}]
        }, format='json')
        self.assertEqual(res_math.status_code, status.HTTP_200_OK)
        self.assertEqual(res_math.data['subject_name'], 'Mathematics')
        self.assertIsNotNone(res_math.data['marked_at'])

        # Session 2: Science - Mark ABSENT on the same day
        res_sci = self.client.post(url, {
            'section_id': self.section.id,
            'subject_id': science.id,
            'date': target_date,
            'records': [{'student_id': self.student.id, 'status': 'ABSENT'}]
        }, format='json')
        self.assertEqual(res_sci.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sci.data['subject_name'], 'Science')

        # Verify two distinct sessions exist for this section on target_date
        sessions_res = self.client.get(f"/api/attendance-sessions/?section_id={self.section.id}&date={target_date}")
        self.assertEqual(sessions_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(sessions_res.data), 2)

        # Verify Math is PRESENT and Science is ABSENT
        rec_math = AttendanceRecord.objects.get(session__subject=self.subject, student=self.student, session__date=target_date)
        rec_sci = AttendanceRecord.objects.get(session__subject=science, student=self.student, session__date=target_date)
        self.assertEqual(rec_math.status, AttendanceStatus.PRESENT)
        self.assertEqual(rec_sci.status, AttendanceStatus.ABSENT)

    def test_09_student_create_update_delete(self):
        """Test student CRUD lifecycle including deletion"""
        create_payload = {
            'first_name': 'Aarav',
            'last_name': 'Patel',
            'date_of_birth': '2008-03-15',
            'gender': 'MALE',
            'admission_number': 'ADM-NEW-999',
            'admission_date': '2026-11-10',
            'academic_year_id': self.ay.id,
            'section_id': self.section.id,
            'roll_number': '99'
        }
        res = self.client.post(reverse('student-list'), create_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_id = res.data['id']

        # Verify in list
        list_res = self.client.get(reverse('student-list'), {'search': 'Aarav'})
        self.assertEqual(len(list_res.data['results']), 1)

        # Delete student
        del_res = self.client.delete(f"/api/students/{new_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm student is removed
        confirm_res = self.client.get(f"/api/students/{new_id}/")
        self.assertEqual(confirm_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_10_class_subject_assignment_and_deletion(self):
        """Test assigning subject to class and class deletion"""
        # Create new class
        cg_res = self.client.post(reverse('class-group-list'), {
            'name': 'Grade 12',
            'code': 'G12',
            'order_index': 3
        }, format='json')
        self.assertEqual(cg_res.status_code, status.HTTP_201_CREATED)
        cg_id = cg_res.data['id']

        # Assign subject to class
        assign_res = self.client.post(f"/api/classes/{cg_id}/assign_subject/", {
            'subject_id': self.subject.id
        }, format='json')
        self.assertEqual(assign_res.status_code, status.HTTP_200_OK)

        # Verify class has 1 subject
        detail = self.client.get(f"/api/classes/{cg_id}/")
        self.assertEqual(len(detail.data['subjects']), 1)

        # Delete class
        del_cg = self.client.delete(f"/api/classes/{cg_id}/")
        self.assertEqual(del_cg.status_code, status.HTTP_204_NO_CONTENT)

    def test_11_unauthenticated_requests_blocked(self):
        """Ensure security: unauthenticated requests are rejected with 401"""
        anon_client = APIClient()
        res = anon_client.get(reverse('student-list'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res_att = anon_client.post(reverse('attendance-mark'), {})
        self.assertEqual(res_att.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_12_admission_number_uniqueness_validation(self):
        """Ensure registering duplicate admission number returns clean 400 error"""
        dup_payload = {
            'first_name': 'Duplicate',
            'last_name': 'Student',
            'date_of_birth': '2008-01-01',
            'gender': 'FEMALE',
            'admission_number': 'ADM-001', # Already exists on self.student
            'academic_year_id': self.ay.id,
            'section_id': self.section.id
        }
        res = self.client.post(reverse('student-list'), dup_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('admission_number', res.data)
