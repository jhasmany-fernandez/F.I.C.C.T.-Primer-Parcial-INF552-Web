from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
import base64
from django.core.files.base import ContentFile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'face_registered', 'is_verified', 'created_at'
        )
        read_only_fields = ('id', 'face_registered', 'is_verified', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with facial recognition"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    face_image_base64 = serializers.CharField(
        write_only=True,
        required=True,
        help_text=_('Base64 encoded face image')
    )

    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'face_image_base64'
        )

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': _('Password fields didn\'t match.')
            })
        return attrs

    def validate_face_image_base64(self, value):
        """Validate and decode base64 image"""
        try:
            # Remove data URI prefix if present
            if 'data:image' in value:
                value = value.split(',')[1]

            # Validate base64
            base64.b64decode(value)
            return value
        except Exception:
            raise serializers.ValidationError(_('Invalid base64 image format'))

    def create(self, validated_data):
        """Create user with facial recognition"""
        # Remove password_confirm and face_image_base64 from validated_data
        validated_data.pop('password_confirm')
        face_image_base64 = validated_data.pop('face_image_base64')

        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
        )

        # Decode and save face image
        if face_image_base64:
            # Remove data URI prefix if present
            if 'data:image' in face_image_base64:
                face_image_base64 = face_image_base64.split(',')[1]

            image_data = base64.b64decode(face_image_base64)
            image_file = ContentFile(image_data, name=f'{user.id}_face.jpg')
            user.face_image = image_file
            user.save()

        return user


class FaceLoginSerializer(serializers.Serializer):
    """Serializer for face recognition login"""
    face_image_base64 = serializers.CharField(
        required=True,
        help_text=_('Base64 encoded face image for login')
    )

    def validate_face_image_base64(self, value):
        """Validate and decode base64 image"""
        try:
            # Remove data URI prefix if present
            if 'data:image' in value:
                value = value.split(',')[1]

            # Validate base64
            base64.b64decode(value)
            return value
        except Exception:
            raise serializers.ValidationError(_('Invalid base64 image format'))


class PasswordLoginSerializer(serializers.Serializer):
    """Serializer for traditional email/password login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )


class TokenSerializer(serializers.Serializer):
    """Serializer for JWT tokens"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
