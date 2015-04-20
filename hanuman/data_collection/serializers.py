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

# serializers for the relevant the models
class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm

class BioPageSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    class Meta:
        model = BioPage

class ViewLogSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    class Meta:
        model = ViewLog

class FlagSerializer(serializers.ModelSerializer):
    session = serializers.HiddenField(default=CurrentSessionDefault())
    class Meta:
        model = Flag