import logging
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Notification
from .scheduler import send_sms_notification

logger = logging.getLogger(__name__)

def notify_event_creation(event):
    """
    Sends an immediate SMS notification to students when a new event is created.
    """
    message_text = f"Nouveau : L'événement {event.get_event_type_display()} '{event.title}' a été planifié pour le {event.date.strftime('%d/%m/%Y à %H:%M')}."

    if event.user:
        # Student-specific event
        exists = Notification.objects.filter(event=event, user=event.user, channel='sms', message__startswith="Nouveau :").exists()
        if not exists:
            notif = Notification.objects.create(
                user=event.user,
                event=event,
                channel='sms',
                status='pending',
                message=message_text
            )
            success = send_sms_notification(event, event.user, message_text)
            if success:
                notif.status = 'sent'
                notif.sent_at = timezone.now()
            else:
                notif.status = 'failed'
            notif.save()
    else:
        # Global event: Send SMS to all students
        students = User.objects.filter(is_staff=False)
        for student in students:
            exists = Notification.objects.filter(event=event, user=student, channel='sms', message__startswith="Nouveau :").exists()
            if not exists:
                notif = Notification.objects.create(
                    user=student,
                    event=event,
                    channel='sms',
                    status='pending',
                    message=message_text
                )
                success = send_sms_notification(event, student, message_text)
                if success:
                    notif.status = 'sent'
                    notif.sent_at = timezone.now()
                else:
                    notif.status = 'failed'
                notif.save()
