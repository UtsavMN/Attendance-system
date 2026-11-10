from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from academic.models import AcademicYear, ClassGroup, Section, Subject, Teacher, SectionSubjectTeacher
from academic.serializers import (
    AcademicYearSerializer, ClassGroupSerializer, SectionSimpleSerializer,
    SubjectSerializer, TeacherSerializer, SectionSubjectTeacherSerializer
)
from core.permissions import IsSchoolAdmin, IsTeacherOrAdmin

class AcademicYearViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        return AcademicYear.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class ClassGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ClassGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        return ClassGroup.objects.filter(school=self.request.user.school).prefetch_related('sections', 'subjects')

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    @action(detail=True, methods=['post'])
    def assign_subject(self, request, pk=None):
        class_group = self.get_object()
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'detail': 'subject_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            subject = Subject.objects.get(id=subject_id, school=request.user.school)
            class_group.subjects.add(subject)
            return Response({'detail': f'Subject {subject.name} added to {class_group.name}.'})
        except Subject.DoesNotExist:
            return Response({'detail': 'Subject not found.'}, status=status.HTTP_404_NOT_FOUND)


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSimpleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = Section.objects.filter(class_group__school=self.request.user.school)
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        return qs


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        return Subject.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        return Teacher.objects.filter(school=self.request.user.school).select_related('user')


class SectionSubjectTeacherViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSubjectTeacherSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = SectionSubjectTeacher.objects.filter(section__class_group__school=self.request.user.school)
        section_id = self.request.query_params.get('section_id')
        teacher_id = self.request.query_params.get('teacher_id')
        if section_id:
            qs = qs.filter(section_id=section_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs
