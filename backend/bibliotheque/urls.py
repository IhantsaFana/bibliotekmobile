from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OuvrageViewSet,
    ReservationViewSet,
    EmpruntViewSet,
    NotificationViewSet,
    PenaliteViewSet,
    HistoriqueEmpruntViewSet,
    StatistiquesViewSet,
)

router = DefaultRouter()
router.register(r'ouvrages', OuvrageViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'emprunts', EmpruntViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'penalites', PenaliteViewSet)
router.register(r'historique-emprunts', HistoriqueEmpruntViewSet)
router.register(r'statistiques', StatistiquesViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
