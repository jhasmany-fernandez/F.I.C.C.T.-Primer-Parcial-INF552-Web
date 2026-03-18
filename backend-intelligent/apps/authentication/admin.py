from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, FaceRecognitionLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model"""

    list_display = ('email', 'username', 'first_name', 'last_name', 'face_registered', 'is_verified', 'is_staff', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'face_registered', 'is_verified', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone')}),
        (_('Face Recognition'), {
            'fields': ('face_id', 'face_image', 'face_registered', 'face_registered_at'),
            'classes': ('collapse',)
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login', 'date_joined', 'face_registered_at')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )


@admin.register(FaceRecognitionLog)
class FaceRecognitionLogAdmin(admin.ModelAdmin):
    """Admin interface for Face Recognition Logs"""

    list_display = ('user', 'action', 'success', 'similarity_score', 'ip_address', 'created_at')
    list_filter = ('action', 'success', 'created_at')
    search_fields = ('user__email', 'user__username', 'ip_address')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'user', 'action', 'success', 'similarity_score', 'ip_address', 'user_agent', 'created_at')

    def has_add_permission(self, request):
        # Don't allow manual creation of logs
        return False

    def has_change_permission(self, request, obj=None):
        # Don't allow editing logs
        return False
