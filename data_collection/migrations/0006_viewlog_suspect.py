# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('data_collection', '0005_assignment_collectionsettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='viewlog',
            name='suspect',
            field=models.BooleanField(default=False),
        ),
    ]
