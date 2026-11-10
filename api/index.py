import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Automatic migration & initial data seeding on serverless startup
try:
    import django
    django.setup()
    from django.core.management import call_command
    call_command('migrate', interactive=False)
    from core.models import User, School
    if not School.objects.exists() or not User.objects.exists():
        call_command('setup_clean_school')
except Exception as e:
    print(f"Vercel startup notice: {e}")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
