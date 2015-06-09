from django.core.management.base import BaseCommand, CommandError
from data_collection.models import User, Firm, Assignment
import itertools, random

class Command(BaseCommand):
    help = "Assign firms to users"

    def add_arguments(self, parser):
        parser.add_argument('users', nargs='+', type=str)
        parser.add_argument('-d', '--drop', dest="drop", default=False, action="store_true", help="Drop current assignments")
        parser.add_argument('-p', '--percentage', dest="percentage", action="store", type=int, nargs="+")

    def handle(self, *args, **options):
        if options['drop']:
            Assignment.objects.all().delete()

        if options['percentage']:
            if len(options['percentage']) != len(options['users']):
                raise CommandError('If you specify percentages, you must specify the same number as you specify users')
            percentage = options['percentage']
        else:
            percentage = [1] * len(options['users'])

        # make a list that has the requested usernames distributed as requested
        users = sorted(
            itertools.chain.from_iterable(
                [[User.objects.get(username=username)] * count for username, count in zip(options['users'], percentage)]
            ),
            key = lambda x: random.random()
        )

        for user, firm in itertools.izip(itertools.cycle(users), Firm.objects.all().order_by('?')):
            Assignment.objects.get_or_create(user=user, firm=firm)
            print 'Assigned %s to %s' % (firm.domain, user.username)