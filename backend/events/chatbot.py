import re
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Event, StudentProfile, Notification

MONTHS = {
    'janvier': 1, 'fevrier': 2, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5,
    'juin': 6, 'juillet': 7, 'aout': 8, 'août': 8, 'septembre': 9, 'octobre': 10,
    'novembre': 11, 'decembre': 12, 'décembre': 12
}

def parse_date_expression(text):
    now = timezone.now()
    target_dt = now + timedelta(days=1)
    target_dt = target_dt.replace(hour=9, minute=0, second=0, microsecond=0)
    
    # Try to extract time (e.g. "à 14h30", "a 10h", "vers 15:00")
    time_match = re.search(r'(?:à|a|vers)\s*(\d{1,2})(?:h|:)(\d{2})?', text, re.IGNORECASE)
    hour = 9
    minute = 0
    if time_match:
        hour = int(time_match.group(1))
        if time_match.group(2):
            minute = int(time_match.group(2))
            
    # Check "demain"
    if 'demain' in text.lower():
        target_dt = now + timedelta(days=1)
        return target_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
    # Check "après-demain"
    if 'apres-demain' in text.lower() or 'après-demain' in text.lower() or 'apres demain' in text.lower():
        target_dt = now + timedelta(days=2)
        return target_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

    # Check "aujourd'hui"
    if "aujourd'hui" in text.lower() or "aujourdhui" in text.lower():
        target_dt = now
        return target_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)

    # Check format: DD/MM/YYYY or DD-MM-YYYY
    date_digits = re.search(r'(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?', text)
    if date_digits:
        day = int(date_digits.group(1))
        month = int(date_digits.group(2))
        year = now.year
        if date_digits.group(3):
            yr = date_digits.group(3)
            if len(yr) == 2:
                year = 2000 + int(yr)
            else:
                year = int(yr)
        try:
            return timezone.make_aware(datetime(year, month, day, hour, minute))
        except ValueError:
            pass

    # Check format: DD [month name]
    for month_name, month_num in MONTHS.items():
        month_match = re.search(rf'(\d{1,2})\s*{month_name}', text, re.IGNORECASE)
        if month_match:
            day = int(month_match.group(1))
            year = now.year
            try:
                candidate = timezone.make_aware(datetime(year, month_num, day, hour, minute))
                if candidate < now:
                    candidate = candidate.replace(year=year + 1)
                return candidate
            except ValueError:
                pass
                
    return target_dt

def process_chatbot_message(user, message_text):
    text = message_text.lower().strip()
    
    # 1. Yes / Confirmation to notification prompt
    if text in ['oui', 'ok', 'd\'accord', 'd’accord', 'ouais', 'je veux bien', 'active le rappel', 'confirmer', 'oui merci']:
        event = Event.objects.filter(user=user, date__gte=timezone.now()).order_by('date').first()
        if event:
            # Check if notification already exists to avoid duplicates
            exists = Notification.objects.filter(user=user, event=event, message__contains="2 jours").exists()
            if not exists:
                Notification.objects.create(
                    user=user,
                    event=event,
                    channel='email',
                    status='pending',
                    message=f"Rappel automatique : Votre {event.event_type} '{event.title}' commencera dans 2 jours (le {event.date.strftime('%d/%m/%Y à %H:%M')})."
                )
                Notification.objects.create(
                    user=user,
                    event=event,
                    channel='push',
                    status='pending',
                    message=f"Rappel automatique : Votre {event.event_type} '{event.title}' commencera dans 2 jours (le {event.date.strftime('%d/%m/%Y à %H:%M')})."
                )
            return {
                "response": f"🔔 **Rappel programmé !**\n\nJ'ai configuré un rappel automatique par **Email** et **Notification Push** 2 jours avant votre événement **'{event.title}'** (prévu le {event.date.strftime('%d/%m/%Y à %H:%M')}).",
                "action": "notification_created"
            }
        else:
            return {"response": "Je n'ai pas trouvé d'échéance future pour laquelle programmer un rappel. Voulez-vous en planifier une ?"}

    # 2. Specific Event Query: "Quand est mon examen de réseaux ?" / search
    if any(k in text for k in ['quand', 'date', 'quel jour', 'heure', 'recherche', 'trouve', 'examen de', 'soutenance de', 'inscription de']):
        stop_words = {'quand', 'est', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'le', 'la', 'les', 'de', 'du', 'des', 'd\'', 'l\'', 'un', 'une', 'examen', 'soutenance', 'inscription', 'cours', 'pour', 'quel', 'jour', 'heure'}
        words = re.findall(r'\b\w+\b', text)
        search_words = [w for w in words if w not in stop_words and len(w) > 2]
        
        matched_event = None
        student_events = Event.objects.filter(user=user)
        
        if search_words:
            for word in search_words:
                matched_event = student_events.filter(title__icontains=word).first()
                if matched_event:
                    break
        
        if not matched_event and 'prochain' in text:
            matched_event = student_events.filter(date__gte=timezone.now()).order_by('date').first()
            
        if matched_event:
            dt_str = matched_event.date.strftime('%d/%m/%Y à %H:%M')
            reply = (
                f"📅 Votre {matched_event.event_type} **'{matched_event.title}'** est prévu le **{dt_str}**.\n\n"
                f"👉 *Voulez-vous recevoir une notification de rappel par Email & Push 2 jours avant ?*"
            )
            return {"response": reply}
        else:
            reply = "🔍 Je n'ai pas trouvé d'événement correspondant dans votre calendrier. Dites *« Planifie un examen de [matière] »* pour en ajouter un !"
            return {"response": reply}

    # 3. Greetings & Help
    if any(k in text for k in ['bonjour', 'salut', 'coucou', 'hello', 'hey', 'hi', 'aide', 'help', 'que sais-tu faire', 'options']):
        name = user.first_name if user.first_name else user.username
        if hasattr(user, 'profile'):
            name = user.profile.prenom
            
        reply = (
            f"Bonjour {name} ! 👋 Je suis **ReminderBot**, votre assistant académique.\n\n"
            "Voici ce que je peux faire pour vous :\n"
            "- 📅 **Lister vos échéances** : Demandez *« Quels sont mes prochains examens ? »* ou *« Affiche mes échéances »*.\n"
            "- ✍️ **Créer un rappel** : Dites *« Planifie un examen d'Algorithmique pour le 15 juin à 14h »*.\n"
            "- 👤 **Consulter vos infos** : Dites *« Affiche mes infos »* ou *« Quel est mon département ? »*.\n"
            "- ℹ️ **Aide** : Dites simplement *« Aide »*."
        )
        return {"response": reply}

    # 4. Profile Queries
    if any(k in text for k in ['profil', 'mes infos', 'qui suis-je', 'departement', 'département', 'université', 'universite', 'faculté', 'faculte', 'matricule']):
        if hasattr(user, 'profile'):
            profile = user.profile
            reply = (
                f"👤 **Vos Informations Académiques :**\n\n"
                f"- **Nom complet** : {profile.prenom} {profile.nom}\n"
                f"- **Matricule** : `{profile.matricule}`\n"
                f"- **Genre** : {'Masculin' if profile.sexe == 'M' else 'Féminin'}\n"
                f"- **Université** : {profile.universite}\n"
                f"- **Faculté** : {profile.faculte}\n"
                f"- **Département** : {profile.departement}\n"
                f"- **E-mail** : {user.email}"
            )
        else:
            reply = f"👤 Vous êtes connecté en tant qu'administrateur (**{user.username}**)."
        return {"response": reply}

    # 5. Create Event intent
    if any(k in text for k in ['crée', 'cree', 'ajoute', 'planifie', 'rappelle', 'programme', 'nouveau', 'nouvelle', 'ajouter']):
        event_type = 'examen'
        if 'inscription' in text:
            event_type = 'inscription'
        elif 'soutenance' in text:
            event_type = 'soutenance'
            
        title = "Événement sans titre"
        title_match = re.search(r'(?:d\'|de\s+|l\'|le\s+|la\s+|un\s+|une\s+|mon\s+|ma\s+)([^,.]+?)(?:\s+pour\s+|\s+le\s+|\s+le\d|\s+à\s+|\s+demain|\s+apres)', text)
        if title_match:
            title_candidate = title_match.group(1).strip()
            title = title_candidate[0].upper() + title_candidate[1:]
        else:
            cleaned = re.sub(r'(crée|cree|ajoute|planifie|rappelle-moi|rappelle|programme|nouveau|nouvelle|un|une|l\'|le|la)', '', text, flags=re.IGNORECASE).strip()
            split_cleaned = re.split(r'(pour|le|à|a|vers|demain)', cleaned)
            if len(split_cleaned) > 0 and split_cleaned[0].strip():
                title = split_cleaned[0].strip().capitalize()
                
        event_date = parse_date_expression(text)
        
        event = Event.objects.create(
            user=user,
            title=title,
            description="Créé par l'assistant ReminderBot",
            date=event_date,
            event_type=event_type
        )
        
        reply = (
            f"✅ **Échéance planifiée avec succès !**\n\n"
            f"- **Type** : {event_type.capitalize()}\n"
            f"- **Titre** : {title}\n"
            f"- **Date** : {event_date.strftime('%d/%m/%Y à %H:%M')}\n\n"
            f"Je vous enverrai un rappel 3 jours avant cette date."
        )
        return {
            "response": reply,
            "action": "event_created",
            "event": {
                "id": event.id,
                "title": event.title,
                "event_type": event.event_type,
                "date": event.date.isoformat(),
                "user": user.username
            }
        }

    # 6. List Events intent
    if any(k in text for k in ['liste', 'affiche', 'voir', 'quels', 'quelles', 'prochain', 'prochaine', 'prochains', 'échéance', 'echeance', 'examen', 'inscription', 'soutenance', 'tâche', 'tache', 'calendrier']):
        if user.is_staff:
            events_count = Event.objects.all().count()
            reply = f"📋 En tant qu'administrateur, il y a **{events_count}** échéances globales programmées dans le système."
            return {"response": reply}
            
        student_events = Event.objects.filter(user=user).order_by('date')
        if student_events.exists():
            lines = ["📋 **Vos Échéances Planifiées :**\n"]
            for e in student_events:
                dt_str = e.date.strftime('%d/%m/%Y à %H:%M')
                icon = "📝" if e.event_type == 'examen' else "🔗" if e.event_type == 'inscription' else "🎓"
                lines.append(f"- {icon} **{e.title}** ({e.event_type.capitalize()}) — *{dt_str}*")
            reply = "\n".join(lines)
        else:
            reply = "🔍 Vous n'avez aucune échéance programmée pour le moment. Dites *« Planifie un examen de... »* pour en ajouter une !"
        return {"response": reply}

    # 7. Default Fallback
    reply = (
        "Désolé, je n'ai pas bien compris votre demande. 🤖\n\n"
        "Essayez de me dire :\n"
        "- *« Quels sont mes prochains examens ? »*\n"
        "- *« Planifie une soutenance pour le 20 juin à 10h »*\n"
        "- *« Affiche mon profil »*"
    )
    return {"response": reply}
