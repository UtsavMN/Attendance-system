from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import School, User, UserRole, Notification, AuditLog
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher, SectionSubjectTeacher
from students.models import Student, Guardian, StudentGuardian, StudentEnrollment, StudentRemark, StudentAchievement
from attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from grades.models import GradingScale, Examination, ExamSubject, StudentMark

class Command(BaseCommand):
    help = 'Clears all synthetic/mock student, attendance, exam, and teacher records from the database'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Removing all mock data from Scholaris database..."))

        # 1. Delete student records & activities
        StudentRemark.objects.all().delete()
        StudentAchievement.objects.all().delete()
        self.stdout.write(" - Cleared student remarks and achievements.")

        # 2. Delete attendance records & audit logs
        AttendanceAuditLog.objects.all().delete()
        AttendanceRecord.objects.all().delete()
        AttendanceSession.objects.all().delete()
        self.stdout.write(" - Cleared all attendance sessions, records, and audit logs.")

        # 3. Delete examination marks & subjects
        StudentMark.objects.all().delete()
        ExamSubject.objects.all().delete()
        Examination.objects.all().delete()
        self.stdout.write(" - Cleared examination records and marks.")

        # 4. Delete student enrollments, guardians, and students
        StudentEnrollment.objects.all().delete()
        StudentGuardian.objects.all().delete()
        Guardian.objects.all().delete()
        Student.objects.all().delete()
        self.stdout.write(" - Cleared student directory and guardian profiles.")

        # 5. Delete section subject assignments, sections, classes, subjects, teachers
        SectionSubjectTeacher.objects.all().delete()
        Section.objects.all().delete()
        ClassGroup.objects.all().delete()
        Subject.objects.all().delete()
        Teacher.objects.all().delete()
        self.stdout.write(" - Cleared classes, sections, subjects, and teacher profiles.")

        # 6. Delete notifications and audit logs
        Notification.objects.all().delete()
        AuditLog.objects.all().delete()
        self.stdout.write(" - Cleared notifications and audit trails.")

        # 7. Remove non-admin users
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(" - Cleared mock teacher and staff user accounts.")

        # 8. Ensure a single pristine administrative account exists
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'System',
                'last_name': 'Administrator',
                'email': 'admin@scholaris.edu',
                'role': UserRole.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        # 9. Ensure a clean School container exists
        school, _ = School.objects.get_or_create(
            code='scholaris',
            defaults={
                'name': 'Scholaris Academy',
                'motto': 'Excellence in Mind, Character in Action',
                'address': 'Main Campus, Academic District',
                'phone': '+1 (555) 019-2834',
                'email': 'admin@scholaris.edu',
                'attendance_threshold': 75.00,
                'warning_threshold': 85.00,
                'late_penalty_weight': 0.20,
                'excused_counts_as_present': False,
            }
        )
        admin_user.school = school
        admin_user.save()

        # 10. Clean default academic year
        from datetime import date
        AcademicYear.objects.all().delete()
        AcademicYear.objects.create(
            school=school,
            name='2025-2026',
            start_date=date(2025, 8, 1),
            end_date=date(2026, 6, 30),
            is_current=True
        )

        # 11. Clean default grading scale
        GradingScale.objects.all().delete()
        GradingScale.objects.create(
            school=school,
            name='Standard 10-Point Scale',
            is_default=True,
            rules=[
                {'min': 90, 'max': 100, 'grade': 'A+', 'gpa': 4.0, 'label': 'Outstanding'},
                {'min': 80, 'max': 89.99, 'grade': 'A', 'gpa': 3.7, 'label': 'Excellent'},
                {'min': 70, 'max': 79.99, 'grade': 'B', 'gpa': 3.0, 'label': 'Good'},
                {'min': 60, 'max': 69.99, 'grade': 'C', 'gpa': 2.0, 'label': 'Average'},
                {'min': 50, 'max': 59.99, 'grade': 'D', 'gpa': 1.0, 'label': 'Below Average'},
                {'min': 0, 'max': 49.99, 'grade': 'F', 'gpa': 0.0, 'label': 'Fail'},
            ]
        )

        self.stdout.write(self.style.SUCCESS("All mock data removed. The system is clean, pristine, and ready for real data!"))
        self.stdout.write(self.style.SUCCESS("Clean Administrator Login: admin / admin123"))
