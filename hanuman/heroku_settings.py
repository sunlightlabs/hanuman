ALLOWED_HOSTS = ['*']

import os, dj_database_url, json
DEBUG = {'False': False, 'True': True}[os.environ.get('DEBUG', 'False')]

DATABASES = {'default': dj_database_url.config()}

MANAGERS = json.loads(os.environ.get('MANAGERS', '[]'))

EMAIL_BACKEND = "postmark.backends.PostmarkBackend"
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'webmaster@localhost')
POSTMARK_API_KEY = os.environ.get('POSTMARK_API_KEY', '')