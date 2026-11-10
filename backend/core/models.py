from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class School(models.Model):
    name = models.CharField(max_length=255)
    code = models.SlugField(max_length=50, unique=True)
    motto = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    
    # Business logic configurations
    attendance_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=75.00,
        help_text=_("Minimum acceptable attendance percentage (e.g., 75.00)")
    )
    warning_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=85.00,
        help_text=_("Threshold below which a warning is issued (e.g., 85.00)")
    )
    late_penalty_weight = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.00,
        help_text=_("Fraction of an absence a late arrival incurs (0.0 = no absence penalty)")
    )
    excused_counts_as_present = models.BooleanField(
        default=False,
        help_text=_("If True, excused absences are counted towards present sessions")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', _('Super Administrator')
    SCHOOL_ADMIN = 'SCHOOL_ADMIN', _('School Administrator')
    TEACHER = 'TEACHER', _('Teacher')
    PARENT = 'PARENT', _('Parent / Guardian')


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.SCHOOL_ADMIN
    )
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users'
    )
    phone_number = models.CharField(max_length=30, blank=True)
    avatar_url = models.URLField(blank=True)

    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN or self.is_superuser

    def is_school_admin(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] or self.is_staff

    def is_teacher_user(self):
        return self.role == UserRole.TEACHER

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class AuditLog(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['school', '-timestamp']),
            models.Index(fields=['target_model', 'target_id']),
        ]

    def __str__(self):
        actor = self.user.username if self.user else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {actor} - {self.action} on {self.target_model} #{self.target_id}"


class NotificationCategory(models.TextChoices):
    ATTENDANCE_ALERT = 'ATTENDANCE_ALERT', _('Attendance Alert')
    ACADEMIC_ALERT = 'ACADEMIC_ALERT', _('Academic Performance Alert')
    EXAM_RESULT = 'EXAM_RESULT', _('Examination Results')
    ANNOUNCEMENT = 'ANNOUNCEMENT', _('School Announcement')


class Notification(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(
        max_length=30,
        choices=NotificationCategory.choices,
        default=NotificationCategory.ANNOUNCEMENT
    )
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"
