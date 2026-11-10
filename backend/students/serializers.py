from rest_framework import serializers
from students.models import Student, Guardian, StudentGuardian, StudentEnrollment, StudentRemark, StudentAchievement
from academic.models import AcademicYear, Section
from academic.serializers import SectionSimpleSerializer

class GuardianSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Guardian
        fields = ['id', 'first_name', 'last_name', 'full_name', 'relationship', 'phone', 'email', 'occupation', 'address']


class StudentGuardianSerializer(serializers.ModelSerializer):
    guardian = GuardianSerializer()

    class Meta:
        model = StudentGuardian
        fields = ['id', 'guardian', 'is_primary', 'can_pickup']


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='section.class_group.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'academic_year', 'academic_year_name', 'section',
            'class_name', 'section_name', 'roll_number', 'enrolled_date', 'is_active'
        ]


class StudentRemarkSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentRemark
        fields = ['id', 'student', 'author', 'author_name', 'category', 'severity', 'title', 'description', 'date', 'created_at']
        read_only_fields = ['id', 'author', 'author_name', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username if obj.author else 'Staff'


class StudentAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAchievement
        fields = ['id', 'student', 'title', 'category', 'award_level', 'description', 'award_date', 'certificate_url', 'created_at']
        read_only_fields = ['id', 'created_at']


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    current_class = serializers.SerializerMethodField()
    current_section = serializers.SerializerMethodField()
    roll_number = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()
    academic_average = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 'full_name',
            'gender', 'date_of_birth', 'photo_url', 'status',
            'current_class', 'current_section', 'roll_number',
            'attendance_percentage', 'academic_average'
        ]

    def get_current_class(self, obj):
        enrollment = getattr(obj, '_cached_active_enrollment', None)
        if enrollment is None:
            enrollment = obj.enrollments.filter(is_active=True).select_related('section__class_group').first()
        return enrollment.section.class_group.name if enrollment else '-'

    def get_current_section(self, obj):
        enrollment = getattr(obj, '_cached_active_enrollment', None)
        if enrollment is None:
            enrollment = obj.enrollments.filter(is_active=True).select_related('section').first()
        return enrollment.section.name if enrollment else '-'

    def get_roll_number(self, obj):
        enrollment = getattr(obj, '_cached_active_enrollment', None)
        if enrollment is None:
            enrollment = obj.enrollments.filter(is_active=True).first()
        return enrollment.roll_number if enrollment else '-'

    def get_attendance_percentage(self, obj):
        stats = getattr(obj, '_precomputed_attendance', None)
        if stats is not None:
            return stats
        # calculate
        records = obj.attendance_records.all()
        total = records.count()
        if total == 0:
            return 0.0
        present = records.filter(status='PRESENT').count()
        late = records.filter(status='LATE').count()
        # count present + late
        pct = round(((present + late * 0.8) / total) * 100, 1)
        return min(pct, 100.0)

    def get_academic_average(self, obj):
        avg = getattr(obj, '_precomputed_academic_avg', None)
        if avg is not None:
            return avg
        marks = obj.exam_marks.filter(is_absent=False, marks_obtained__isnull=False).select_related('exam_subject')
        if not marks.exists():
            return None
        pcts = [m.percentage for m in marks]
        return round(sum(pcts) / len(pcts), 1) if pcts else None


class StudentDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    enrollments = StudentEnrollmentSerializer(many=True, read_only=True)
    guardians = StudentGuardianSerializer(source='student_guardians', many=True, read_only=True)
    remarks = StudentRemarkSerializer(many=True, read_only=True)
    achievements = StudentAchievementSerializer(many=True, read_only=True)
    current_enrollment = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'school', 'admission_number', 'admission_date',
            'first_name', 'last_name', 'full_name', 'date_of_birth',
            'gender', 'blood_group', 'photo_url', 'email', 'phone', 'address',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'medical_notes', 'previous_school', 'status',
            'enrollments', 'guardians', 'remarks', 'achievements', 'current_enrollment',
            'created_at', 'updated_at'
        ]

    def get_current_enrollment(self, obj):
        enrollment = obj.enrollments.filter(is_active=True).first()
        return StudentEnrollmentSerializer(enrollment).data if enrollment else None


class StudentCreateUpdateSerializer(serializers.ModelSerializer):
    # Admission / Enrollment fields
    academic_year_id = serializers.IntegerField(write_only=True, required=False)
    section_id = serializers.IntegerField(write_only=True, required=False)
    roll_number = serializers.CharField(write_only=True, required=False)
    
    # Guardian fields
    guardian_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_relationship = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'admission_date',
            'first_name', 'last_name', 'full_name', 'date_of_birth',
            'gender', 'blood_group', 'photo_url', 'email', 'phone', 'address',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'medical_notes', 'previous_school', 'status',
            'academic_year_id', 'section_id', 'roll_number',
            'guardian_name', 'guardian_relationship', 'guardian_phone', 'guardian_email'
        ]

    def validate_admission_number(self, value):
        request = self.context.get('request')
        if request and hasattr(request.user, 'school') and request.user.school:
            school = request.user.school
            qs = Student.objects.filter(school=school, admission_number=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('A student with this admission number is already registered.')
        return value

    def create(self, validated_data):
        academic_year_id = validated_data.pop('academic_year_id', None)
        section_id = validated_data.pop('section_id', None)
        roll_number = validated_data.pop('roll_number', None)
        guardian_name = validated_data.pop('guardian_name', '')
        guardian_relationship = validated_data.pop('guardian_relationship', 'Parent')
        guardian_phone = validated_data.pop('guardian_phone', '')
        guardian_email = validated_data.pop('guardian_email', '')

        school = self.context['request'].user.school
        student = Student.objects.create(school=school, **validated_data)

        # Create enrollment if section provided
        if section_id:
            try:
                section_obj = Section.objects.get(id=section_id, class_group__school=school)
                if not academic_year_id:
                    curr_ay = school.academic_years.filter(is_current=True).first() or school.academic_years.first()
                    if curr_ay:
                        academic_year_id = curr_ay.id
                if academic_year_id:
                    StudentEnrollment.objects.create(
                        student=student,
                        academic_year_id=academic_year_id,
                        section=section_obj,
                        roll_number=roll_number or str(student.id),
                        is_active=True
                    )
            except Section.DoesNotExist:
                pass

        # Create guardian if provided
        if guardian_name:
            parts = guardian_name.split(' ', 1)
            fname = parts[0]
            lname = parts[1] if len(parts) > 1 else ''
            guardian = Guardian.objects.create(
                first_name=fname,
                last_name=lname,
                relationship=guardian_relationship or 'Parent',
                phone=guardian_phone or '',
                email=guardian_email or ''
            )
            StudentGuardian.objects.create(student=student, guardian=guardian, is_primary=True)

        return student

    def update(self, instance, validated_data):
        academic_year_id = validated_data.pop('academic_year_id', None)
        section_id = validated_data.pop('section_id', None)
        roll_number = validated_data.pop('roll_number', None)
        validated_data.pop('guardian_name', None)
        validated_data.pop('guardian_relationship', None)
        validated_data.pop('guardian_phone', None)
        validated_data.pop('guardian_email', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if section_id and academic_year_id:
            enrollment = instance.enrollments.filter(academic_year_id=academic_year_id, is_active=True).first()
            if enrollment:
                enrollment.section_id = section_id
                if roll_number:
                    enrollment.roll_number = roll_number
                enrollment.save()
            else:
                StudentEnrollment.objects.create(
                    student=instance,
                    academic_year_id=academic_year_id,
                    section_id=section_id,
                    roll_number=roll_number or str(instance.id),
                    is_active=True
                )
        return instance
