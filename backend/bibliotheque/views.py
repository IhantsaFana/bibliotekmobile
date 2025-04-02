import requests
from rest_framework import viewsets, status
from .models import Ouvrage, Reservation, Emprunt, Notification, Penalite, HistoriqueEmprunt, Statistiques
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import (
    OuvrageSerializer,
    ReservationSerializer,
    EmpruntSerializer,
    NotificationSerializer,
    PenaliteSerializer,
    HistoriqueEmpruntSerializer,
    StatistiquesSerializer
)

class OuvrageViewSet(viewsets.ModelViewSet):
    queryset = Ouvrage.objects.all()
    serializer_class = OuvrageSerializer

    @action(detail=True, methods=['get'], url_path='details')
    def get_details(self, request, pk=None):
        """
        Récupère les informations enrichies du livre via l'API Google Books à partir de l'ISBN.
        """
        ouvrage = self.get_object()
        isbn = ouvrage.isbn
        # URL de base de l'API Google Books
        url = "https://www.googleapis.com/books/v1/volumes"
        # Paramètres de la requête (recherche par ISBN)
        params = {
            "q": f"isbn:{isbn}",
            "maxResults": 1
        }
        # Effectuer la requête à l'API externe
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                volume_info = items[0].get("volumeInfo", {})
                enriched_data = {
                    "titre": volume_info.get("title", "Titre inconnu"),
                    "auteurs": volume_info.get("authors", []),
                    "description": volume_info.get("description", "Aucune description disponible"),
                    "publishedDate": volume_info.get("publishedDate", "Date inconnue"),
                    "categories": volume_info.get("categories", []),
                    "thumbnail": volume_info.get("imageLinks", {}).get("thumbnail", ""),
                }
                return Response(enriched_data, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Aucun livre trouvé pour cet ISBN."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Erreur lors de l'appel à l'API Google Books."}, status=response.status_code)

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer

class EmpruntViewSet(viewsets.ModelViewSet):
    queryset = Emprunt.objects.all()
    serializer_class = EmpruntSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

class PenaliteViewSet(viewsets.ModelViewSet):
    queryset = Penalite.objects.all()
    serializer_class = PenaliteSerializer

class HistoriqueEmpruntViewSet(viewsets.ModelViewSet):
    queryset = HistoriqueEmprunt.objects.all()
    serializer_class = HistoriqueEmpruntSerializer

class StatistiquesViewSet(viewsets.ModelViewSet):
    queryset = Statistiques.objects.all()
    serializer_class = StatistiquesSerializer
