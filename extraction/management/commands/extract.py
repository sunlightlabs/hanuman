from django.core.management.base import BaseCommand, CommandError
from data_collection.models import *
from extraction.models import FirmTrainingSet
from django.conf import settings

from nanospider import Spider
from mlscrape import PageClassifier, ElementClassifier

import os, json

class Command(BaseCommand):
    help = 'Trains on a firm\'s site'

    def add_arguments(self, parser):
        parser.add_argument('firm_id', nargs='+', type=int)

    def handle(self, *args, **options):
        from nanospider.spider import Spider
        self.scrape_dir = os.path.join(settings.MODEL_DIR, 'scrape')
        self.model_dir = os.path.join(settings.MODEL_DIR, 'model')

        for data_dir in (self.scrape_dir, self.model_dir):
            if not os.path.exists(data_dir):
                os.mkdir(data_dir)

        for firm_id in options['firm_id']:
            try:
                firm = Firm.objects.get(pk=firm_id)
            except Firm.DoesNotExist:
                raise CommandError('Firm "%s" does not exist' % firm_id)

            fts = FirmTrainingSet.get_for_firm(firm)

            self.stdout.write("Extracting bios for firm \"%s\"\n" % firm.name)

            if not all([fts.spider_complete, fts.page_classifier_trained, fts.element_classifier_trained]):
                raise CommandError('Spidering must be complete and both models must be trained for extraction to occur.')

            pages = self.identify_bio_pages(firm)
            elements = self.identify_bio_elements(firm, pages)

            print json.dumps(elements, indent=4)

            self.stdout.write('Successfully extracted data for firm "%s"' % firm.name)

    def identify_bio_pages(self, firm):
        fts = FirmTrainingSet.get_for_firm(firm)
        spider = Spider(firm.domain, os.path.join(self.scrape_dir, str(fts.id) + ".db"), workers=4, retry_attempts=2)

        self.stdout.write("Identifying bio pages...\n")

        model = PageClassifier(os.path.join(self.model_dir, str(fts.id) + "_page.tgm"))
        model.load()

        self.stdout.write('Retrieving page features...\n')

        bio_pages = []
        for url in spider.urls:
            page = spider.get(url)
            cat = str(model.predict(page))
            if cat == 'bio':
                self.stdout.write(' * ' + url)
                bio_pages.append(url)

        self.stdout.write('Done.')

        return bio_pages

    def identify_bio_elements(self, firm, urls):
        fts = FirmTrainingSet.get_for_firm(firm)
        spider = Spider(firm.domain, os.path.join(self.scrape_dir, str(fts.id) + ".db"), workers=4, retry_attempts=2)

        self.stdout.write("Identifying bio elements...\n")

        model = ElementClassifier(os.path.join(settings.MODEL_DIR, 'model', str(fts.id) + "_element.tgm"))
        model.load()

        self.stdout.write('Retrieving element features...\n')

        elements_out = []
        for url in urls:
            page = spider.get(url)
            out_data = model.extract(page, format="html")
            out_data['url'] = url

            out_data = dict(out_data)
            print json.dumps(out_data, indent=4)
            elements_out.append(out_data)

        self.stdout.write('Done.\n')

        return elements_out