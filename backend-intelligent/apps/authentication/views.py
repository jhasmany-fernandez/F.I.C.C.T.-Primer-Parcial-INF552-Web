import logging
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

logger = logging.getLogger(__name__)

from .serializers import (
    RegisterSerializer,
    FaceLoginSerializer,
    PasswordLoginSerializer,
    UserSerializer,
    TokenSerializer
)
from .utils import FaceRecognitionService, get_client_ip
from .models import FaceRecognitionLog

User = get_user_model()


class RegisterView(APIView):
    """
    User registration with facial recognition

    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @swagger_auto_schema(
        request_body=RegisterSerializer,
        responses={
            201: TokenSerializer,
            400: 'Bad Request'
        }
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = serializer.save()

        # Register face in face recognition service
        face_image_base64 = request.data.get('face_image_base64', '')

        # Remove data URI prefix if present
        if 'data:image' in face_image_base64:
            face_image_base64 = face_image_base64.split(',')[1]

        success, face_id, error = FaceRecognitionService.register_face(
            face_image_base64,
            str(user.id)
        )

        # Log the face registration attempt
        FaceRecognitionLog.objects.create(
            user=user,
            action='register',
            success=success,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        if success:
            # Update user with face registration info
            user.face_id = face_id
            user.face_registered = True
            user.face_registered_at = timezone.now()
            user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'message': 'User registered successfully with facial recognition'
            }, status=status.HTTP_201_CREATED)
        else:
            # Face registration failed, but user is created
            # In development, allow login without face recognition
            logger.warning(f"Face registration failed for user {user.id}: {error}")

            # Generate JWT tokens anyway (development mode)
            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'warning': 'Face recognition service unavailable',
                'detail': 'User registered successfully but facial recognition is not available',
                'message': 'User registered successfully (face recognition disabled)'
            }, status=status.HTTP_201_CREATED)


class FaceLoginView(APIView):
    """
    Login using facial recognition

    POST /api/auth/login/face/
    """
    permission_classes = [AllowAny]
    serializer_class = FaceLoginSerializer

    @swagger_auto_schema(
        request_body=FaceLoginSerializer,
        responses={
            200: TokenSerializer,
            401: 'Unauthorized',
            404: 'Face not found'
        }
    )
    def post(self, request):
        serializer = FaceLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        face_image_base64 = serializer.validated_data['face_image_base64']

        # Remove data URI prefix if present
        if 'data:image' in face_image_base64:
            face_image_base64 = face_image_base64.split(',')[1]

        # Search face in recognition service
        success, user_id, similarity, error = FaceRecognitionService.search_face(
            face_image_base64,
            threshold=0.7  # 70% similarity threshold
        )

        if success and user_id:
            try:
                # Find user by face_id
                user = User.objects.get(id=user_id, face_registered=True)

                # Log successful face login
                FaceRecognitionLog.objects.create(
                    user=user,
                    action='login',
                    success=True,
                    similarity_score=similarity,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )

                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'similarity': similarity,
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                # Log failed attempt
                FaceRecognitionLog.objects.create(
                    user=None,
                    action='login',
                    success=False,
                    similarity_score=similarity,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )

                return Response({
                    'error': 'User not found',
                    'message': 'Face recognized but user account not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # Log failed attempt
            FaceRecognitionLog.objects.create(
                user=None,
                action='login',
                success=False,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response({
                'error': 'Face not recognized',
                'detail': error,
                'message': 'No matching face found. Please try again or use password login.'
            }, status=status.HTTP_401_UNAUTHORIZED)


class PasswordLoginView(APIView):
    """
    Traditional login using email and password

    POST /api/auth/login/password/
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordLoginSerializer

    @swagger_auto_schema(
        request_body=PasswordLoginSerializer,
        responses={
            200: TokenSerializer,
            401: 'Invalid credentials'
        }
    )
    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Authenticate user
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials',
                    'message': 'Email or password is incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid credentials',
                'message': 'Email or password is incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update current authenticated user

    GET /api/auth/me/
    PUT/PATCH /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """
    Logout user (blacklist refresh token)

    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token')
            }
        ),
        responses={
            200: 'Logged out successfully',
            400: 'Bad Request'
        }
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
