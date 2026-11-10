from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import School, User
from academic.models import AcademicYear, ClassGroup, Subject
from students.models import Student

class GradingScale(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='grading_scales')
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    # rules structure: list of {"min": 90, "max": 100, "grade": "A+", "gpa": 4.0, "label": "Outstanding"}
    rules = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return f"{self.name} ({'Default' if self.is_default else 'Custom'})"

    def get_grade_for_percentage(self, percentage):
        """Returns the grade entry for a given percentage based on rules"""
        pct = float(percentage)
        for rule in sorted(self.rules, key=lambda x: x.get('min', 0), reverse=True):
            if pct >= float(rule.get('min', 0)):
                return rule
        return {"grade": "F", "gpa": 0.0, "label": "Fail"}


class Examination(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='examinations')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='examinations')
    name = models.CharField(max_length=150) # e.g. "Term 1 Final Examination"
    term = models.CharField(max_length=50) # "Term 1", "Term 2", "Annual"
    start_date = models.DateField()
    end_date = models.DateField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"


class ExamSubject(models.Model):
    examination = models.ForeignKey(Examination, on_delete=models.CASCADE, related_name='exam_subjects')
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='exam_subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_subjects')
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    pass_marks = models.DecimalField(max_digits=5, decimal_places=2, default=40.00)
    exam_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('examination', 'class_group', 'subject')
        ordering = ['class_group', 'subject__name']

    def __str__(self):
        return f"{self.examination.name} - {self.class_group.name} - {self.subject.name} (Max {self.max_marks})"


class StudentMark(models.Model):
    exam_subject = models.ForeignKey(ExamSubject, on_delete=models.CASCADE, related_name='student_marks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_marks')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_absent = models.BooleanField(default=False)
    remarks = models.CharField(max_length=255, blank=True)
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='entered_marks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam_subject', 'student')
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['exam_subject', 'student']),
        ]

    @property
    def percentage(self):
        if self.is_absent or self.marks_obtained is None:
            return 0.0
        return round((float(self.marks_obtained) / float(self.exam_subject.max_marks)) * 100, 2)

    def __str__(self):
        status = "ABS" if self.is_absent else f"{self.marks_obtained}/{self.exam_subject.max_marks}"
        return f"{self.student.full_name} | {self.exam_subject.subject.name}: {status}"
