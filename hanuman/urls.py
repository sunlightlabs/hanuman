from django.conf.urls import include, url
from django.contrib import admin

urlpatterns = [
    # Examples:
    # url(r'^$', 'hanuman.views.home', name='home'),
    url(r'^api/1.0/', include('data_collection.urls')),

    url(r'^admin/', include(admin.site.urls)),
]
