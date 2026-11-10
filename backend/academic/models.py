from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import School, User

class AcademicYear(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(max_length=50, help_text=_("e.g. 2025-2026"))
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ('school', 'name')

    def __str__(self):
        return f"{self.name} ({self.school.code})"

    def save(self, *args, **kwargs):
        if self.is_current:
            # Ensure only one academic year is current per school
            AcademicYear.objects.filter(school=self.school, is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class ClassGroup(models.Model):
    """Represents a Grade / Class (e.g., Grade 10, Class 8)"""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30)
    order_index = models.PositiveIntegerField(default=1)
    subjects = models.ManyToManyField('Subject', blank=True, related_name='classes')

    class Meta:
        ordering = ['order_index', 'name']
        unique_together = ('school', 'code')

    def __str__(self):
        return f"{self.name}"


class Teacher(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50)
    designation = models.CharField(max_length=100, default='Instructor')
    department = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=150, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        unique_together = ('school', 'employee_id')

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.employee_id})"


class Section(models.Model):
    """Represents a section under a Class (e.g., Grade 10 - Section A)"""
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=50)  # e.g., 'A', 'B'
    room_number = models.CharField(max_length=50, blank=True)
    class_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_sections')

    class Meta:
        ordering = ['class_group__order_index', 'name']
        unique_together = ('class_group', 'name')

    def __str__(self):
        return f"{self.class_group.name} - Section {self.name}"


class Subject(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    is_elective = models.BooleanField(default=False)
    credit_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        unique_together = ('school', 'code')

    def __str__(self):
        return f"{self.name} ({self.code})"


class SectionSubjectTeacher(models.Model):
    """Maps a Teacher to a Subject in a specific Section for an Academic Year"""
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='subject_assignments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assigned_subjects')

    class Meta:
        unique_together = ('academic_year', 'section', 'subject')

    def __str__(self):
        return f"{self.section} | {self.subject.name} -> {self.teacher}"
