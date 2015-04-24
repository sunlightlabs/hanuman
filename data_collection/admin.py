from django.contrib import admin
from django import forms
from models import *

from jsonfield.forms import JSONFormField
from widgets import AceJSONWidget

class BioPageForm(forms.ModelForm):
    data = JSONFormField(widget=AceJSONWidget())
    class Meta:
        model = BioPage
        exclude = ()

class ViewLogForm(forms.ModelForm):
    bio_pages = JSONFormField(widget=AceJSONWidget())
    non_bio_pages = JSONFormField(widget=AceJSONWidget())
    class Meta:
        model = ViewLog
        exclude = ()

class BioPageInline(admin.TabularInline):
    model = BioPage
    readonly_fields = ('url', 'firm')
    extra = False
    form = BioPageForm

class ViewLogInline(admin.TabularInline):
    model = ViewLog
    readonly_fields = ('firm',)
    extra = False
    form = ViewLogForm

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'start')
    inlines = [BioPageInline, ViewLogInline]

@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    pass

@admin.register(Flag)
class FlagAdmin(admin.ModelAdmin):
    pass

@admin.register(BioPage)
class BioPageAdmin(admin.ModelAdmin):
    form = BioPageForm

@admin.register(ViewLog)
class ViewLogAdmin(admin.ModelAdmin):
    form = ViewLogForm
