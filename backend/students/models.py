from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import School, User
from academic.models import AcademicYear, Section

class StudentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    INACTIVE = 'INACTIVE', _('Inactive')
    GRADUATED = 'GRADUATED', _('Graduated')
    SUSPENDED = 'SUSPENDED', _('Suspended')
    ARCHIVED = 'ARCHIVED', _('Archived')


class Gender(models.TextChoices):
    MALE = 'MALE', _('Male')
    FEMALE = 'FEMALE', _('Female')
    OTHER = 'OTHER', _('Other')


class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    admission_number = models.CharField(max_length=50)
    admission_date = models.DateField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE)
    blood_group = models.CharField(max_length=10, blank=True)
    photo_url = models.URLField(blank=True, default='')
    
    # Contact info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Sensitive notes (restricted to authorized staff)
    medical_notes = models.TextField(blank=True)
    previous_school = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=StudentStatus.choices, default=StudentStatus.ACTIVE)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['first_name', 'last_name']
        unique_together = ('school', 'admission_number')
        indexes = [
            models.Index(fields=['school', 'admission_number']),
            models.Index(fields=['school', 'status']),
            models.Index(fields=['first_name', 'last_name']),
        ]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.full_name} ({self.admission_number})"


class Guardian(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='guardian_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50, default='Parent')  # Father, Mother, Guardian
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.full_name} ({self.relationship})"


class StudentGuardian(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_guardians')
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='student_guardians')
    is_primary = models.BooleanField(default=True)
    can_pickup = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'guardian')

    def __str__(self):
        return f"{self.student.full_name} -> {self.guardian.full_name} ({'Primary' if self.is_primary else 'Secondary'})"


class StudentEnrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')
    roll_number = models.CharField(max_length=20)
    enrolled_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['section', 'roll_number']
        unique_together = (
            ('academic_year', 'section', 'roll_number'),
            ('student', 'academic_year'),
        )
        indexes = [
            models.Index(fields=['academic_year', 'section', 'is_active']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.section} (#{self.roll_number})"


class RemarkSeverity(models.TextChoices):
    POSITIVE = 'POSITIVE', _('Positive / Praise')
    NEUTRAL = 'NEUTRAL', _('Neutral')
    WARNING = 'WARNING', _('Needs Attention / Warning')
    CRITICAL = 'CRITICAL', _('Critical Issue')


class RemarkCategory(models.TextChoices):
    ACADEMIC = 'ACADEMIC', _('Academic Performance')
    DISCIPLINE = 'DISCIPLINE', _('Discipline & Conduct')
    ATTENDANCE = 'ATTENDANCE', _('Attendance & Punctuality')
    ACHIEVEMENT = 'ACHIEVEMENT', _('Extracurricular / Achievement')
    GENERAL = 'GENERAL', _('General')


class StudentRemark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='remarks')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='given_remarks')
    category = models.CharField(max_length=30, choices=RemarkCategory.choices, default=RemarkCategory.GENERAL)
    severity = models.CharField(max_length=20, choices=RemarkSeverity.choices, default=RemarkSeverity.NEUTRAL)
    title = models.CharField(max_length=150)
    description = models.TextField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title} for {self.student.full_name}"


class StudentAchievement(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=150)
    category = models.CharField(max_length=100, default='Academic') # Sports, Science, Arts, Leadership
    award_level = models.CharField(max_length=100, blank=True) # Inter-school, State, National, School
    description = models.TextField(blank=True)
    award_date = models.DateField()
    certificate_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-award_date']

    def __str__(self):
        return f"{self.title} - {self.student.full_name} ({self.award_date})"
