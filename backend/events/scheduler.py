import os
import logging
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

def send_email_reminder(event):
    subject = f"🔔 Rappel : {event.title} ({event.get_event_type_display()}) arrive bientôt !"
    message = (
        f"Bonjour {event.user.username},\n\n"
        f"Ceci est un rappel automatique pour l'échéance suivante :\n"
        f"- Événement : {event.title}\n"
        f"- Type : {event.get_event_type_display()}\n"
        f"- Date : {event.date.strftime('%d/%m/%Y à %H:%M')}\n"
        f"- Description : {event.description or 'Aucune description'}\n\n"
        f"Préparez-vous bien !\n"
        f"L'équipe ReminderBot."
    )
    from_email = os.environ.get('DEFAULT_FROM_EMAIL', 'ReminderBot <noreply@reminderbot.com>')
    recipient_list = [event.user.email] if event.user.email else []
    
    if not recipient_list:
        logger.warning(f"No email for user {event.user.username}, email reminder skipped.")
        return False

    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {event.user.email}: {e}")
        return False

def send_push_reminder(event):
    message_text = f"Rappel : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
    
    firebase_ok = initialize_firebase()
    if firebase_ok:
        tokens = FCMToken.objects.filter(user=event.user).values_list('token', flat=True)
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

def check_and_send_reminders():
    """
    Scans events in SQLite and sends notifications for events happening in <= 3 days.
    """
    now = timezone.now()
    three_days_later = now + timedelta(days=3)
    
    # Get future events happening in the next 3 days
    upcoming_events = Event.objects.filter(date__gt=now, date__lte=three_days_later)
    
    for event in upcoming_events:
        # 1. Email Reminder
        email_sent = Notification.objects.filter(event=event, channel='email').exists()
        if not email_sent:
            notif = Notification.objects.create(
                user=event.user,
                event=event,
                channel='email',
                status='pending',
                message=f"Rappel par email envoyé pour l'événement '{event.title}'"
            )
            success = send_email_reminder(event)
            if success:
                notif.status = 'sent'
                notif.sent_at = timezone.now()
            else:
                notif.status = 'failed'
            notif.save()
            
        # 2. Push Reminder
        push_sent = Notification.objects.filter(event=event, channel='push').exists()
        if not push_sent:
            notif = Notification.objects.create(
                user=event.user,
                event=event,
                channel='push',
                status='pending',
                message=f"Rappel push : {event.title} ({event.get_event_type_display()}) est prévu le {event.date.strftime('%d/%m/%Y à %H:%M')} !"
            )
            success = send_push_reminder(event)
            # We set status='sent' anyway for display in the local dashboard notifications center
            notif.status = 'sent'
            notif.sent_at = timezone.now()
            notif.save()

# Scheduler setup
from apscheduler.schedulers.background import BackgroundScheduler

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Check every 30 seconds for local dev testing
    scheduler.add_job(check_and_send_reminders, 'interval', seconds=30, id='check_reminders_job', replace_existing=True)
    scheduler.start()
    print("[Scheduler] APScheduler started. Checking reminders every 30 seconds.")
