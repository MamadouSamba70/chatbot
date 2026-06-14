from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Event, Notification, FCMToken
from .serializers import (
    UserSerializer, 
    EventSerializer, 
    NotificationSerializer, 
    StudentSerializer, 
    MyTokenObtainPairSerializer
)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # If admin, return all events. If student, return only their own and global ones.
        if self.request.user.is_staff:
            return Event.objects.all().order_by('date')
        from django.db.models import Q
        return Event.objects.filter(Q(user=self.request.user) | Q(user__isnull=True)).order_by('date')

    def perform_create(self, serializer):
        # If admin, link the event to the selected student (user_id).
        # Otherwise, link it to the logged-in student.
        event = None
        if self.request.user.is_staff:
            user_id = self.request.data.get('user_id')
            if user_id:
                try:
                    target_user = User.objects.get(id=user_id)
                    event = serializer.save(user=target_user)
                except User.DoesNotExist:
                    event = serializer.save(user=self.request.user)
            else:
                # If admin creates an event without user_id, it is a global event.
                event = serializer.save(user=None)
        else:
            event = serializer.save(user=self.request.user)

        # Trigger immediate SMS notifications for the created event
        if event:
            from .notifications_helper import notify_event_creation
            notify_event_creation(event)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # If admin, show all notifications. If student, show only their own.
        if self.request.user.is_staff:
            return Notification.objects.all().order_by('-created_at')
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class RegisterFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        fcm_token, created = FCMToken.objects.get_or_create(
            user=request.user,
            token=token
        )
        return Response({"success": "Token FCM enregistré avec succès"}, status=status.HTTP_201_CREATED)

from rest_framework.decorators import action

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = StudentSerializer

    def get_queryset(self):
        # List all users who are students (not staff / superusers) and select profiles in join
        return User.objects.filter(is_staff=False).select_related('profile').order_by('username')

    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_students = self.get_queryset().filter(is_active=False)
        serializer = self.get_serializer(pending_students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        student = self.get_object()
        student.is_active = True
        student.save()
        if hasattr(student, 'profile'):
            student.profile.is_approved = True
            student.profile.save()
        return Response({"success": f"L'etudiant {student.username} a ete approuve avec succes."})

    @action(detail=True, methods=['post', 'delete'])
    def reject(self, request, pk=None):
        student = self.get_object()
        username = student.username
        student.delete()
        return Response({"success": f"L'etudiant {username} a ete rejete et supprime."})

from .chatbot import process_chatbot_message

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '')
        if not message:
            return Response({"error": "Message requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        response_data = process_chatbot_message(request.user, message)
        return Response(response_data, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
        if hasattr(user, 'profile'):
            data.update({
                "nom": user.profile.nom,
                "prenom": user.profile.prenom,
                "matricule": user.profile.matricule,
                "sexe": user.profile.sexe,
                "universite": user.profile.universite,
                "faculte": user.profile.faculte,
                "departement": user.profile.departement,
                "telephone": user.profile.telephone,
                "niveau_licence": user.profile.niveau_licence,
            })
        else:
            data.update({
                "nom": user.last_name,
                "prenom": user.first_name,
                "matricule": user.username,
                "sexe": "M",
                "universite": "UGANC",
                "faculte": "",
                "departement": "",
                "telephone": "",
                "niveau_licence": "Licence 1",
            })
        return Response(data)

    def put(self, request):
        user = request.user
        email = request.data.get('email', user.email)
        user.email = email
        password = request.data.get('password')
        if password:
            user.set_password(password)
        
        nom = request.data.get('nom', user.last_name)
        prenom = request.data.get('prenom', user.first_name)
        user.first_name = prenom
        user.last_name = nom
        user.save()

        if hasattr(user, 'profile'):
            profile = user.profile
            profile.nom = nom
            profile.prenom = prenom
            profile.sexe = request.data.get('sexe', profile.sexe)
            profile.universite = request.data.get('universite', profile.universite)
            profile.faculte = request.data.get('faculte', profile.faculte)
            profile.departement = request.data.get('departement', profile.departement)
            profile.telephone = request.data.get('telephone', profile.telephone)
            profile.niveau_licence = request.data.get('niveau_licence', profile.niveau_licence)
            profile.save()
        
        return Response({"success": "Profil mis à jour avec succès"})
