import os
import logging
import requests
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from .models import Event, Notification, FCMToken

# Firebase Admin SDK imports
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    firebase_initialized = False
except ImportError:
    firebase_initialized = False

logger = logging.getLogger(__name__)

def initialize_firebase():
    global firebase_initialized
    if firebase_initialized:
        return True
    
    cred_path = os.environ.get('FIREBASE_CREDENTIALS')
    if cred_path and os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            logger.info("Firebase SDK initialized successfully.")
            return True
        except Exception as e:
            logger.error(f"Error initializing Firebase SDK: {e}")
    return False

from django.contrib.auth.models import User

def send_email_reminder(event, user):
    subject = f"🔔 Rappel : {event.title} ({event.get_event_type_display()}) arrive bientôt !"
    message = (
        f"Bonjour {user.username},\n\n"
        f"Ceci est un rappel automatique pour l'échéance suivante :\n"
        f"- Événement : {event.title}\n"
        f"- Type : {event.get_event_type_display()}\n"
        f"- Date : {event.date.strftime('%d/%m/%Y à %H:%M')}\n"
        f"- Description : {event.description or 'Aucune description'}\n\n"
        f"Préparez-vous bien !\n"
        f"L'équipe ReminderBot."
    )
    from_email = os.environ.get('DEFAULT_FROM_EMAIL', 'ReminderBot <noreply@reminderbot.com>')
    recipient_list = [user.email] if user.email else []
    
    if not recipient_list:
        logger.warning(f"No email for user {user.username}, email reminder skipped.")
        return False

    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {e}")
        return False

def send_push_reminder(event, user):
    message_text = f"Rappel : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
    
    firebase_ok = initialize_firebase()
    if firebase_ok:
        tokens = FCMToken.objects.filter(user=user).values_list('token', flat=True)
        if tokens:
            try:
                for token in tokens:
                    msg = messaging.Message(
                        notification=messaging.Notification(
                            title=f"🔔 Rappel : {event.title}",
                            body=message_text,
                        ),
                        token=token,
                    )
                    messaging.send(msg)
                return True
            except Exception as e:
                logger.error(f"Error sending Firebase FCM push: {e}")
    
    # Return false if FCM credentials aren't set or send failed (falls back to local notification)
    return False

def send_sms_notification(event, user, message_text):
    """
    Sends an SMS notification using Twilio API if credentials are provided in .env,
    otherwise falls back to a development simulation in the console.
    """
    if not hasattr(user, 'profile') or not user.profile.telephone:
        logger.warning(f"No phone number for user {user.username}, SMS skipped.")
        return False
        
    phone_number = user.profile.telephone
    
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER')
    
    if account_sid and auth_token and from_number:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=message_text,
                from_=from_number,
                to=phone_number
            )
            logger.info(f"SMS successfully sent to {phone_number} via Twilio SID {message.sid}.")
            return True
        except Exception as e:
            logger.error(f"Failed to send Twilio SMS to {phone_number}: {e}")
            return False
    else:
        # Fallback simulation for local development
        print(f"\n[SMS SIMULATION] SMS Envoyé à {phone_number} ({user.first_name} {user.last_name}):")
        print(f"  Contenu : \"{message_text}\"")
        print(f"  (Configurez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans le .env pour un envoi réel)\n")
        return True

def check_and_send_reminders():
    """
    Scans events in SQLite and sends notifications for events happening in <= 3 days.
    """
    now = timezone.now()
    three_days_later = now + timedelta(days=3)
    
    # Get future events happening in the next 3 days
    upcoming_events = Event.objects.filter(date__gt=now, date__lte=three_days_later)
    
    for event in upcoming_events:
        if event.user:
            # 1. Email Reminder
            email_sent = Notification.objects.filter(event=event, user=event.user, channel='email').exists()
            if not email_sent:
                notif = Notification.objects.create(
                    user=event.user,
                    event=event,
                    channel='email',
                    status='pending',
                    message=f"Rappel par email envoyé pour l'événement '{event.title}'"
                )
                success = send_email_reminder(event, event.user)
                if success:
                    notif.status = 'sent'
                    notif.sent_at = timezone.now()
                else:
                    notif.status = 'failed'
                notif.save()
                
            # 2. Push Reminder
            push_sent = Notification.objects.filter(event=event, user=event.user, channel='push').exists()
            if not push_sent:
                notif = Notification.objects.create(
                    user=event.user,
                    event=event,
                    channel='push',
                    status='pending',
                    message=f"Rappel push : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
                )
                success = send_push_reminder(event, event.user)
                # We set status='sent' anyway for display in the local dashboard notifications center
                notif.status = 'sent'
                notif.sent_at = timezone.now()
                notif.save()

            # 3. SMS Reminder
            sms_sent = Notification.objects.filter(event=event, user=event.user, channel='sms').exists()
            if not sms_sent:
                notif = Notification.objects.create(
                    user=event.user,
                    event=event,
                    channel='sms',
                    status='pending',
                    message=f"Rappel SMS : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
                )
                success = send_sms_notification(
                    event, 
                    event.user, 
                    f"Rappel : Votre {event.get_event_type_display()} '{event.title}' commence le {event.date.strftime('%d/%m/%Y à %H:%M')}."
                )
                if success:
                    notif.status = 'sent'
                    notif.sent_at = timezone.now()
                else:
                    notif.status = 'failed'
                notif.save()
        else:
            # Global event: Send to all registered students
            students = User.objects.filter(is_staff=False)
            for student in students:
                # 1. Email Reminder
                email_sent = Notification.objects.filter(event=event, user=student, channel='email').exists()
                if not email_sent:
                    notif = Notification.objects.create(
                        user=student,
                        event=event,
                        channel='email',
                        status='pending',
                        message=f"Rappel par email envoyé pour l'événement '{event.title}'"
                    )
                    success = send_email_reminder(event, student)
                    if success:
                        notif.status = 'sent'
                        notif.sent_at = timezone.now()
                    else:
                        notif.status = 'failed'
                    notif.save()
                    
                # 2. Push Reminder
                push_sent = Notification.objects.filter(event=event, user=student, channel='push').exists()
                if not push_sent:
                    notif = Notification.objects.create(
                        user=student,
                        event=event,
                        channel='push',
                        status='pending',
                        message=f"Rappel push : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
                    )
                    success = send_push_reminder(event, student)
                    notif.status = 'sent'
                    notif.sent_at = timezone.now()
                    notif.save()

                # 3. SMS Reminder
                sms_sent = Notification.objects.filter(event=event, user=student, channel='sms').exists()
                if not sms_sent:
                    notif = Notification.objects.create(
                        user=student,
                        event=event,
                        channel='sms',
                        status='pending',
                        message=f"Rappel SMS : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
                    )
                    success = send_sms_notification(
                        event, 
                        student, 
                        f"Rappel : Votre {event.get_event_type_display()} '{event.title}' commence le {event.date.strftime('%d/%m/%Y à %H:%M')}."
                    )
                    if success:
                        notif.status = 'sent'
                        notif.sent_at = timezone.now()
                    else:
                        notif.status = 'failed'
                    notif.save()

# Scheduler setup
from apscheduler.schedulers.background import BackgroundScheduler

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Check every 30 seconds for local dev testing
    scheduler.add_job(check_and_send_reminders, 'interval', seconds=30, id='check_reminders_job', replace_existing=True)
    scheduler.start()
    print("[Scheduler] APScheduler started. Checking reminders every 30 seconds.")
