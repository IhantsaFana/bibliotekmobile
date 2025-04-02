from django.conf import settings
from django.db import models

# Modèle pour stocker les ISBN des livres
class Ouvrage(models.Model):
    isbn = models.CharField(max_length=20, unique=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.isbn

# Modèle pour les réservations d'ouvrages par les utilisateurs
class Reservation(models.Model):
    STATUT_CHOICES = [
        ('En attente', 'En attente'),
        ('Confirmée', 'Confirmée'),
        ('Annulée', 'Annulée'),
    ]
    
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    ouvrage = models.ForeignKey(Ouvrage, on_delete=models.CASCADE, related_name='reservations')
    date_reservation = models.DateTimeField(auto_now_add=True)
    date_retour_prevu = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En attente')

    def __str__(self):
        return f"{self.utilisateur} - {self.ouvrage} ({self.statut})"

# Modèle pour gérer les emprunts effectifs
class Emprunt(models.Model):
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emprunts')
    ouvrage = models.ForeignKey(Ouvrage, on_delete=models.CASCADE, related_name='emprunts')
    date_emprunt = models.DateTimeField(auto_now_add=True)
    date_retour_prevu = models.DateField()
    date_retour_effective = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.utilisateur} - {self.ouvrage} (Emprunt)"

# Modèle pour les notifications
class Notification(models.Model):
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification pour {self.utilisateur} le {self.date_envoi}"

# Modèle pour gérer les pénalités (liée à une réservation par exemple)
class Penalite(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='penalites', null=True, blank=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_penalite = models.DateTimeField(auto_now_add=True)
    STATUT_CHOICES = [
        ('Non payé', 'Non payé'),
        ('Payé', 'Payé'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Non payé')

    def __str__(self):
        return f"Pénalité de {self.montant} pour {self.reservation}"

# Modèle pour l'historique des emprunts terminés
class HistoriqueEmprunt(models.Model):
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='historique_emprunts')
    ouvrage = models.ForeignKey(Ouvrage, on_delete=models.CASCADE, related_name='historique_emprunts')
    date_emprunt = models.DateTimeField()
    date_retour_effective = models.DateField()

    def __str__(self):
        return f"Historique {self.utilisateur} - {self.ouvrage}"

# Modèle pour stocker des statistiques agrégées
class Statistiques(models.Model):
    date_stat = models.DateField(unique=True)
    nombre_utilisateurs = models.IntegerField(default=0)
    nombre_reservations = models.IntegerField(default=0)
    nombre_emprunts = models.IntegerField(default=0)
    revenu_penalites = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Statistiques du {self.date_stat}"
