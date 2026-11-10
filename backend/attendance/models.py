from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User
from academic.models import AcademicYear, Section
from students.models import Student

class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', _('Present')
    ABSENT = 'ABSENT', _('Absent')
    LATE = 'LATE', _('Late')
    EXCUSED = 'EXCUSED', _('Excused')


class AttendanceSessionType(models.TextChoices):
    FULL_DAY = 'FULL_DAY', _('Full Day')
    MORNING = 'MORNING', _('Morning Session')
    AFTERNOON = 'AFTERNOON', _('Afternoon Session')


class AttendanceSessionStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Draft')
    SUBMITTED = 'SUBMITTED', _('Submitted')
    LOCKED = 'LOCKED', _('Locked')


class AttendanceSession(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='attendance_sessions')
    subject = models.ForeignKey('academic.Subject', on_delete=models.CASCADE, null=True, blank=True, related_name='attendance_sessions')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='attendance_sessions')
    date = models.DateField()
    session_type = models.CharField(
        max_length=20,
        choices=AttendanceSessionType.choices,
        default=AttendanceSessionType.FULL_DAY
    )
    taken_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='submitted_attendance_sessions')
    status = models.CharField(
        max_length=20,
        choices=AttendanceSessionStatus.choices,
        default=AttendanceSessionStatus.SUBMITTED
    )
    notes = models.TextField(blank=True)
    marked_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-marked_at', 'section']
        unique_together = ('section', 'subject', 'date', 'session_type')
        indexes = [
            models.Index(fields=['date', 'section']),
            models.Index(fields=['academic_year', 'date']),
        ]

    def __str__(self):
        subj_str = f" - {self.subject.name}" if self.subject else ""
        return f"{self.section}{subj_str} on {self.date} ({self.get_session_type_display()})"


class AttendanceRecord(models.Model):
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT
    )
    check_in_time = models.TimeField(null=True, blank=True)
    remarks = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('session', 'student')
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['session', 'status']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.session.date}: {self.get_status_display()}"


class AttendanceAuditLog(models.Model):
    attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='audit_history')
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='attendance_modifications')
    previous_status = models.CharField(max_length=20, choices=AttendanceStatus.choices)
    new_status = models.CharField(max_length=20, choices=AttendanceStatus.choices)
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Record #{self.attendance_record_id}: {self.previous_status} -> {self.new_status} by {self.modified_by}"
