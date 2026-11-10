from rest_framework import serializers
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher, SectionSubjectTeacher
from core.models import User, UserRole
from core.serializers import UserSerializer

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'school', 'name', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['id', 'school', 'created_at']


class SectionSimpleSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.CharField(source='class_teacher.user.get_full_name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'class_group', 'name', 'room_number', 'class_teacher', 'class_teacher_name', 'student_count']

    def get_student_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'school', 'name', 'code', 'is_elective', 'credit_hours', 'description']
        read_only_fields = ['id', 'school']


class ClassGroupSerializer(serializers.ModelSerializer):
    sections = SectionSimpleSerializer(many=True, read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)
    subject_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Subject.objects.all(), write_only=True, required=False, source='subjects'
    )
    total_students = serializers.SerializerMethodField()
    subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassGroup
        fields = ['id', 'school', 'name', 'code', 'order_index', 'sections', 'subjects', 'subject_ids', 'total_students', 'subjects_count']
        read_only_fields = ['id', 'school']

    def get_total_students(self, obj):
        return sum(s.enrollments.filter(is_active=True).count() for s in obj.sections.all())

    def get_subjects_count(self, obj):
        return obj.subjects.count()


class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)
    assigned_sections_count = serializers.SerializerMethodField()

    # Writable fields for direct creation
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    staff_email = serializers.EmailField(write_only=True, required=False)
    staff_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, default='teacher123')

    class Meta:
        model = Teacher
        fields = [
            'id', 'school', 'user', 'employee_id', 'designation',
            'department', 'qualification', 'joining_date', 'is_active',
            'name', 'email', 'phone', 'assigned_sections_count',
            'first_name', 'last_name', 'staff_email', 'staff_phone', 'password'
        ]
        read_only_fields = ['id', 'name', 'email', 'phone', 'assigned_sections_count', 'school']

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_assigned_sections_count(self, obj):
        return obj.managed_sections.count()

    def create(self, validated_data):
        fname = validated_data.pop('first_name', 'Teacher')
        lname = validated_data.pop('last_name', validated_data.get('employee_id', 'Staff'))
        email = validated_data.pop('staff_email', f"{fname.lower()}.{lname.lower()}@scholaris.edu")
        phone = validated_data.pop('staff_phone', '')
        password = validated_data.pop('password', 'teacher123')
        school = self.context['request'].user.school

        username = f"teacher.{fname.lower()}_{validated_data.get('employee_id', '')}".replace(' ', '').lower()
        # Avoid duplicate usernames
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=fname,
            last_name=lname,
            role=UserRole.TEACHER,
            school=school,
            phone_number=phone
        )
        teacher = Teacher.objects.create(school=school, user=user, **validated_data)
        return teacher


class SectionSubjectTeacherSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    class_name = serializers.CharField(source='section.class_group.name', read_only=True)

    class Meta:
        model = SectionSubjectTeacher
        fields = [
            'id', 'academic_year', 'section', 'subject', 'teacher',
            'subject_name', 'teacher_name', 'section_name', 'class_name'
        ]
        read_only_fields = ['id', 'subject_name', 'teacher_name', 'section_name', 'class_name']
