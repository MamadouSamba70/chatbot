from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event, Notification, FCMToken, StudentProfile, AllowedStudent
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['is_staff'] = self.user.is_staff
        data['is_superuser'] = self.user.is_superuser
        data['email'] = self.user.email
        
        if hasattr(self.user, 'profile'):
            data['nom'] = self.user.profile.nom
            data['prenom'] = self.user.profile.prenom
            data['matricule'] = self.user.profile.matricule
        else:
            data['nom'] = self.user.last_name
            data['prenom'] = self.user.first_name
            data['matricule'] = self.user.username
            
        return data

class StudentSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(source='profile.nom')
    prenom = serializers.CharField(source='profile.prenom')
    matricule = serializers.CharField(source='profile.matricule')
    sexe = serializers.CharField(source='profile.sexe')
    universite = serializers.CharField(source='profile.universite')
    faculte = serializers.CharField(source='profile.faculte')
    departement = serializers.CharField(source='profile.departement')
    telephone = serializers.CharField(source='profile.telephone', required=False, allow_blank=True, default='')
    niveau_licence = serializers.CharField(source='profile.niveau_licence', required=False, default='Licence 1')
    is_approved = serializers.BooleanField(source='profile.is_approved', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined', 'nom', 'prenom', 'matricule', 'sexe', 'universite', 'faculte', 'departement', 'telephone', 'niveau_licence', 'is_approved', 'is_active', 'password')
        read_only_fields = ('username', 'date_joined')

    def validate(self, attrs):
        profile = attrs.get('profile', {})
        matricule = profile.get('matricule')
        if matricule and not AllowedStudent.objects.filter(matricule=matricule).exists():
            raise serializers.ValidationError({"matricule": "Erreur de matricule : ce matricule ne figure pas dans la liste officielle des étudiants autorisés."})
        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        password = validated_data.pop('password', 'Password123!')
        
        matricule = profile_data.get('matricule')
        email = validated_data.get('email')
        
        user = User.objects.create_user(
            username=matricule,
            email=email,
            password=password,
            first_name=profile_data.get('prenom', ''),
            last_name=profile_data.get('nom', '')
        )
        
        StudentProfile.objects.create(
            user=user,
            **profile_data
        )
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        instance.email = validated_data.get('email', instance.email)
        if password:
            instance.set_password(password)
            
        if profile_data:
            if 'matricule' in profile_data:
                instance.username = profile_data['matricule']
            instance.first_name = profile_data.get('prenom', instance.first_name)
            instance.last_name = profile_data.get('nom', instance.last_name)
            
        instance.save()
        
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    nom = serializers.CharField(write_only=True)
    prenom = serializers.CharField(write_only=True)
    matricule = serializers.CharField(write_only=True)
    sexe = serializers.CharField(write_only=True)
    universite = serializers.CharField(write_only=True)
    faculte = serializers.CharField(write_only=True)
    departement = serializers.CharField(write_only=True)
    telephone = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    niveau_licence = serializers.CharField(write_only=True, required=False, default='Licence 1')

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'nom', 'prenom', 'matricule', 'sexe', 'universite', 'faculte', 'departement', 'telephone', 'niveau_licence')

    def validate(self, attrs):
        matricule = attrs.get('matricule')
        if matricule and not AllowedStudent.objects.filter(matricule=matricule).exists():
            raise serializers.ValidationError({"matricule": "Erreur de matricule : ce matricule ne figure pas dans la liste officielle des étudiants autorisés."})
        return attrs

    def create(self, validated_data):
        nom = validated_data.pop('nom')
        prenom = validated_data.pop('prenom')
        matricule = validated_data.pop('matricule')
        sexe = validated_data.pop('sexe')
        universite = validated_data.pop('universite')
        faculte = validated_data.pop('faculte')
        departement = validated_data.pop('departement')
        telephone = validated_data.pop('telephone', '')
        niveau_licence = validated_data.pop('niveau_licence', 'Licence 1')

        user = User.objects.create_user(
            username=matricule,
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=prenom,
            last_name=nom
        )
        user.is_active = False
        user.save()

        StudentProfile.objects.create(
            user=user,
            nom=nom,
            prenom=prenom,
            matricule=matricule,
            sexe=sexe,
            universite=universite,
            faculte=faculte,
            departement=departement,
            telephone=telephone,
            niveau_licence=niveau_licence,
            is_approved=False
        )
        return user

class EventSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Event
        fields = ('id', 'user', 'user_id', 'title', 'description', 'date', 'event_type', 'created_at', 'updated_at')

class NotificationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_type = serializers.CharField(source='event.event_type', read_only=True)
    recipient_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'event', 'event_title', 'event_type', 'recipient_username', 'channel', 'status', 'message', 'sent_at', 'created_at')
