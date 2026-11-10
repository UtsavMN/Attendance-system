from rest_framework import authentication
from core.models import User

class OpenAccessAuthentication(authentication.BaseAuthentication):
    """
    Open-access authentication fallback:
    Allows unrestricted access for all users by default when login is bypassed.
    Attaches the primary school administrator user to the request.
    """
    def authenticate(self, request):
        admin_user = (
            User.objects.filter(is_superuser=True).first()
            or User.objects.filter(role='SUPER_ADMIN').first()
            or User.objects.first()
        )
        if admin_user:
            return (admin_user, None)
        return None
