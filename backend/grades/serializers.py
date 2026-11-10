from rest_framework import serializers
from grades.models import GradingScale, Examination, ExamSubject, StudentMark
from academic.serializers import SubjectSerializer, ClassGroupSerializer

class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = ['id', 'school', 'name', 'is_default', 'rules', 'created_at', 'updated_at']
        read_only_fields = ['id', 'school', 'created_at', 'updated_at']


class ExamSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    class_name = serializers.CharField(source='class_group.name', read_only=True)
    marks_count = serializers.SerializerMethodField()

    class Meta:
        model = ExamSubject
        fields = [
            'id', 'examination', 'class_group', 'class_name',
            'subject', 'subject_name', 'subject_code',
            'max_marks', 'pass_marks', 'exam_date', 'marks_count'
        ]

    def get_marks_count(self, obj):
        return obj.student_marks.count()


class ExaminationSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    exam_subjects = ExamSubjectSerializer(many=True, read_only=True)
    subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = Examination
        fields = [
            'id', 'school', 'academic_year', 'academic_year_name',
            'name', 'term', 'start_date', 'end_date', 'is_published',
            'created_at', 'exam_subjects', 'subjects_count'
        ]
        read_only_fields = ['id', 'school', 'created_at', 'exam_subjects']

    def get_subjects_count(self, obj):
        return obj.exam_subjects.count()


class StudentMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    roll_number = serializers.SerializerMethodField()
    percentage = serializers.ReadOnlyField()
    grade = serializers.SerializerMethodField()

    class Meta:
        model = StudentMark
        fields = [
            'id', 'exam_subject', 'student', 'student_name', 'admission_number',
            'roll_number', 'marks_obtained', 'is_absent', 'remarks',
            'percentage', 'grade', 'entered_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'percentage', 'grade', 'entered_by', 'created_at', 'updated_at']

    def get_roll_number(self, obj):
        enrollment = obj.student.enrollments.filter(is_active=True).first()
        return enrollment.roll_number if enrollment else '-'

    def get_grade(self, obj):
        scale = GradingScale.objects.filter(school=obj.student.school, is_default=True).first()
        if not scale or obj.is_absent or obj.marks_obtained is None:
            return 'ABS' if obj.is_absent else 'N/A'
        return scale.get_grade_for_percentage(obj.percentage).get('grade', 'F')
