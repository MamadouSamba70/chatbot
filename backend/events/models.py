from django.db import models
from django.contrib.auth.models import User

class AllowedStudent(models.Model):
    matricule = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    departement = models.CharField(max_length=150, default='NTIC')
    niveau_licence = models.CharField(max_length=50, default='Licence 3')

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    matricule = models.CharField(max_length=50, unique=True)
    sexe = models.CharField(max_length=10, choices=[('M', 'Masculin'), ('F', 'Féminin')])
    universite = models.CharField(max_length=200)
    faculte = models.CharField(max_length=200)
    departement = models.CharField(max_length=200)
    telephone = models.CharField(max_length=30, blank=True, default='')
    niveau_licence = models.CharField(
        max_length=20, 
        default='Licence 1', 
        choices=[
            ('Licence 1', 'Licence 1'), 
            ('Licence 2', 'Licence 2'), 
            ('Licence 3', 'Licence 3'), 
            ('Licence 4', 'Licence 4')
        ]
    )
    is_approved = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

class Event(models.Model):
    EVENT_TYPES = [
        ('examen', 'Examen'),
        ('inscription', 'Inscription'),
        ('soutenance', 'Soutenance'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateTimeField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        username = self.user.username if self.user else "Tous les étudiants"
        return f"{self.title} ({self.get_event_type_display()}) - {username}"

class Notification(models.Model):
    CHANNELS = [
        ('email', 'Email'),
        ('push', 'Push'),
        ('sms', 'SMS'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('sent', 'Envoyé'),
        ('failed', 'Échoué'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='notifications')
    channel = models.CharField(max_length=10, choices=CHANNELS)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    message = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification {self.channel} to {self.user.username} ({self.status})"

class FCMToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.TextField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FCMToken for {self.user.username}"
