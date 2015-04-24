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

class BioPageCreate(generics.CreateAPIView):
    queryset = BioPage.objects.all()
    serializer_class = BioPageSerializer

class ViewLogCreate(generics.CreateAPIView):
    queryset = ViewLog.objects.all()
    serializer_class = ViewLogSerializer

# a little bit of hackery on the JWT endpoint to start new sessions on login
from rest_framework_jwt.views import ObtainJSONWebToken
from rest_framework import status

class ObtainJSONWebTokenNS(ObtainJSONWebToken):
    def post(self, request):
        response = super(ObtainJSONWebTokenNS, self).post(request)
        
        if response.status_code == status.HTTP_200_OK:
            serializer = self.serializer_class(data=request.DATA)
            
            # no-op this because we did it already in the super-class
            serializer.is_valid()

            user = serializer.object.get('user') or request.user

            new_session = Session(user=user)
            new_session.save()

        return response