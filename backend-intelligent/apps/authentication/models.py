from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class User(AbstractUser):
    """
    Custom User model with facial recognition support
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True, null=True)

    # Face recognition fields
    face_id = models.CharField(
        _('face recognition ID'),
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text=_('ID returned by face recognition service')
    )
    face_image = models.ImageField(
        _('face image'),
        upload_to='faces/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text=_('Stored face image for recognition')
    )
    face_registered = models.BooleanField(
        _('face registered'),
        default=False,
        help_text=_('Whether facial recognition is enabled for this user')
    )
    face_registered_at = models.DateTimeField(
        _('face registered at'),
        blank=True,
        null=True
    )

    # Additional fields
    is_verified = models.BooleanField(_('verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'
        return full_name.strip()


class FaceRecognitionLog(models.Model):
    """
    Log of face recognition attempts (for security and debugging)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='face_logs',
        blank=True,
        null=True
    )
    action = models.CharField(
        max_length=50,
        choices=[
            ('register', _('Register')),
            ('login', _('Login')),
            ('verify', _('Verify')),
        ]
    )
    success = models.BooleanField(default=False)
    similarity_score = models.FloatField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('face recognition log')
        verbose_name_plural = _('face recognition logs')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} - {self.user} - {self.created_at}'
