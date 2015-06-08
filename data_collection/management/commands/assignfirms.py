from django.core.management.base import BaseCommand, CommandError
from data_collection.models import User, Firm, Assignment
import itertools

class Command(BaseCommand):
    help = "Assign firms to users"

    def add_arguments(self, parser):
        parser.add_argument('users', nargs='+', type=str)

    def handle(self, *args, **options):
        users = [User.objects.get(username=username) for username in options['users']]
        for user, firm in itertools.izip(itertools.cycle(users), Firm.objects.all().order_by('?')):
            Assignment.objects.get_or_create(user=user, firm=firm)
            print 'Assigned %s to %s' % (firm.domain, user.username)