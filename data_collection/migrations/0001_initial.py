# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.core.serializers.json
import postgres.fields
import django.contrib.postgres.fields
from django.conf import settings
import decimal


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BioPage',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('url', models.URLField()),
                ('data', postgres.fields.JSONField(encode_kwargs={'cls': django.core.serializers.json.DjangoJSONEncoder}, decode_kwargs={'parse_float': decimal.Decimal})),
            ],
        ),
        migrations.CreateModel(
            name='Firm',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.TextField()),
                ('domain', models.TextField()),
                ('count', models.PositiveIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Flag',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('type', models.CharField(max_length=32, choices=[(b'not_firm', b'Organization is not a firm'), (b'not_firm_website', b"Not the organization's website"), (b'tech_problem', b'Technical problem with collection'), (b'complete', b'Data collection for this organization is complete')])),
                ('resolved', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('firm', models.ForeignKey(to='data_collection.Firm')),
            ],
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('start', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ViewLog',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('bio_pages', django.contrib.postgres.fields.ArrayField(size=None, base_field=models.URLField(), blank=True)),
                ('non_bio_pages', django.contrib.postgres.fields.ArrayField(size=None, base_field=models.URLField(), blank=True)),
                ('firm', models.ForeignKey(to='data_collection.Firm')),
                ('session', models.ForeignKey(to='data_collection.Session')),
            ],
        ),
        migrations.AddField(
            model_name='flag',
            name='session',
            field=models.ForeignKey(to='data_collection.Session'),
        ),
        migrations.AddField(
            model_name='biopage',
            name='firm',
            field=models.ForeignKey(to='data_collection.Firm'),
        ),
        migrations.AddField(
            model_name='biopage',
            name='session',
            field=models.ForeignKey(to='data_collection.Session'),
        ),
    ]
