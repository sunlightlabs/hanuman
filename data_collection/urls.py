from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
import views

urlpatterns = [
    url(r'^firms/$', views.FirmList.as_view()),
    url(r'^firms/(?P<pk>[0-9]+)/$', views.FirmDetail.as_view()),
    url(r'^firms/next/$', views.NextFirmDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)