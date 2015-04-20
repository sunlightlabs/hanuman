from django.http import Http404
from rest_framework import generics
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
        firm = list(self.queryset.order_by('?')[:1])
        if not firm:
            raise Http404
        return firm[0]
