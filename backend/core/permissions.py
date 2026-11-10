from rest_framework import permissions
from core.models import UserRole

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_super_admin())


class IsSchoolAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_school_admin())


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_school_admin() or request.user.is_teacher_user()


class CanMarkAttendance(permissions.BasePermission):
    """
    School admins can mark for any section.
    Teachers can only mark for sections they manage as class_teacher or are explicitly assigned.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_school_admin() or request.user.is_teacher_user()))


class CanEnterMarks(permissions.BasePermission):
    """
    School admins can enter marks for any subject.
    Teachers can only enter marks for assigned exam subjects.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_school_admin() or request.user.is_teacher_user()))
