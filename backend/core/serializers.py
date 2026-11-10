from rest_framework import serializers
from core.models import School, User, Notification, AuditLog

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'motto', 'address', 'phone', 'email',
            'website', 'logo_url', 'attendance_threshold', 'warning_threshold',
            'late_penalty_weight', 'excused_counts_as_present', 'created_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'school', 'school_name', 'phone_number', 'avatar_url', 'is_active'
        ]
        read_only_fields = ['id', 'school_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'school', 'recipient', 'title', 'message', 'category', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'school', 'user', 'user_name', 'action', 'target_model', 'target_id', 'details', 'ip_address', 'timestamp']
        read_only_fields = ['id', 'timestamp']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username if obj.user else 'System'
