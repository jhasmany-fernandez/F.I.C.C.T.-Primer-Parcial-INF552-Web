from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    FaceLoginView,
    PasswordLoginView,
    CurrentUserView,
    LogoutView
)

app_name = 'authentication'

urlpatterns = [
    # Registration
    path('register/', RegisterView.as_view(), name='register'),

    # Login endpoints
    path('login/face/', FaceLoginView.as_view(), name='face-login'),
    path('login/password/', PasswordLoginView.as_view(), name='password-login'),

    # Token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # User management
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
