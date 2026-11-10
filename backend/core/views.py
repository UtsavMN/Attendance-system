from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from core.models import School, User, Notification, AuditLog
from core.serializers import SchoolSerializer, UserSerializer, NotificationSerializer, AuditLogSerializer
from core.permissions import IsSchoolAdmin

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {'detail': 'Invalid credentials provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        school_data = SchoolSerializer(user.school).data if user.school else None

        # Log login
        if user.school:
            AuditLog.objects.create(
                school=user.school,
                user=user,
                action='USER_LOGIN',
                target_model='User',
                target_id=str(user.id),
                details={'username': user.username, 'role': user.role},
                ip_address=request.META.get('REMOTE_ADDR')
            )

        return Response({
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'user': user_data,
            'school': school_data,
        })


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_data = UserSerializer(request.user).data
        school_data = SchoolSerializer(request.user.school).data if request.user.school else None
        return Response({
            'user': user_data,
            'school': school_data,
        })


class SchoolSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        if not school:
            return Response({'detail': 'No school associated with this user.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SchoolSerializer(school).data)

    def patch(self, request):
        school = request.user.school
        if not school:
            return Response({'detail': 'No school associated with this user.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SchoolSerializer(school, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            AuditLog.objects.create(
                school=school,
                user=request.user,
                action='SCHOOL_SETTINGS_UPDATED',
                target_model='School',
                target_id=str(school.id),
                details=request.data,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MarkNotificationReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        if pk == 'all':
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            return Response({'detail': 'All notifications marked as read.'})
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response(NotificationSerializer(notification).data)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.filter(school=self.request.user.school)
        action = self.request.query_params.get('action')
        model = self.request.query_params.get('model')
        if action:
            qs = qs.filter(action=action)
        if model:
            qs = qs.filter(target_model__icontains=model)
        return qs
