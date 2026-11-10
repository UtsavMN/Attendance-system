from rest_framework import serializers
from attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from students.models import Student
from academic.serializers import SectionSimpleSerializer

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    photo_url = serializers.CharField(source='student.photo_url', read_only=True)
    roll_number = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'photo_url',
            'roll_number', 'status', 'check_in_time', 'remarks'
        ]

    def get_roll_number(self, obj):
        enrollment = obj.student.enrollments.filter(section=obj.session.section, is_active=True).first()
        return enrollment.roll_number if enrollment else '-'


class AttendanceAuditLogSerializer(serializers.ModelSerializer):
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    student_name = serializers.CharField(source='attendance_record.student.full_name', read_only=True)
    date = serializers.DateField(source='attendance_record.session.date', read_only=True)

    class Meta:
        model = AttendanceAuditLog
        fields = [
            'id', 'attendance_record', 'student_name', 'date',
            'modified_by', 'modified_by_name', 'previous_status',
            'new_status', 'reason', 'timestamp'
        ]


class AttendanceSessionSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    taken_by_name = serializers.CharField(source='taken_by.get_full_name', read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)
    summary = serializers.SerializerMethodField()
    marked_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'section', 'section_name', 'subject', 'subject_name', 'subject_code',
            'academic_year', 'date', 'session_type', 'taken_by', 'taken_by_name', 'status',
            'notes', 'marked_at', 'marked_at_formatted', 'created_at', 'records', 'summary'
        ]

    def get_marked_at_formatted(self, obj):
        if obj.marked_at:
            return obj.marked_at.strftime('%I:%M %p, %b %d, %Y')
        return obj.created_at.strftime('%I:%M %p, %b %d, %Y')

    def get_summary(self, obj):
        records = obj.records.all()
        total = records.count()
        present = sum(1 for r in records if r.status == 'PRESENT')
        absent = sum(1 for r in records if r.status == 'ABSENT')
        late = sum(1 for r in records if r.status == 'LATE')
        excused = sum(1 for r in records if r.status == 'EXCUSED')
        pct = round((present / total) * 100, 1) if total > 0 else 0.0
        return {
            'total': total,
            'present': present,
            'absent': absent,
            'percentage': pct,
        }
