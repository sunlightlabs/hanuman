from django.contrib import admin
from django import forms
from models import *

from jsonfield.forms import JSONFormField
from widgets import AceJSONWidget

class BioPageInline(admin.TabularInline):
    model = BioPage
    readonly_fields = ('url', 'data', 'firm')

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'start')
    inlines = [BioPageInline]

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

class ViewLogForm(forms.ModelForm):
    bio_pages = JSONFormField(widget=AceJSONWidget())
    non_bio_pages = JSONFormField(widget=AceJSONWidget())
    class Meta:
        model = ViewLog
        exclude = ()

@admin.register(ViewLog)
class ViewLogAdmin(admin.ModelAdmin):
    form = ViewLogForm
