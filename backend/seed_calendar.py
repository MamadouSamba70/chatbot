import os
import django
from datetime import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminderbot.settings')
django.setup()

from django.contrib.auth.models import User
from events.models import Event

# UGANC 2025-2026 Academic Calendar events
CALENDAR_EVENTS = [
    {
        'title': "Rentrée Académique & Début des Inscriptions (Module 1)",
        'description': "Début des inscriptions, réinscriptions, cours et évaluations pour le premier module.",
        'date': datetime(2025, 10, 20, 8, 0),
        'event_type': 'inscription'
    },
    {
        'title': "1ère Semaine Culturelle et Sportive",
        'description': "Activités culturelles et sportives de l'université UGANC.",
        'date': datetime(2025, 10, 20, 9, 0),
        'event_type': 'soutenance'
    },
    {
        'title': "Leçon Inaugurale UGANC",
        'description': "Leçon inaugurale marquant la rentrée académique solennelle.",
        'date': datetime(2025, 11, 28, 10, 0),
        'event_type': 'examen'
    },
    {
        'title': "Congés de Fin d'Année 2025",
        'description': "Arrêt temporaire des cours pour les vacances de fin d'année.",
        'date': datetime(2025, 12, 23, 8, 0),
        'event_type': 'inscription'
    },
    {
        'title': "Reprise des Inscriptions & 1ère Semaine Scientifique",
        'description': "Suite et fin des inscriptions. Conférences d'experts et activités de recherche.",
        'date': datetime(2026, 1, 5, 8, 0),
        'event_type': 'inscription'
    },
    {
        'title': "Évaluations de Reprise & Dépôt des Notes (Module 1)",
        'description': "Période d'évaluations de reprise, dépôt, saisie des notes et affichage des résultats du 1er Module.",
        'date': datetime(2026, 2, 16, 8, 0),
        'event_type': 'examen'
    },
    {
        'title': "Délibération des Résultats (Module 1)",
        'description': "Délibération des résultats du 1er Module à la Commission Pédagogique.",
        'date': datetime(2026, 2, 27, 10, 0),
        'event_type': 'examen'
    },
    {
        'title': "Début Cours & Évaluations (Module 2)",
        'description': "Lancement du second module et de la 2ème Semaine Culturelle et Sportive.",
        'date': datetime(2026, 3, 2, 8, 0),
        'event_type': 'inscription'
    },
    {
        'title': "Congés de Pâques",
        'description': "Semaine de congés de Pâques.",
        'date': datetime(2026, 4, 4, 8, 0),
        'event_type': 'inscription'
    },
    {
        'title': "2ème Semaine Scientifique & Animations",
        'description': "Animations scientifiques au niveau des composantes de l'université UGANC.",
        'date': datetime(2026, 4, 13, 9, 0),
        'event_type': 'soutenance'
    },
    {
        'title': "Évaluations de Reprise & Affichage des Résultats (Module 2)",
        'description': "Évaluations de reprise, dépôt, saisie des notes et affichage des résultats du 2nd Module.",
        'date': datetime(2026, 6, 8, 8, 0),
        'event_type': 'examen'
    },
    {
        'title': "Délibération au niveau des Départements",
        'description': "Délibérations départementales des notes du Module 2.",
        'date': datetime(2026, 6, 17, 10, 0),
        'event_type': 'soutenance'
    },
    {
        'title': "Délibération au niveau des Facultés",
        'description': "Délibérations par facultés pour le Module 2.",
        'date': datetime(2026, 6, 19, 10, 0),
        'event_type': 'soutenance'
    },
    {
        'title': "Délibération au Conseil d'Université",
        'description': "Délibérations globales au Conseil d'Université de l'UGANC.",
        'date': datetime(2026, 6, 26, 10, 0),
        'event_type': 'soutenance'
    },
    {
        'title': "Fermeture Annuelle de l'Université",
        'description': "Fermeture officielle de l'université pour les grandes vacances d'été.",
        'date': datetime(2026, 6, 30, 18, 0),
        'event_type': 'inscription'
    }
]

def seed():
    # Clean up student-specific academic calendar events to avoid duplicates
    titles_to_remove = [ev['title'] for ev in CALENDAR_EVENTS]
    deleted = Event.objects.filter(user__isnull=False, title__in=titles_to_remove).delete()
    print(f"Cleaned up {deleted[0]} student-specific academic events to avoid duplicates.")

    created_count = 0
    for ev_data in CALENDAR_EVENTS:
        naive_dt = ev_data['date']
        aware_dt = timezone.make_aware(naive_dt)
        exists = Event.objects.filter(user=None, title=ev_data['title'], date=aware_dt).exists()
        if not exists:
            Event.objects.create(
                user=None, # Global event (visible to all students)
                title=ev_data['title'],
                description=ev_data['description'],
                date=aware_dt,
                event_type=ev_data['event_type']
            )
            created_count += 1
                
    print(f"Successfully seeded {created_count} global academic calendar events.")

if __name__ == '__main__':
    seed()
