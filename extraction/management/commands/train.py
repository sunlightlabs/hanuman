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
        scrape_dir = os.path.join(settings.MODEL_DIR, 'scrape')
        model_dir = os.path.join(settings.MODEL_DIR, 'model')

        for data_dir in (scrape_dir, model_dir):
            if not os.path.exists(data_dir):
                os.mkdir(data_dir)

        for firm_id in options['firm_id']:
            try:
                firm = Firm.objects.get(pk=firm_id)
            except Firm.DoesNotExist:
                raise CommandError('Firm "%s" does not exist' % firm_id)

            self.stdout.write("Training for firm \"%s\"\n" % firm.name)

            self.train_page_classifier(firm)
            self.train_element_classifier(firm)

            self.stdout.write('Successfully trained models for firm "%s"' % firm.name)

    def train_page_classifier(self, firm):
        fts = FirmTrainingSet.get_for_firm(firm)
        spider = Spider(firm.domain, os.path.join(settings.MODEL_DIR, 'scrape', str(fts.id) + ".db"), workers=4, retry_attempts=2)

        self.stdout.write("Page classifier:\n")

        model = PageClassifier(os.path.join(settings.MODEL_DIR, 'model', str(fts.id) + "_page.tgm"))

        self.stdout.write('Retrieving page features...\n')

        bio_pages = set()
        non_bio_pages = set()
        for view_log in ViewLog.objects.filter(firm=firm, session__user__collectionsettings__is_test_user=False):
            bio_pages.update(view_log.bio_pages)
            non_bio_pages.update(view_log.non_bio_pages)

        for cat, pages in (('bio', bio_pages), ('nonbio', non_bio_pages)):
            for url in pages:
                self.stdout.write(' * ' + url)
                try:
                    page = spider.get(url)
                except:
                    continue
                if (page.text.strip()):
                    model.add_page(page, cat)

        self.stdout.write('Done (processed %s pages).\n' % (len(bio_pages) + len(non_bio_pages)))

        self.stdout.write('Training... ')
        model.train()
        model.save()
        self.stdout.write('done.\n')

        self.stdout.write('Testing classifier on training data...\n')
        total_count = 0
        correct_count = 0
        for cat, pages in (('bio', bio_pages), ('nonbio', non_bio_pages)):
            for url in pages:
                try:
                    page = spider.get(url)
                except:
                    continue
                if not page.text.strip():
                    continue

                prediction = str(model.predict(page))
                print url, json.dumps(cat), json.dumps(prediction), "true" if cat == prediction else "false"

                total_count += 1
                correct_count += 1 if cat == prediction else 0

        self.stdout.write('Accuracy: %s%%; ' % int(round(100 * float(correct_count) / total_count)))
        if float(correct_count) / total_count >= 0.8:
            self.stdout.write('continuing...\n')
            fts.page_classifier_trained = True
            fts.save()
        else:
            self.stdout.write('giving up.\n')
            raise CommandError('Page classifier training failed.')

    def train_element_classifier(self, firm):
        fts = FirmTrainingSet.get_for_firm(firm)
        spider = Spider(firm.domain, os.path.join(settings.MODEL_DIR, 'scrape', str(fts.id) + ".db"), workers=4, retry_attempts=2)

        self.stdout.write("Element classifier:\n")

        model = ElementClassifier(os.path.join(settings.MODEL_DIR, 'model', str(fts.id) + "_element.tgm"))

        self.stdout.write('Retrieving element features... ')

        for bio_page in BioPage.objects.filter(firm=firm, session__user__collectionsettings__is_test_user=False):
            xpaths = []

            if len(bio_page.data['people']) > 1:
                raise CommandError('Extracting multiple people from a bio page is currently unsupported.')

            person = bio_page.data['people'][0]
            xpaths.append((person['name']['container_xpath'], 'name'))
            for bio in person['bio']:
                xpaths.append((bio['container_xpath'], 'bio'))

            try:
                page = spider.get(bio_page.url)
            except:
                continue
            if (page.text.strip()):
                model.add_page(page, xpaths)

        self.stdout.write('Training... ')
        model.train()
        model.save()
        self.stdout.write('done.\n')

        self.stdout.write('Testing classifier on training data...\n')
        total_count = 0
        correct_count = 0
        for bio_page in BioPage.objects.filter(firm=firm, session__user__collectionsettings__is_test_user=False):
            xpaths = []
            for person in bio_page.data['people']:
                xpaths.append((person['name']['container_xpath'], 'name'))
                for bio in person['bio']:
                    xpaths.append((bio['container_xpath'], 'bio'))

            page = spider.get(bio_page.url)
            results = model.test_xpaths(page, xpaths)

            for result in results:
                total_count += 1
                if result['expected_label'] == result['got_label']:
                    correct_count += 1

        self.stdout.write('Accuracy: %s%%; ' % int(round(100 * float(correct_count) / total_count)))
        if float(correct_count) / total_count >= 0.8:
            self.stdout.write('continuing...\n')
            fts.element_classifier_trained = True
            fts.save()
        else:
            self.stdout.write('giving up.\n')
            raise CommandError('Element classifier training failed.')
