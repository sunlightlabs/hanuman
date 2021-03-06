from __future__ import unicode_literals 
from django.shortcuts import render, redirect
from django.contrib.auth.views import login
from django.contrib.auth.decorators import login_required
from django.conf import settings


def home(request):
    if (request.user.is_authenticated()):
        return redirect('profile')
    return login(request, template_name='landing_site/home.html')

@login_required
def profile(request):
    return render(request, template_name='landing_site/profile.html', context={'app_url': getattr(settings, 'CHROME_APP_URL', ''), 'contact_url': getattr(settings, 'CONTACT_URL', '')})
