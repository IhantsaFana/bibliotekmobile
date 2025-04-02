from rest_framework import serializers
from .models import Ouvrage, Reservation, Emprunt, Notification, Penalite, HistoriqueEmprunt, Statistiques

class OuvrageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ouvrage
        fields = ['id', 'isbn', 'date_ajout']

class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['id', 'utilisateur', 'ouvrage', 'date_reservation', 'date_retour_prevu', 'statut']

class EmpruntSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emprunt
        fields = ['id', 'utilisateur', 'ouvrage', 'date_emprunt', 'date_retour_prevu', 'date_retour_effective']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'utilisateur', 'message', 'date_envoi', 'lu']

class PenaliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Penalite
        fields = ['id', 'reservation', 'montant', 'date_penalite', 'statut']

class HistoriqueEmpruntSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueEmprunt
        fields = ['id', 'utilisateur', 'ouvrage', 'date_emprunt', 'date_retour_effective']

class StatistiquesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistiques
        fields = ['id', 'date_stat', 'nombre_utilisateurs', 'nombre_reservations', 'nombre_emprunts', 'revenu_penalites']
