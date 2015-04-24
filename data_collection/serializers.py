from rest_framework import serializers
from rest_framework.compat import unicode_to_repr
from models import *

# voodoo to grab the current session
class CurrentSessionDefault(object):
    def set_context(self, serializer_field):
        self.user = Session.current_for_user(serializer_field.context['request'].user)

    def __call__(self):
        return self.user

    def __repr__(self):
        return unicode_to_repr('%s()' % self.__class__.__name__)

# make the JSON fields work right
class JSONSerializerField(serializers.Field):
    """ Serializer for JSONField -- required to make field writable"""
    def to_internal_value(self, data):
        return data
    def to_representation(self, value):
        return value

# serializers for the relevant the models
class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm

class BioPageSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    data = JSONSerializerField()
    firm = serializers.PrimaryKeyRelatedField(queryset=Firm.objects.all())
    class Meta:
        model = BioPage

class ViewLogSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    firm = serializers.PrimaryKeyRelatedField(queryset=Firm.objects.all())
    bio_pages = JSONSerializerField()
    non_bio_pages = JSONSerializerField()
    class Meta:
        model = ViewLog

class FlagSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    firm = serializers.PrimaryKeyRelatedField(queryset=Firm.objects.all())
    class Meta:
        model = Flag