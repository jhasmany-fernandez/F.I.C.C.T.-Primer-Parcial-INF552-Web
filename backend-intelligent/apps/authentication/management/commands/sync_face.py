"""
Management command to manually sync a user's face to the face recognition service
Usage: python manage.py sync_face --user-id <user_id> --face-image <base64_string>
"""
from django.core.management.base import BaseCommand
from apps.authentication.models import User
from apps.authentication.utils import FaceRecognitionService
from django.utils import timezone


class Command(BaseCommand):
    help = 'Sync a user face to the face recognition service'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, required=True, help='User ID')
        parser.add_argument('--face-image', type=str, required=True, help='Base64 encoded face image')

    def handle(self, *args, **options):
        user_id = options['user_id']
        face_image = options['face_image']

        try:
            user = User.objects.get(id=user_id)
            self.stdout.write(f'Found user: {user.email} ({user.first_name} {user.last_name})')

            # Remove data URI prefix if present
            if 'data:image' in face_image:
                face_image = face_image.split(',')[1]

            # Register face
            success, face_id, error = FaceRecognitionService.register_face(
                face_image_base64=face_image,
                user_id=str(user.id)
            )

            if success:
                user.face_id = face_id
                user.face_registered = True
                user.face_registered_at = timezone.now()
                user.save()

                self.stdout.write(self.style.SUCCESS(
                    f'Successfully registered face for user {user.email}'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f'Failed to register face: {error}'
                ))

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with ID {user_id} not found'))
