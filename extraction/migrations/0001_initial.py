# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.postgres.fields
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('data_collection', '0004_auto_20150512_2124'),
    ]

    operations = [
        migrations.CreateModel(
            name='Bio',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.TextField()),
                ('bio_text', django.contrib.postgres.fields.ArrayField(size=None, base_field=models.TextField(), blank=True)),
                ('url', models.URLField()),
                ('position', models.PositiveIntegerField(default=0)),
                ('automated', models.BooleanField(default=True)),
                ('firm', models.ForeignKey(to='data_collection.Firm')),
            ],
        ),
        migrations.CreateModel(
            name='FirmTrainingSet',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, serialize=False, editable=False, primary_key=True)),
                ('spider_complete', models.BooleanField(default=False)),
                ('page_classifier_trained', models.BooleanField(default=False)),
                ('element_classifier_trained', models.BooleanField(default=False)),
                ('extraction_complete', models.BooleanField(default=False)),
                ('firm', models.OneToOneField(to='data_collection.Firm')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='bio',
            unique_together=set([('url', 'position')]),
        ),
    ]
