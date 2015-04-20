from django.core.management.base import BaseCommand, CommandError
from hanuman.data_collection.models import Firm
import json

class Command(BaseCommand):
    help = "Import Zach-format firm lists"

    def add_arguments(self, parser):
        parser.add_argument('filename', nargs=1, type=str)

    def handle(self, *args, **options):
        data = json.load(open(options['filename'][0]))
        for row in data:
            firm = Firm(
                name=row['name'],
                domain=row['email'],
                count=row['count'],
                external_id=row['file']
            )
            firm.save()