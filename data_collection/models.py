from django.db import models
from django.contrib.auth.models import User
from postgres.fields import JSONField
from django.contrib.postgres.fields import ArrayField

class Session(models.Model):
    user = models.ForeignKey(User)
    start = models.DateTimeField(auto_now_add=True)

    @classmethod
    def current_for_user(kls, user):
        sessions = list(kls.objects.filter(user=user).order_by('-start')[:1])
        if sessions:
            sess = sessions[0]
        else:
            sess = kls(user=user)
            sess.save()
        return sess

    def __str__(self):
        return "%s on %s" % (self.user.username, self.start.date().isoformat())

    class Meta:
        index_together = (('user', 'start'))

class Firm(models.Model):
    name = models.TextField()
    domain = models.TextField()
    count = models.PositiveIntegerField()
    external_id = models.TextField(blank=True)

    def __str__(self):
        return self.name

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
    created = models.DateTimeField(auto_now_add=True)

class BioPage(models.Model):
    firm = models.ForeignKey(Firm)
    session = models.ForeignKey(Session)
    url = models.URLField()
    data = JSONField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        url = self.url if len(self.url) < 30 else "%s...%s" % (self.url[:15], self.url[-15:])
        return "%s from %s" % (url, self.created.isoformat())

class ViewLog(models.Model):
    firm = models.ForeignKey(Firm)
    session = models.ForeignKey(Session)
    bio_pages = ArrayField(models.URLField(), blank=True)
    non_bio_pages = ArrayField(models.URLField(), blank=True)
    created = models.DateTimeField(auto_now_add=True)