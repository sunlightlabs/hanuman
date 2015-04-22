from django.contrib import admin
from django import forms
from models import *

from jsonfield.forms import JSONFormField
from widgets import AceJSONWidget

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    pass

@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    pass

@admin.register(Flag)
class FlagAdmin(admin.ModelAdmin):
    pass

class BioPageForm(forms.ModelForm):
    data = JSONFormField(widget=AceJSONWidget())
    class Meta:
        model = BioPage
        exclude = ()

@admin.register(BioPage)
class BioPageAdmin(admin.ModelAdmin):
    form = BioPageForm

@admin.register(ViewLog)
class ViewLogAdmin(admin.ModelAdmin):
    pass
