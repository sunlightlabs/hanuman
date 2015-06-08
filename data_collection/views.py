from django.http import Http404
from rest_framework import generics, status, response
from models import *
from serializers import *

class FirmList(generics.ListAPIView):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer

class FirmDetail(generics.RetrieveAPIView):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer

class NextFirmDetail(generics.RetrieveAPIView):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer

    def get_object(self):
        # for most users, we're going to look for any unflagged firm and send it along
        cs, created = CollectionSettings.objects.get_or_create(user=self.request.user)

        if cs.is_assigned_user:
            assignment = Assignment.objects.filter(user=self.request.user, complete=False).order_by('?')[:1]
            firm = [a.firm for a in assignment]
        else:
            firm = list(Firm.objects.exclude(id__in=Flag.objects.filter(resolved=False).values('firm_id')).order_by('?')[:1])

        if not firm:
            raise Http404
        return firm[0]

class BioPageCreate(generics.CreateAPIView):
    queryset = BioPage.objects.all()
    serializer_class = BioPageSerializer

class ViewLogCreate(generics.CreateAPIView):
    queryset = ViewLog.objects.all()
    serializer_class = ViewLogSerializer

class FlagCreate(generics.CreateAPIView):
    queryset = Flag.objects.all()
    serializer_class = FlagSerializer

    # we only actually save the flag if it's a type we care about
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.initial_data['type'] in dict(FLAG_TYPE_CHOICES):
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            out = response.Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            out = response.Response(serializer.initial_data, status=status.HTTP_200_OK)

        # either way, if this was an assigned task, mark that done, too
        cs, created = CollectionSettings.objects.get_or_create(user=request.user)
        if cs.is_assigned_user:
            for assignment in Assignment.objects.filter(user=request.user, firm_id=request.data['firm']):
                assignment.complete = True
                assignment.save()

        return out

# a little bit of hackery on the JWT endpoint to start new sessions on login
from rest_framework_jwt.views import ObtainJSONWebToken
from rest_framework import status

class ObtainJSONWebTokenNS(ObtainJSONWebToken):
    def post(self, request):
        resp = super(ObtainJSONWebTokenNS, self).post(request)

        if resp.status_code == status.HTTP_200_OK:
            serializer = self.serializer_class(data=request.DATA)

            # no-op this because we did it already in the super-class
            serializer.is_valid()

            user = serializer.object.get('user') or request.user

            new_session = Session(user=user)
            new_session.save()

        return resp