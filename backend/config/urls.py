"""
URL configuration for Scholaris API project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Core views
from core.views import (
    LoginView, CurrentUserView, SchoolSettingsView,
    NotificationListView, MarkNotificationReadView, AuditLogListView
)

# Academic views
from academic.views import (
    AcademicYearViewSet, ClassGroupViewSet, SectionViewSet,
    SubjectViewSet, TeacherViewSet, SectionSubjectTeacherViewSet
)

# Students views
from students.views import (
    StudentViewSet, StudentRemarkViewSet, StudentAchievementViewSet
)

# Attendance views
from attendance.views import (
    AttendanceOverviewView, AttendanceSheetView,
    AttendanceMarkView, AttendanceCalendarView, AttendanceAuditLogViewSet,
    AttendanceSessionViewSet
)

# Grades views
from grades.views import (
    GradingScaleViewSet, ExaminationViewSet, ExamSubjectViewSet,
    MarksEntryView, AcademicDashboardStatsView
)

# Reports views
from reports.views import (
    DashboardOverviewView, ExportExcelView, StudentReportCardPdfView, ClassAnalysisView
)

router = DefaultRouter()
# Academic routes
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'classes', ClassGroupViewSet, basename='class-group')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'subject-assignments', SectionSubjectTeacherViewSet, basename='subject-assignment')

# Student routes
router.register(r'students', StudentViewSet, basename='student')
router.register(r'student-remarks', StudentRemarkViewSet, basename='student-remark')
router.register(r'student-achievements', StudentAchievementViewSet, basename='student-achievement')

# Attendance routes
router.register(r'attendance-audit', AttendanceAuditLogViewSet, basename='attendance-audit')
router.register(r'attendance-sessions', AttendanceSessionViewSet, basename='attendance-session')

# Grades routes
router.register(r'grading-scales', GradingScaleViewSet, basename='grading-scale')
router.register(r'examinations', ExaminationViewSet, basename='examination')
router.register(r'exam-subjects', ExamSubjectViewSet, basename='exam-subject')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication & Profile
    path('api/auth/login/', LoginView.as_view(), name='auth-login'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # School & Settings
    path('api/school/settings/', SchoolSettingsView.as_view(), name='school-settings'),
    path('api/notifications/', NotificationListView.as_view(), name='notification-list'),
    path('api/notifications/<str:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),
    path('api/audit-logs/', AuditLogListView.as_view(), name='audit-logs'),

    # Attendance Custom Endpoints
    path('api/attendance/overview/', AttendanceOverviewView.as_view(), name='attendance-overview'),
    path('api/attendance/sheet/', AttendanceSheetView.as_view(), name='attendance-sheet'),
    path('api/attendance/mark/', AttendanceMarkView.as_view(), name='attendance-mark'),
    path('api/attendance/calendar/', AttendanceCalendarView.as_view(), name='attendance-calendar'),

    # Grades Custom Endpoints
    path('api/marks/sheet/', MarksEntryView.as_view(), name='marks-sheet'),
    path('api/marks/entry/', MarksEntryView.as_view(), name='marks-entry'),
    path('api/academic-analytics/', AcademicDashboardStatsView.as_view(), name='academic-analytics'),

    # Dashboard & Reports Endpoints
    path('api/dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('api/reports/class-analysis/', ClassAnalysisView.as_view(), name='class-analysis'),
    path('api/reports/export-excel/', ExportExcelView.as_view(), name='export-excel'),
    path('api/reports/student-report-card-pdf/<int:student_id>/', StudentReportCardPdfView.as_view(), name='report-card-pdf'),

    # Router ViewSets
    path('api/', include(router.urls)),
]
