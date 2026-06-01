from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    EventViewSet, 
    NotificationViewSet, 
    RegisterFCMTokenView, 
    StudentViewSet,
    MyTokenObtainPairView,
    ChatbotView
)

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'students', StudentViewSet, basename='student')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/fcm-token/', RegisterFCMTokenView.as_view(), name='register_fcm_token'),
    
    # Chatbot endpoint
    path('chat/', ChatbotView.as_view(), name='chatbot_chat'),
    
    # API resources
    path('', include(router.urls)),
]
