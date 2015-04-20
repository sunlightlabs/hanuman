from django.db import models
from django.contrib.auth.models import User
from postgres.fields import JSONField
from django.contrib.postgres.fields import ArrayField

class Session(models.Model):
    user = models.ForeignKey(User)
    start = models.DateTimeField(auto_now_add=True)

    @classmethod
    def current_for_user(kls, user):
        sess = list(kls.objects.filter(user=user).order_by('-start').limit(0))
        if not sess:
            sess = kls(user=user)
            kls.save()
        return sess

    class Meta:
        index_together = (('user', 'start'))

class Firm(models.Model):
    name = models.TextField()
    domain = models.TextField()
    count = models.PositiveIntegerField()
    external_id = models.TextField(blank=True)

FLAG_TYPE_CHOICES = (
    ('not_firm', 'Organization is not a firm'),
    ('not_firm_website', 'Not the organization\'s website'),
    ('tech_problem', 'Technical problem with collection'),
    ('complete', 'Data collection for this organization is complete'),
)
class Flag(models.Model):
    firm = models.ForeignKey(Firm)
    session = models.ForeignKey(Session)
    type = models.CharField(choices=FLAG_TYPE_CHOICES, max_length=32)
    resolved = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

class BioPage(models.Model):
    firm = models.ForeignKey(Firm)
    session = models.ForeignKey(Session)
    url = models.URLField()
    data = JSONField()

class ViewLog(models.Model):
    firm = models.ForeignKey(Firm)
    session = models.ForeignKey(Session)
    bio_pages = ArrayField(models.URLField(), blank=True)
    non_bio_pages = ArrayField(models.URLField(), blank=True)