from django.db import models
from django.contrib.postgres.fields import ArrayField

from data_collection.models import Firm
import uuid

class FirmTrainingSet(models.Model):
    # use a UUID because we use the ID to name stuff in the filesystem and this ensures uniqueness of files across databases
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    firm = models.OneToOneField(Firm)

    spider_complete = models.BooleanField(default=False)
    page_classifier_trained = models.BooleanField(default=False)
    element_classifier_trained = models.BooleanField(default=False)
    extraction_complete = models.BooleanField(default=False)

    @classmethod
    def get_for_firm(cls, firm):
        try:
            fts = FirmTrainingSet.objects.get(firm=firm)
        except FirmTrainingSet.DoesNotExist:
            fts = FirmTrainingSet(firm=firm)
            fts.save()
        return fts

# this is a single, extracted bio (vs BioPage in data collection, which might have multiple bios on the same page)
class Bio(models.Model):
    firm = models.ForeignKey(Firm)

    name = models.TextField()
    bio_text = ArrayField(models.TextField(), blank=True)

    url = models.URLField()
    position = models.PositiveIntegerField(default=0)

    # if false, this is the result of a complete manual-tagged firm instead of an ML model extraction
    automated = models.BooleanField(default=True)

    class Meta:
        unique_together = ("url", "position")