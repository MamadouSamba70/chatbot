from django.contrib import admin
from .models import Event, Notification, FCMToken, StudentProfile

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'event_type', 'date', 'created_at')
    list_filter = ('event_type', 'date', 'user')
    search_fields = ('title', 'description', 'user__username')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'channel', 'status', 'created_at')
    list_filter = ('channel', 'status', 'created_at')
    search_fields = ('user__username', 'event__title', 'message')

@admin.register(FCMToken)
class FCMTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at')
    search_fields = ('user__username', 'token')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'matricule', 'nom', 'prenom', 'sexe', 'universite', 'faculte', 'departement')
    search_fields = ('user__username', 'matricule', 'nom', 'prenom', 'universite', 'faculte', 'departement')
    list_filter = ('sexe', 'universite', 'faculte', 'departement')
