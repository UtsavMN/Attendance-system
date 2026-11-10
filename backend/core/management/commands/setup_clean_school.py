from django.core.management.base import BaseCommand
from datetime import date
from core.models import School, User, UserRole
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher
from students.models import Student, Guardian, StudentGuardian, StudentEnrollment
from attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from grades.models import GradingScale, Examination, ExamSubject, StudentMark

class Command(BaseCommand):
    help = 'Cleans out all mock attendance and dummy logs, configuring clean classes, subjects, and student roster'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Setting up clean institutional structure for Scholaris..."))

        # 1. Canonical School
        school, _ = School.objects.get_or_create(
            code='scholaris',
            defaults={
                'name': 'Scholaris Academy',
                'motto': 'Excellence in Mind, Character in Action',
                'address': '100 Academic Boulevard, Metro District',
                'phone': '+1 (555) 382-9901',
                'email': 'admissions@scholaris.edu',
                'website': 'https://scholaris.edu',
                'attendance_threshold': 75.00,
                'warning_threshold': 85.00,
            }
        )
        # Ensure code & name
        school.code = 'scholaris'
        school.name = 'Scholaris Academy'
        school.save()

        # Delete any other schools to prevent multi-tenant confusion
        School.objects.exclude(id=school.id).delete()

        # 2. Admin User
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Eleanor',
                'last_name': 'Sterling',
                'email': 'admin@scholaris.edu',
                'role': UserRole.SUPER_ADMIN,
                'school': school,
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.school = school
        admin_user.save()

        # Clear existing attendance sessions, examinations, and student marks to remove all mock data
        AttendanceAuditLog.objects.filter(attendance_record__session__section__class_group__school=school).delete()
        AttendanceRecord.objects.filter(session__section__class_group__school=school).delete()
        AttendanceSession.objects.filter(section__class_group__school=school).delete()
        StudentMark.objects.filter(exam_subject__examination__school=school).delete()
        ExamSubject.objects.filter(examination__school=school).delete()
        Examination.objects.filter(school=school).delete()

        # 3. Academic Year
        ay, _ = AcademicYear.objects.get_or_create(
            school=school,
            name='2025-2026',
            defaults={
                'start_date': date(2025, 9, 1),
                'end_date': date(2026, 6, 30),
                'is_current': True
            }
        )
        ay.is_current = True
        ay.save()

        # 4. Grading Scale
        GradingScale.objects.get_or_create(
            school=school,
            name='Standard Academic Scale',
            defaults={
                'is_default': True,
                'rules': [
                    {'min': 90, 'max': 100, 'grade': 'A+', 'gpa': 4.0, 'label': 'Outstanding'},
                    {'min': 80, 'max': 89.99, 'grade': 'A', 'gpa': 3.7, 'label': 'Excellent'},
                    {'min': 70, 'max': 79.99, 'grade': 'B', 'gpa': 3.0, 'label': 'Very Good'},
                    {'min': 60, 'max': 69.99, 'grade': 'C', 'gpa': 2.0, 'label': 'Satisfactory'},
                    {'min': 50, 'max': 59.99, 'grade': 'D', 'gpa': 1.0, 'label': 'Pass'},
                    {'min': 0, 'max': 49.99, 'grade': 'F', 'gpa': 0.0, 'label': 'Needs Improvement'},
                ]
            }
        )

        # 5. Core Subjects
        math, _ = Subject.objects.get_or_create(school=school, code='MATH-101', defaults={'name': 'Mathematics', 'credit_hours': 4.0})
        sci, _ = Subject.objects.get_or_create(school=school, code='SCI-101', defaults={'name': 'Science', 'credit_hours': 4.0})
        eng, _ = Subject.objects.get_or_create(school=school, code='ENG-101', defaults={'name': 'English Literature', 'credit_hours': 3.0})
        soc, _ = Subject.objects.get_or_create(school=school, code='SOC-101', defaults={'name': 'Social Studies', 'credit_hours': 3.0})
        core_subjects = [math, sci, eng, soc]

        # 6. Classes and Sections
        g9, _ = ClassGroup.objects.get_or_create(school=school, code='G9', defaults={'name': 'Grade 9', 'order_index': 1})
        g9.subjects.set(core_subjects)
        g9_sec_a, _ = Section.objects.get_or_create(class_group=g9, name='A', defaults={'room_number': 'Room 101'})

        g10, _ = ClassGroup.objects.get_or_create(school=school, code='G10', defaults={'name': 'Grade 10', 'order_index': 2})
        g10.subjects.set(core_subjects)
        g10_sec_a, _ = Section.objects.get_or_create(class_group=g10, name='A', defaults={'room_number': 'Room 201'})

        # Clean out any leftover classes
        ClassGroup.objects.filter(school=school).exclude(id__in=[g9.id, g10.id]).delete()

        # 7. Students (Clean authentic roster, no mock junk)
        StudentEnrollment.objects.filter(section__class_group__school=school).delete()
        Student.objects.filter(school=school).delete()

        g9_names = [
            ("Liam", "Smith", "MALE", "101"),
            ("Emma", "Johnson", "FEMALE", "102"),
            ("Noah", "Williams", "MALE", "103"),
            ("Olivia", "Brown", "FEMALE", "104"),
            ("James", "Jones", "MALE", "105"),
            ("Sophia", "Garcia", "FEMALE", "106"),
            ("Benjamin", "Miller", "MALE", "107"),
            ("Isabella", "Davis", "FEMALE", "108"),
        ]

        g10_names = [
            ("Lucas", "Rodriguez", "MALE", "201"),
            ("Mia", "Martinez", "FEMALE", "202"),
            ("Henry", "Hernandez", "MALE", "203"),
            ("Ava", "Lopez", "FEMALE", "204"),
            ("Alexander", "Gonzalez", "MALE", "205"),
            ("Charlotte", "Wilson", "FEMALE", "206"),
            ("Ethan", "Anderson", "MALE", "207"),
            ("Amelia", "Thomas", "FEMALE", "208"),
        ]

        adm_num = 1001
        for fname, lname, gender, roll in g9_names:
            st = Student.objects.create(
                school=school,
                admission_number=f"ADM-2025-{adm_num}",
                admission_date=date(2025, 9, 1),
                first_name=fname,
                last_name=lname,
                date_of_birth=date(2010, 4, 15),
                gender=gender,
                blood_group='O+',
                status='ACTIVE'
            )
            StudentEnrollment.objects.create(
                student=st,
                academic_year=ay,
                section=g9_sec_a,
                roll_number=roll,
                is_active=True
            )
            adm_num += 1

        for fname, lname, gender, roll in g10_names:
            st = Student.objects.create(
                school=school,
                admission_number=f"ADM-2025-{adm_num}",
                admission_date=date(2025, 9, 1),
                first_name=fname,
                last_name=lname,
                date_of_birth=date(2009, 3, 22),
                gender=gender,
                blood_group='A+',
                status='ACTIVE'
            )
            StudentEnrollment.objects.create(
                student=st,
                academic_year=ay,
                section=g10_sec_a,
                roll_number=roll,
                is_active=True
            )
            adm_num += 1

        self.stdout.write(self.style.SUCCESS(
            f"Clean institutional data setup complete!\n"
            f" - Classes: Grade 9, Grade 10 (each linked to 4 Core Subjects: Math, Science, English, Social Studies)\n"
            f" - Sections: Grade 9-A (8 students), Grade 10-A (8 students)\n"
            f" - Mock attendance records: 0 (completely fresh)\n"
            f" - Ready to mark subject-wise attendance!"
        ))
