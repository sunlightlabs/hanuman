# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('data_collection', '0003_auto_20150422_1753'),
    ]

    operations = [
        migrations.AlterField(
            model_name='flag',
            name='type',
            field=models.CharField(max_length=32, choices=[(b'not_firm', b'Organization is not a firm'), (b'not_org_website', b"Not the organization's website"), (b'tech_problem', b'Technical problem with collection'), (b'other', b'Other'), (b'complete', b'Data collection for this organization is complete')]),
        ),
    ]
