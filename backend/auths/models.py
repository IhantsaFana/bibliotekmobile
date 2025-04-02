from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

# Create your models here.
class User(AbstractUser):
    ROLE_CHOICES = [
        ('Lecteur', 'Lecteur'),
        ('Bibliothécaire', 'Bibliothécaire'),
        ('Admin', 'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Lecteur')
    
    groups = models.ManyToManyField(
        Group,
        related_name='custom_auths_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_auths_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='user',
    )
    
    def __str__(self):
        return f"{self.username} ({self.role})"