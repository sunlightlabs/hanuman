# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('data_collection', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='firm',
            name='external_id',
            field=models.TextField(blank=True),
        ),
        migrations.AlterIndexTogether(
            name='session',
            index_together=set([('user', 'start')]),
        ),
    ]
