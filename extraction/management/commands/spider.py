from django.core.management.base import BaseCommand, CommandError
from data_collection.models import Firm
from extraction.models import FirmTrainingSet
from django.conf import settings

from nanospider import Spider

import os

class Command(BaseCommand):
    help = 'Scrapes a firm\'s site'

    def add_arguments(self, parser):
        parser.add_argument('firm_id', nargs='+', type=int)

    def handle(self, *args, **options):
        from nanospider.spider import Spider
        scrape_dir = os.path.join(settings.MODEL_DIR, 'scrape')

        if not os.path.exists(scrape_dir):
            os.mkdir(scrape_dir)

        for firm_id in options['firm_id']:
            try:
                firm = Firm.objects.get(pk=firm_id)
            except Firm.DoesNotExist:
                raise CommandError('Firm "%s" does not exist' % firm_id)

            self.stdout.write("Scraping firm '%s'" % firm.name)

            fts = FirmTrainingSet.get_for_firm(firm)

            spider = Spider(firm.domain, os.path.join(scrape_dir, str(fts.id) + ".db"), workers=4, retry_attempts=2)
            spider.crawl()

            fts.spider_complete = True
            fts.save()

            self.stdout.write('Successfully scraped firm "%s"' % firm.name)
