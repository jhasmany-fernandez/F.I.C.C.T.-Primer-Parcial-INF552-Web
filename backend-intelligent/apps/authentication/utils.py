import requests
import logging
from django.conf import settings
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Face Recognition Service Configuration
FACE_RECOGNITION_URL = getattr(
    settings,
    'FACE_RECOGNITION_URL',
    'http://face-recognition:8080'
)


class FaceRecognitionService:
    """
    Service to interact with the face recognition Docker container
    """

    @staticmethod
    def register_face(face_image_base64: str, user_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Register a face in the face recognition service

        Args:
            face_image_base64: Base64 encoded image
            user_id: Unique user identifier

        Returns:
            Tuple of (success, face_id, error_message)
        """
        try:
            url = f"{FACE_RECOGNITION_URL}/register"

            # Prepare payload
            payload = {
                "id": str(user_id),
                "image": face_image_base64
            }

            # Make request
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"Face registered successfully for user {user_id}")
                return True, str(user_id), None
            else:
                error_msg = f"Face registration failed: {response.text}"
                logger.error(error_msg)
                return False, None, error_msg

        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to face recognition service: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
        except Exception as e:
            error_msg = f"Unexpected error during face registration: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg

    @staticmethod
    def search_face(face_image_base64: str, threshold: float = 0.7) -> Tuple[bool, Optional[str], Optional[float], Optional[str]]:
        """
        Search for a face in the face recognition service

        Args:
            face_image_base64: Base64 encoded image
            threshold: Similarity threshold (0.0 to 1.0)

        Returns:
            Tuple of (success, user_id, similarity_score, error_message)
        """
        try:
            url = f"{FACE_RECOGNITION_URL}/search"

            # Prepare payload
            payload = {
                "image": face_image_base64,
                "threshold": threshold
            }

            # Make request
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()

                # Check if face was found
                if result.get('id'):
                    user_id = result.get('id')
                    similarity = result.get('similarity', 0.0)
                    logger.info(f"Face found: user {user_id} with similarity {similarity}")
                    return True, user_id, similarity, None
                else:
                    logger.warning("No matching face found")
                    return False, None, None, "No matching face found"

            else:
                error_msg = f"Face search failed: {response.text}"
                logger.error(error_msg)
                return False, None, None, error_msg

        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to face recognition service: {str(e)}"
            logger.error(error_msg)
            return False, None, None, error_msg
        except Exception as e:
            error_msg = f"Unexpected error during face search: {str(e)}"
            logger.error(error_msg)
            return False, None, None, error_msg

    @staticmethod
    def compare_faces(face_image1_base64: str, face_image2_base64: str) -> Tuple[bool, Optional[float], Optional[str]]:
        """
        Compare two faces

        Args:
            face_image1_base64: First base64 encoded image
            face_image2_base64: Second base64 encoded image

        Returns:
            Tuple of (success, similarity_score, error_message)
        """
        try:
            url = f"{FACE_RECOGNITION_URL}/compare_face_base64"

            # Prepare payload
            payload = {
                "image1": face_image1_base64,
                "image2": face_image2_base64
            }

            # Make request
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                similarity = result.get('similarity', 0.0)
                logger.info(f"Faces compared with similarity: {similarity}")
                return True, similarity, None
            else:
                error_msg = f"Face comparison failed: {response.text}"
                logger.error(error_msg)
                return False, None, error_msg

        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to face recognition service: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
        except Exception as e:
            error_msg = f"Unexpected error during face comparison: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg

    @staticmethod
    def get_registered_users() -> Tuple[bool, Optional[list], Optional[str]]:
        """
        Get list of all registered users in face recognition service

        Returns:
            Tuple of (success, user_list, error_message)
        """
        try:
            url = f"{FACE_RECOGNITION_URL}/user_list"

            response = requests.get(url, timeout=30)

            if response.status_code == 200:
                result = response.json()
                users = result.get('users', [])
                logger.info(f"Retrieved {len(users)} registered users")
                return True, users, None
            else:
                error_msg = f"Failed to get user list: {response.text}"
                logger.error(error_msg)
                return False, None, error_msg

        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to face recognition service: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
        except Exception as e:
            error_msg = f"Unexpected error getting user list: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg

    @staticmethod
    def remove_face(user_id: str) -> Tuple[bool, Optional[str]]:
        """
        Remove a registered face from the service

        Args:
            user_id: User identifier to remove

        Returns:
            Tuple of (success, error_message)
        """
        try:
            url = f"{FACE_RECOGNITION_URL}/remove"

            payload = {"id": str(user_id)}

            response = requests.post(
                url,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                logger.info(f"Face removed successfully for user {user_id}")
                return True, None
            else:
                error_msg = f"Face removal failed: {response.text}"
                logger.error(error_msg)
                return False, error_msg

        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to face recognition service: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error during face removal: {str(e)}"
            logger.error(error_msg)
            return False, error_msg


def get_client_ip(request) -> str:
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
