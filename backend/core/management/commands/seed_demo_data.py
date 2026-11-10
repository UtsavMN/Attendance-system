from django.core.management.base import BaseCommand
from datetime import date, timedelta, time, datetime
import random
from core.models import School, User, UserRole, Notification, NotificationCategory, AuditLog
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher, SectionSubjectTeacher
from students.models import Student, Guardian, StudentGuardian, StudentEnrollment, StudentRemark, StudentAchievement, StudentStatus, Gender, RemarkCategory, RemarkSeverity
from attendance.models import AttendanceSession, AttendanceRecord, AttendanceStatus, AttendanceSessionType, AttendanceSessionStatus
from grades.models import GradingScale, Examination, ExamSubject, StudentMark

class Command(BaseCommand):
    help = 'Seeds realistic, comprehensive demonstration data for Scholaris'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Clearing and populating demonstration database..."))

        # 1. School
        school, _ = School.objects.get_or_create(
            code='oakridge',
            defaults={
                'name': 'Oakridge Collegiate Academy',
                'motto': 'Excellence in Mind, Character in Action',
                'address': '742 Evergreen Terrace, Academic District, Springfield',
                'phone': '+1 (555) 382-9901',
                'email': 'admissions@oakridge.edu',
                'website': 'https://scholaris.oakridge.edu',
                'logo_url': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
                'attendance_threshold': 75.00,
                'warning_threshold': 85.00,
                'late_penalty_weight': 0.20,
                'excused_counts_as_present': False,
            }
        )

        # 2. Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Eleanor',
                'last_name': 'Sterling',
                'email': 'admin@scholaris.edu',
                'role': UserRole.SUPER_ADMIN,
                'school': school,
                'phone_number': '+1 (555) 100-0001',
                'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.school = school
        admin_user.save()

        principal_user, _ = User.objects.get_or_create(
            username='principal',
            defaults={
                'first_name': 'Arthur',
                'last_name': 'Vance',
                'email': 'principal@scholaris.edu',
                'role': UserRole.SCHOOL_ADMIN,
                'school': school,
                'phone_number': '+1 (555) 100-0002',
                'avatar_url': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
                'is_staff': True
            }
        )
        principal_user.set_password('admin123')
        principal_user.save()

        # Teachers
        teachers_data = [
            ('teacher.smith', 'Sarah', 'Smith', 'MATH-01', 'Head of Mathematics', 'Mathematics', 'M.Sc. Applied Mathematics, Oxford', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'),
            ('teacher.jones', 'David', 'Jones', 'SCI-02', 'Senior Science Instructor', 'Natural Sciences', 'Ph.D. Physics, MIT', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
            ('teacher.wong', 'Elena', 'Wong', 'ENG-03', 'Senior English Faculty', 'Humanities', 'M.A. Comparative Literature, Columbia', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
            ('teacher.miller', 'Robert', 'Miller', 'CS-04', 'Lead Informatics Lecturer', 'Computer Science', 'M.S. Computer Science, Stanford', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
        ]

        teacher_objs = []
        for uname, fname, lname, empid, desig, dept, qual, avatar in teachers_data:
            t_user, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'email': f"{uname}@scholaris.edu",
                    'role': UserRole.TEACHER,
                    'school': school,
                    'avatar_url': avatar,
                    'phone_number': f"+1 (555) 200-{random.randint(1000, 9999)}"
                }
            )
            t_user.set_password('teacher123')
            t_user.save()

            t_profile, _ = Teacher.objects.get_or_create(
                school=school,
                user=t_user,
                defaults={
                    'employee_id': empid,
                    'designation': desig,
                    'department': dept,
                    'qualification': qual,
                    'joining_date': date(2021, 8, 15),
                }
            )
            teacher_objs.append(t_profile)

        # 3. Academic Years
        curr_ay, _ = AcademicYear.objects.get_or_create(
            school=school,
            name='2025-2026',
            defaults={
                'start_date': date(2025, 8, 1),
                'end_date': date(2026, 6, 30),
                'is_current': True
            }
        )
        past_ay, _ = AcademicYear.objects.get_or_create(
            school=school,
            name='2024-2025',
            defaults={
                'start_date': date(2024, 8, 1),
                'end_date': date(2025, 6, 30),
                'is_current': False
            }
        )

        # 4. Classes and Sections
        classes_data = [
            ('Grade 9', 'G9', 1),
            ('Grade 10', 'G10', 2),
            ('Grade 11', 'G11', 3),
            ('Grade 12', 'G12', 4),
        ]
        class_map = {}
        for cname, code, order in classes_data:
            cg, _ = ClassGroup.objects.get_or_create(
                school=school,
                code=code,
                defaults={'name': cname, 'order_index': order}
            )
            class_map[code] = cg

        # Sections
        sec_10a, _ = Section.objects.get_or_create(
            class_group=class_map['G10'],
            name='A',
            defaults={'room_number': 'Lab 201', 'class_teacher': teacher_objs[0]}
        )
        sec_10b, _ = Section.objects.get_or_create(
            class_group=class_map['G10'],
            name='B',
            defaults={'room_number': 'Room 202', 'class_teacher': teacher_objs[1]}
        )
        sec_9a, _ = Section.objects.get_or_create(
            class_group=class_map['G9'],
            name='A',
            defaults={'room_number': 'Room 105', 'class_teacher': teacher_objs[2]}
        )
        sec_11a, _ = Section.objects.get_or_create(
            class_group=class_map['G11'],
            name='A',
            defaults={'room_number': 'Auditorium Hall', 'class_teacher': teacher_objs[3]}
        )

        # 5. Subjects
        subjects_data = [
            ('Mathematics', 'MATH-10', False, 4.0),
            ('Physics', 'PHYS-10', False, 3.5),
            ('Chemistry', 'CHEM-10', False, 3.5),
            ('English Literature', 'ENG-10', False, 3.0),
            ('Computer Science', 'CS-10', True, 3.0),
            ('World History', 'HIST-10', False, 2.5),
        ]
        subject_objs = []
        for sname, scode, is_el, cred in subjects_data:
            sbj, _ = Subject.objects.get_or_create(
                school=school,
                code=scode,
                defaults={'name': sname, 'is_elective': is_el, 'credit_hours': cred}
            )
            subject_objs.append(sbj)

        # Assign Teachers to Section-Subjects
        for idx, sbj in enumerate(subject_objs):
            t_assigned = teacher_objs[idx % len(teacher_objs)]
            SectionSubjectTeacher.objects.get_or_create(
                academic_year=curr_ay,
                section=sec_10a,
                subject=sbj,
                defaults={'teacher': t_assigned}
            )
            SectionSubjectTeacher.objects.get_or_create(
                academic_year=curr_ay,
                section=sec_10b,
                subject=sbj,
                defaults={'teacher': t_assigned}
            )

        # 6. Grading Scale
        grading_scale, _ = GradingScale.objects.get_or_create(
            school=school,
            name='Standard 10-Point Scale',
            defaults={
                'is_default': True,
                'rules': [
                    {'min': 90, 'max': 100, 'grade': 'A+', 'gpa': 4.0, 'label': 'Outstanding'},
                    {'min': 80, 'max': 89.99, 'grade': 'A', 'gpa': 3.7, 'label': 'Excellent'},
                    {'min': 70, 'max': 79.99, 'grade': 'B', 'gpa': 3.0, 'label': 'Good'},
                    {'min': 60, 'max': 69.99, 'grade': 'C', 'gpa': 2.0, 'label': 'Average'},
                    {'min': 50, 'max': 59.99, 'grade': 'D', 'gpa': 1.0, 'label': 'Below Average'},
                    {'min': 0, 'max': 49.99, 'grade': 'F', 'gpa': 0.0, 'label': 'Fail'},
                ]
            }
        )

        # 7. Examinations
        exam_midterm, _ = Examination.objects.get_or_create(
            school=school,
            academic_year=curr_ay,
            name='Mid-Term Examination 2025',
            defaults={
                'term': 'Term 1',
                'start_date': date(2025, 10, 15),
                'end_date': date(2025, 10, 26),
                'is_published': True
            }
        )
        exam_final, _ = Examination.objects.get_or_create(
            school=school,
            academic_year=curr_ay,
            name='First Semester Finals',
            defaults={
                'term': 'Term 2',
                'start_date': date(2025, 12, 10),
                'end_date': date(2025, 12, 22),
                'is_published': True
            }
        )
        exam_unit3, _ = Examination.objects.get_or_create(
            school=school,
            academic_year=curr_ay,
            name='Unit Assessment 3',
            defaults={
                'term': 'Term 3',
                'start_date': date(2026, 2, 15),
                'end_date': date(2026, 2, 20),
                'is_published': False
            }
        )

        # Create Exam Subjects for Grade 10
        exam_subj_objs = []
        for ex in [exam_midterm, exam_final, exam_unit3]:
            for sbj in subject_objs:
                es, _ = ExamSubject.objects.get_or_create(
                    examination=ex,
                    class_group=class_map['G10'],
                    subject=sbj,
                    defaults={'max_marks': 100.00, 'pass_marks': 40.00}
                )
                exam_subj_objs.append(es)

        # 8. Realistic Students Catalog
        raw_students = [
            ('ADM-2025-001', 'Alexander', 'Wright', Gender.MALE, '2009-04-12', 'A+', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', sec_10a, '101', 97.5, 92.4),
            ('ADM-2025-002', 'Sophia', 'Chen', Gender.FEMALE, '2009-08-23', 'O+', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', sec_10a, '102', 96.0, 95.8),
            ('ADM-2025-003', 'Liam', 'Patel', Gender.MALE, '2009-02-17', 'B+', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', sec_10a, '103', 88.0, 78.5),
            ('ADM-2025-004', 'Emma', 'Davis', Gender.FEMALE, '2009-11-05', 'AB+', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', sec_10a, '104', 94.0, 84.2),
            ('ADM-2025-005', 'Marcus', 'Johnson', Gender.MALE, '2009-06-30', 'O-', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', sec_10a, '105', 91.5, 76.0),
            ('ADM-2025-006', 'Olivia', 'Taylor', Gender.FEMALE, '2009-09-14', 'A-', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', sec_10a, '106', 95.2, 89.0),
            ('ADM-2025-007', 'Leo', 'Hayes', Gender.MALE, '2009-01-20', 'B-', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', sec_10a, '107', 68.0, 48.0), # AT-RISK
            ('ADM-2025-008', 'Maya', 'Nakamura', Gender.FEMALE, '2009-07-08', 'O+', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', sec_10a, '108', 71.5, 82.0), # AT-RISK ATTENDANCE
            ('ADM-2025-009', 'Noah', 'Kim', Gender.MALE, '2009-03-29', 'A+', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', sec_10a, '109', 93.0, 87.5),
            ('ADM-2025-010', 'Ava', 'Martinez', Gender.FEMALE, '2009-10-18', 'B+', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', sec_10a, '110', 98.0, 93.1),
            
            # Section 10B
            ('ADM-2025-011', 'Ethan', 'Brown', Gender.MALE, '2009-05-15', 'O+', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', sec_10b, '201', 92.0, 81.0),
            ('ADM-2025-012', 'Isabella', 'Garcia', Gender.FEMALE, '2009-12-04', 'A+', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', sec_10b, '202', 89.5, 85.5),
            ('ADM-2025-013', 'Lucas', 'Wilson', Gender.MALE, '2009-08-11', 'B-', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', sec_10b, '203', 74.0, 52.0), # AT-RISK ATTENDANCE
            ('ADM-2025-014', 'Mia', 'Anderson', Gender.FEMALE, '2009-04-25', 'AB-', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', sec_10b, '204', 96.5, 91.0),
            ('ADM-2025-015', 'James', 'Thomas', Gender.MALE, '2009-09-09', 'O-', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', sec_10b, '205', 86.0, 73.5),
            ('ADM-2025-016', 'Charlotte', 'Jackson', Gender.FEMALE, '2009-03-14', 'A-', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', sec_10b, '206', 94.0, 88.0),
            ('ADM-2025-017', 'Benjamin', 'White', Gender.MALE, '2009-11-22', 'B+', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', sec_10b, '207', 91.0, 79.0),
            ('ADM-2025-018', 'Amelia', 'Harris', Gender.FEMALE, '2009-06-19', 'O+', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', sec_10b, '208', 97.0, 94.5),
            ('ADM-2025-019', 'Henry', 'Martin', Gender.MALE, '2009-02-03', 'A+', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', sec_10b, '209', 84.0, 68.0),
            ('ADM-2025-020', 'Harper', 'Clark', Gender.FEMALE, '2009-10-27', 'AB+', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', sec_10b, '210', 95.0, 86.0),

            # Grade 9A
            ('ADM-2025-021', 'Daniel', 'Rodriguez', Gender.MALE, '2010-01-14', 'O+', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', sec_9a, '01', 93.0, 83.0),
            ('ADM-2025-022', 'Evelyn', 'Lewis', Gender.FEMALE, '2010-05-19', 'A+', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', sec_9a, '02', 96.0, 90.0),
            ('ADM-2025-023', 'Logan', 'Lee', Gender.MALE, '2010-09-02', 'B+', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', sec_9a, '03', 90.0, 77.0),
            ('ADM-2025-024', 'Abigail', 'Walker', Gender.FEMALE, '2010-03-31', 'O-', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', sec_9a, '04', 98.0, 96.0),
        ]

        created_students = []
        for adm, fname, lname, gndr, dob, bld, pht, sec, roll, target_att, target_acad in raw_students:
            dob_date = datetime.strptime(dob, '%Y-%m-%d').date()
            st, _ = Student.objects.get_or_create(
                school=school,
                admission_number=adm,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'gender': gndr,
                    'date_of_birth': dob_date,
                    'admission_date': date(2025, 8, 10),
                    'blood_group': bld,
                    'photo_url': pht,
                    'email': f"{fname.lower()}.{lname.lower()}@student.oakridge.edu",
                    'phone': f"+1 (555) 700-{random.randint(1000, 9999)}",
                    'address': f"{random.randint(10, 999)} Maple Crescent, Springfield",
                    'emergency_contact_name': f"David {lname}",
                    'emergency_contact_phone': f"+1 (555) 800-{random.randint(1000, 9999)}",
                    'emergency_contact_relation': 'Father',
                    'medical_notes': 'Asthma inhaler required for vigorous sports' if 'Hayes' in lname else 'No known allergies',
                    'status': StudentStatus.ACTIVE
                }
            )

            # Enrollment
            StudentEnrollment.objects.get_or_create(
                student=st,
                academic_year=curr_ay,
                defaults={
                    'section': sec,
                    'roll_number': roll,
                    'is_active': True
                }
            )

            # Guardian
            guard, _ = Guardian.objects.get_or_create(
                first_name=f"Robert",
                last_name=lname,
                defaults={
                    'relationship': 'Father',
                    'phone': f"+1 (555) 900-{random.randint(1000, 9999)}",
                    'email': f"parent.{lname.lower()}@gmail.com",
                    'occupation': 'Corporate Director' if 'Wright' in lname else 'Physician',
                    'address': st.address
                }
            )
            StudentGuardian.objects.get_or_create(student=st, guardian=guard, defaults={'is_primary': True, 'can_pickup': True})

            created_students.append((st, sec, target_att, target_acad))

        # 9. Attendance History Generation (Past 40 school days)
        today = date.today()
        calendar_days = []
        cur_d = today - timedelta(days=60)
        while cur_d <= today:
            # Monday to Friday
            if cur_d.weekday() < 5:
                calendar_days.append(cur_d)
            cur_d += timedelta(days=1)

        # Seed attendance sessions for Section 10A and 10B
        for sec in [sec_10a, sec_10b]:
            enrolled = [item for item in created_students if item[1] == sec]
            for day in calendar_days:
                sess, _ = AttendanceSession.objects.get_or_create(
                    section=sec,
                    academic_year=curr_ay,
                    date=day,
                    session_type=AttendanceSessionType.FULL_DAY,
                    defaults={
                        'taken_by': sec.class_teacher.user if sec.class_teacher else admin_user,
                        'status': AttendanceSessionStatus.SUBMITTED
                    }
                )

                records = []
                for st, _, target_att, _ in enrolled:
                    # Decide status based on target attendance percentage
                    rand_val = random.uniform(0, 100)
                    if rand_val < target_att:
                        status_val = AttendanceStatus.PRESENT
                        check_in = time(8, random.randint(10, 28))
                        rem = ''
                    elif rand_val < (target_att + 5):
                        status_val = AttendanceStatus.LATE
                        check_in = time(8, random.randint(35, 55))
                        rem = 'Arrived 20 mins late after morning bell'
                    elif rand_val < (target_att + 7):
                        status_val = AttendanceStatus.EXCUSED
                        check_in = None
                        rem = 'Medical leave documented'
                    else:
                        status_val = AttendanceStatus.ABSENT
                        check_in = None
                        rem = 'Unexcused absence'

                    records.append(AttendanceRecord(
                        session=sess,
                        student=st,
                        status=status_val,
                        check_in_time=check_in,
                        remarks=rem
                    ))

                # Bulk insert or update
                existing_ids = set(sess.records.values_list('student_id', flat=True))
                new_records = [r for r in records if r.student_id not in existing_ids]
                if new_records:
                    AttendanceRecord.objects.bulk_create(new_records)

        # 10. Marks & Exam Results Generation
        for ex in [exam_midterm, exam_final]:
            for es in exam_subj_objs:
                if es.examination == ex:
                    for st, sec, _, target_acad in created_students:
                        if sec.class_group == es.class_group:
                            # Generate mark centered around target_acad with variance per subject
                            base = target_acad + random.uniform(-6, 6)
                            final_mark = max(25.0, min(99.0, round(base, 1)))
                            is_abs = (st.admission_number == 'ADM-2025-007' and es.subject.name == 'Physics')
                            StudentMark.objects.get_or_create(
                                exam_subject=es,
                                student=st,
                                defaults={
                                    'marks_obtained': final_mark if not is_abs else None,
                                    'is_absent': is_abs,
                                    'remarks': 'Exceptional problem-solving' if final_mark >= 90 else ('Consistent effort required' if final_mark < 50 else 'Good understanding'),
                                    'entered_by': teachers_data[0][0] and admin_user
                                }
                            )

        # 11. Student Remarks & Achievements
        for st, _, target_att, target_acad in created_students:
            if target_acad >= 90:
                StudentRemark.objects.get_or_create(
                    student=st,
                    title='Academic Distinction',
                    defaults={
                        'author': teacher_objs[0].user,
                        'category': RemarkCategory.ACADEMIC,
                        'severity': RemarkSeverity.POSITIVE,
                        'description': f"{st.first_name} demonstrated exceptional intellectual rigor in honors coursework and spearheaded peer tutoring.",
                        'date': date(2025, 11, 20)
                    }
                )
                StudentAchievement.objects.get_or_create(
                    student=st,
                    title='State Mathematics Olympiad — Gold Medalist',
                    defaults={
                        'category': 'Academics',
                        'award_level': 'State',
                        'description': 'Awarded top honors in the Senior Regional Mathematics Olympiad.',
                        'award_date': date(2025, 12, 5)
                    }
                )
            elif target_att < 75:
                StudentRemark.objects.get_or_create(
                    student=st,
                    title='Attendance Warning: Habitual Truancy',
                    defaults={
                        'author': teacher_objs[1].user,
                        'category': RemarkCategory.ATTENDANCE,
                        'severity': RemarkSeverity.WARNING,
                        'description': f"Student has missed {random.randint(8, 14)} instructional sessions this term. Parent conference requested.",
                        'date': date(2025, 12, 1)
                    }
                )

        # 12. Notifications & Initial Audit Log
        Notification.objects.get_or_create(
            school=school,
            recipient=admin_user,
            title="Attendance Warning: Low Threshold Alert",
            defaults={
                'message': "Students Leo Hayes and Maya Nakamura have fallen below the mandatory 75% attendance threshold.",
                'category': NotificationCategory.ATTENDANCE_ALERT,
                'link': '/students'
            }
        )
        Notification.objects.get_or_create(
            school=school,
            recipient=admin_user,
            title="Results Published: First Semester Finals",
            defaults={
                'message': "Official grade rosters for Grade 10 First Semester Finals have been signed off and published.",
                'category': NotificationCategory.EXAM_RESULT,
                'link': '/academics'
            }
        )

        AuditLog.objects.create(
            school=school,
            user=admin_user,
            action='SYSTEM_DATABASE_INITIALIZED',
            target_model='System',
            target_id='INIT-01',
            details={'message': 'Realistic synthetic school records, attendance sessions, and grades generated successfully.'}
        )

        self.stdout.write(self.style.SUCCESS("Demo database successfully populated with realistic school records!"))
