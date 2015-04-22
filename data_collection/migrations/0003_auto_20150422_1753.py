# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('data_collection', '0002_auto_20150420_2125'),
    ]

    operations = [
        migrations.AddField(
            model_name='biopage',
            name='created',
            field=models.DateTimeField(default=datetime.datetime(2015, 4, 22, 17, 53, 30, 482986, tzinfo=utc), auto_now_add=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='flag',
            name='created',
            field=models.DateTimeField(default=datetime.datetime(2015, 4, 22, 17, 53, 40, 723137, tzinfo=utc), auto_now_add=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='viewlog',
            name='created',
            field=models.DateTimeField(default=datetime.datetime(2015, 4, 22, 17, 53, 46, 947281, tzinfo=utc), auto_now_add=True),
            preserve_default=False,
        ),
    ]
