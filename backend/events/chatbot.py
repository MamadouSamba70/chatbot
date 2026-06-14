import re
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
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
    
    # 0. Admin NTIC Student Verification Intent
    if user.is_staff:
        # Check if the query is about students, lists, or validation
        is_student_query = False
        if any(k in text for k in [
            'etudiant', 'étudiant', 'etudiants', 'étudiants', 'ntic', 'allowed', 'liste',
            'informatique', 'matricule', 'valider', 'approuver', 'valide', 'approuve',
            'inscrit', 'inscrits'
        ]):
            is_student_query = True

        if is_student_query:
            # 1. Check if they want the full list of all NTIC students
            is_list_request = any(k in text for k in [
                'liste des étudiants', 'liste des etudiants', 'liste etudiant', 'liste etudiants',
                'les etudiants', 'les étudiants', 'les etudiants de ntic', 'les étudiants de ntic',
                'tous les etudiants', 'tous les étudiants', 'affiche les etudiants', 'affiche les étudiants',
                'affiche-moi les etudiants', 'affiche-moi les étudiants', 'montre les etudiants', 'montre les étudiants',
                'qui sont les etudiants', 'qui sont les étudiants', 'les ntic', 'etudiants de ntic', 'étudiants de ntic',
                'tous les inscrits', 'liste de tous'
            ]) or text in ['etudiants', 'étudiants', 'ntic', 'liste', 'inscrits'] or (
                'affiche' in text and ('etudiant' in text or 'étudiant' in text or 'liste' in text)
            )

            # If it is a list request
            if is_list_request:
                from .models import AllowedStudent
                students = AllowedStudent.objects.filter(departement='NTIC').order_by('nom', 'prenom')
                if students.exists():
                    lines = [f"📋 **Il y a {students.count()} étudiants NTIC L3 enregistrés dans la liste officielle :**\n"]
                    for idx, s in enumerate(students, 1):
                        lines.append(f"{idx}. **{s.nom} {s.prenom}** (Matricule: `{s.matricule}`)")
                    reply = "\n".join(lines)
                else:
                    reply = "Aucun étudiant NTIC n'est enregistré dans la liste officielle."
                return {"response": reply}

            # 2. Check if they are asking about a specific student name or matricule
            # Try to find a matricule in the message
            matricule_match = re.search(r'\b\d{8,}\b', text)
            from .models import AllowedStudent
            
            if matricule_match:
                mat = matricule_match.group(0)
                student = AllowedStudent.objects.filter(matricule=mat).first()
                if student:
                    dep_status = "Centre Informatique (département NTIC)" if student.departement == 'NTIC' else student.departement
                    return {"response": f"✅ **Étudiant trouvé dans la liste officielle** :\n\n- **Nom** : {student.nom} {student.prenom}\n- **Matricule** : `{student.matricule}`\n- **Département** : {dep_status}\n- **Niveau** : {student.niveau_licence}"}
                else:
                    return {"response": f"❌ Aucun étudiant avec le matricule `{mat}` n'est dans la liste officielle."}
            
            # Otherwise, extract names (excluding stop words)
            stop_words = {
                'est-ce', 'que', 'est', 'dans', 'ntic', 'de', 'le', 'la', 'les', 'l\'', 'un', 'une', 'qui', 'il', 'elle', 
                'savoir', 'si', 'du', 'centre', 'informatique', 'affiche', 'montre', 'cherche', 'trouve', 'verifier', 
                'verifie', 'valider', 'valide', 'etudiant', 'etudiants', 'étudiant', 'étudiants', 'liste', 'moi', 'je', 
                'veux', 'pour', 'sur', 'dans', 'l', 'd', 's', 'm', 't', 'a'
            }
            words = re.findall(r'\b\w+\b', text)
            search_names = [w.upper() for w in words if w.lower() not in stop_words and len(w) > 2]
            
            if search_names:
                # Search by first name or last name
                q_obj = Q()
                for name in search_names:
                    q_obj |= Q(nom__icontains=name) | Q(prenom__icontains=name)
                
                students = AllowedStudent.objects.filter(q_obj)
                if students.exists():
                    lines = [f"🔍 **Résultats pour '{', '.join(search_names)}' dans la liste officielle :**\n"]
                    for s in students:
                        dep_status = "Centre Informatique (département NTIC)" if s.departement == 'NTIC' else s.departement
                        lines.append(f"- **{s.nom} {s.prenom}** (Matricule: `{s.matricule}`) — {dep_status}")
                    reply = "\n".join(lines)
                else:
                    reply = f"❌ Aucun étudiant correspondant à '{', '.join(search_names)}' n'a été trouvé dans la liste officielle."
                return {"response": reply}

    # 1. Yes / Confirmation to notification prompt
    if text in ['oui', 'ok', 'd\'accord', 'd’accord', 'ouais', 'je veux bien', 'active le rappel', 'confirmer', 'oui merci']:
        event = Event.objects.filter(Q(user=user) | Q(user__isnull=True), date__gte=timezone.now()).order_by('date').first()
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

    # 2. Advice Request
    if any(k in text for k in ['conseil', 'astuce', 'réussir', 'reussir', 'étudier', 'etudier', 'méthode', 'methode', 'conseille', 'conseiller']):
        advices = [
            "📚 **La Méthode Pomodoro** : Étudiez pendant 25 minutes de manière ultra-concentrée, puis faites une pause de 5 minutes. Répétez cela 4 fois, puis prenez une pause plus longue de 15-30 minutes pour recharger vos batteries.",
            "🧠 **Le Rappel Actif (Active Recall)** : Ne vous contentez pas de relire passivement vos cours. Fermez votre cahier et tentez de réécrire de mémoire tout ce dont vous vous rappelez, ou testez-vous avec des flashcards.",
            "📅 **La Répétition Espacée** : Révisez vos leçons à intervalles réguliers (J+1, J+3, J+7, J+30) pour ancrer les concepts dans votre mémoire à long terme.",
            "💤 **Le Sommeil Consolide la Mémoire** : Ne sacrifiez pas votre sommeil, surtout avant un examen. Dormir au moins 7 à 8 heures permet au cerveau d'organiser et de retenir ce que vous avez appris.",
            "🎯 **Planification Proactive** : Enregistrez vos dates importantes sur **ScolarBot** dès le début du semestre pour avoir une vision claire et éviter les révisions de dernière minute dans le stress.",
            "💧 **Hydratation & Environnement** : Travaillez dans un espace calme, bien éclairé, aérez la pièce et gardez une bouteille d'eau à portée de main. Une bonne hydratation améliore la concentration de 15%.",
            "💬 **La Technique Feynman** : Essayez d'expliquer un concept difficile à un camarade de classe (ou à votre bot !) avec des termes très simples. Si vous y parvenez, c'est que vous l'avez vraiment compris."
        ]
        selected = random.sample(advices, 3)
        reply = (
            "💡 **Voici quelques conseils précieux pour booster votre réussite académique :**\n\n"
            + "\n\n".join(selected) +
            "\n\nN'hésitez pas à me demander d'autres conseils si besoin !"
        )
        return {"response": reply}

    # 3. Advanced Date / Event / Deadline Queries
    if any(k in text for k in ['quand', 'date', 'quel jour', 'heure', 'recherche', 'trouve', 'examen de', 'soutenance de', 'inscription de', 'planning', 'calendrier', 'échéance', 'echeance', 'programme', 'prévu', 'prevu', 'liste', 'affiche', 'voir', 'quels', 'quelles', 'prochain', 'prochaine', 'prochains']):
        # Determine event type filter
        event_type_filter = None
        type_label = "échéances"
        if any(k in text for k in ['examen', 'examens', 'devoir', 'devoirs', 'controle', 'contrôle', 'contrôles', 'controles', 'cours']):
            event_type_filter = 'examen'
            type_label = "examens"
        elif any(k in text for k in ['soutenance', 'soutenances', 'projet', 'projets', 'presentation', 'présentation']):
            event_type_filter = 'soutenance'
            type_label = "soutenances"
        elif any(k in text for k in ['inscription', 'inscriptions', 'dossier', 'frais', 'scolarité', 'scolarite']):
            event_type_filter = 'inscription'
            type_label = "inscriptions"

        # Determine timeframe filter
        now = timezone.now()
        start_date = None
        end_date = None
        timeframe_label = ""

        if "aujourd'hui" in text or "aujourdhui" in text:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            timeframe_label = "prévus pour aujourd'hui"
        elif "demain" in text:
            start_date = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            timeframe_label = "prévus pour demain"
        elif "après-demain" in text or "apres-demain" in text or "apres demain" in text:
            start_date = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            timeframe_label = "prévus pour après-demain"
        elif "cette semaine" in text:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=7)
            timeframe_label = "de cette semaine"
        elif "la semaine prochaine" in text:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday()) + timedelta(days=7)
            end_date = start_date + timedelta(days=7)
            timeframe_label = "de la semaine prochaine"
        elif "ce mois-ci" in text or "ce mois" in text:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1)
            timeframe_label = "de ce mois-ci"
        else:
            # check specific month names
            for month_name, month_num in MONTHS.items():
                if month_name in text:
                    start_date = now.replace(month=month_num, day=1, hour=0, minute=0, second=0, microsecond=0)
                    if month_num == 12:
                        end_date = start_date.replace(year=start_date.year + 1, month=1)
                    else:
                        end_date = start_date.replace(month=month_num + 1)
                    timeframe_label = f"en {month_name.capitalize()}"
                    break

        # Base query
        student_events = Event.objects.filter(Q(user=user) | Q(user__isnull=True))

        # Apply timeframe filter
        if start_date and end_date:
            student_events = student_events.filter(date__gte=start_date, date__lt=end_date)
        elif 'prochain' in text or 'prochaine' in text or 'prochains' in text or 'futur' in text:
            # list future events only
            student_events = student_events.filter(date__gte=now)
            timeframe_label = "à venir"

        # Apply event type filter
        if event_type_filter:
            student_events = student_events.filter(event_type=event_type_filter)

        # Apply search word match in title (excluding stop words)
        stop_words = {'quand', 'est', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'le', 'la', 'les', 'de', 'du', 'des', 'd\'', 'l\'', 'un', 'une', 'examen', 'soutenance', 'inscription', 'cours', 'pour', 'quel', 'jour', 'heure', 'recherche', 'trouve', 'liste', 'affiche', 'voir', 'quels', 'quelles', 'prochain', 'prochaine', 'prochains', 'calendrier', 'planning', 'échéance', 'echeance', 'y', 'a', 't', 'il'}
        words = re.findall(r'\b\w+\b', text)
        search_words = [w for w in words if w not in stop_words and len(w) > 2]

        if search_words:
            query_filter = Q()
            for word in search_words:
                query_filter |= Q(title__icontains=word)
            student_events = student_events.filter(query_filter)

        student_events = student_events.order_by('date')

        # Format output response
        if student_events.exists():
            # If search matches exactly one specific event, give the details and offer a reminder
            if student_events.count() == 1:
                matched_event = student_events.first()
                dt_str = matched_event.date.strftime('%d/%m/%Y à %H:%M')
                reply = (
                    f"📅 Votre {matched_event.event_type} **'{matched_event.title}'** est prévu le **{dt_str}**.\n\n"
                    f"👉 *Voulez-vous recevoir une notification de rappel par Email & Push 2 jours avant ?*"
                )
                return {"response": reply}
            else:
                lines = [f"📋 **Voici vos {type_label} {timeframe_label} :**\n"]
                for e in student_events:
                    dt_str = e.date.strftime('%d/%m/%Y à %H:%M')
                    icon = "📝" if e.event_type == 'examen' else "🔗" if e.event_type == 'inscription' else "🎓"
                    lines.append(f"- {icon} **{e.title}** ({e.event_type.capitalize()}) — *{dt_str}*")
                reply = "\n".join(lines)
                return {"response": reply}
        else:
            time_phrase = f" {timeframe_label}" if timeframe_label else ""
            reply = f"🔍 Je n'ai pas trouvé d'événement correspondant{time_phrase} dans votre calendrier. Dites *« Planifie un examen de [matière] »* pour en ajouter un !"
            return {"response": reply}

    # 4. Simple Greetings & Salutations
    if any(k in text for k in ['bonjour', 'bonsoir', 'salut', 'coucou', 'hello', 'hey', 'hi', 'ça va', 'ca va', 'comment tu vas', 'comment vas-tu', 'comment vas tu']):
        name = user.first_name if user.first_name else user.username
        if hasattr(user, 'profile'):
            name = user.profile.prenom
            
        now_hour = timezone.now().hour
        greeting_word = "Bonjour" if (5 <= now_hour < 18) else "Bonsoir"
        
        reply = (
            f"{greeting_word} {name} ! 👋 C'est un plaisir d'échanger avec vous.\n\n"
            f"Je suis **ScolarBot**, votre assistant académique personnel. Comment se passe votre journée ?\n\n"
            f"Je suis là pour vous aider à gérer votre calendrier d'études, lister vos examens ou vous donner des conseils de révision. Que puis-je faire pour vous ?"
        )
        return {"response": reply}

    # 5. Help / Actions List
    if any(k in text for k in ['aide', 'help', 'que sais-tu faire', 'options', 'fonctionnalité', 'fonctionnalités']):
        name = user.first_name if user.first_name else user.username
        if hasattr(user, 'profile'):
            name = user.profile.prenom
            
        reply = (
            f"Besoin d'aide {name} ? ℹ️ Voici tout ce que je peux faire pour vous :\n\n"
            "- 📅 **Consulter vos dates** : Demandez *« Quels sont mes prochains examens ? »*, *« Qu'ai-je de prévu cette semaine ? »*, ou *« Est-ce que j'ai un examen en juin ? »*.\n"
            "- ✍️ **Créer un rappel** : Dites *« Planifie un examen d'Algorithmique pour le 15 juin à 14h »*.\n"
            "- 💡 **Demander des conseils** : Dites *« Donne-moi des conseils d'étude »* ou *« Comment réussir mes examens ? »*.\n"
            "- 👤 **Consulter vos infos** : Dites *« Affiche mes infos »* ou *« Quel est mon département ? »*.\n"
            "- 🎙️ **Mode Vocal** : Parlez-moi en cliquant sur le micro 🎙️ pour une conversation interactive."
        )
        return {"response": reply}

    # 6. Profile Queries
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

    # 7. Create Event intent
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
        
        # Trigger immediate notification
        from .notifications_helper import notify_event_creation
        notify_event_creation(event)
        
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

    # 8. Default Fallback
    reply = (
        "Désolé, je n'ai pas bien compris votre demande. 🤖\n\n"
        "Essayez de me dire :\n"
        "- *« Quels sont mes prochains examens ? »*\n"
        "- *« Planifie une soutenance pour le 20 juin à 10h »*\n"
        "- *« Donne-moi des conseils pour réussir »*\n"
        "- *« Affiche mon profil »*"
    )
    return {"response": reply}
