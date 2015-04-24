from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
import views

urlpatterns = [
    url(r'^firms/$', views.FirmList.as_view()),
    url(r'^firms/(?P<pk>[0-9]+)/$', views.FirmDetail.as_view()),
    url(r'^firms/next/$', views.NextFirmDetail.as_view()),

    url(r'^bio-pages/$', views.BioPageCreate.as_view()),

    url(r'^view-logs/$', views.ViewLogCreate.as_view()),

    url(r'^flags/$', views.FlagCreate.as_view()),

    url(r'^token-auth/', 'rest_framework_jwt.views.obtain_jwt_token'),
    url(r'^token-auth-ns/', views.ObtainJSONWebTokenNS.as_view()),
    url(r'^token-refresh/', 'rest_framework_jwt.views.refresh_jwt_token'),
]

urlpatterns = format_suffix_patterns(urlpatterns)