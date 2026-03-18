"""
Production-grade Face Recognition Service using DeepFace
Compatible with Django backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os
import io
import numpy as np
from pathlib import Path
from PIL import Image
from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
import traceback

app = Flask(__name__)
CORS(app)

# Storage directory for face data
STORAGE_DIR = Path("./face_data")
STORAGE_DIR.mkdir(exist_ok=True)

# DeepFace configuration
MODEL_NAME = "Facenet512"  # Generates 512-dimensional embeddings
DISTANCE_METRIC = "cosine"
DETECTOR_BACKEND = "opencv"  # Fast and reliable

# Similarity threshold (lower = more strict)
# Cosine distance: 0.0 = identical, 1.0 = completely different
# We convert to similarity: 1.0 = identical, 0.0 = completely different
DEFAULT_THRESHOLD = 0.6  # 60% similarity

print(f"🔥 Initializing Face Recognition Service with {MODEL_NAME}...")
print(f"📦 Loading models... (this may take a moment)")

# Pre-load models on startup for faster response times
try:
    DeepFace.build_model(MODEL_NAME)
    print(f"✅ {MODEL_NAME} model loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not pre-load model: {e}")

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    try:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

def save_image_from_base64(base64_string, path):
    """Save base64 image to file"""
    image = base64_to_image(base64_string)
    image.save(path, format='JPEG', quality=95)

def generate_embedding(image_path):
    """
    Generate face embedding using DeepFace
    Returns: numpy array of shape (512,) or raises exception
    """
    try:
        # Extract face embedding
        embedding_objs = DeepFace.represent(
            img_path=str(image_path),
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True  # Ensure a face is detected
        )

        # DeepFace.represent returns a list of embeddings (one per face detected)
        if not embedding_objs:
            raise ValueError("No face detected in image")

        # Use the first face detected
        embedding = np.array(embedding_objs[0]["embedding"])
        return embedding

    except Exception as e:
        raise ValueError(f"Face detection/embedding failed: {str(e)}")

def calculate_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings
    Returns: similarity score between 0.0 and 1.0
    """
    embedding1 = np.array(embedding1).reshape(1, -1)
    embedding2 = np.array(embedding2).reshape(1, -1)

    # Cosine similarity: 1.0 = identical, -1.0 = opposite
    similarity = cosine_similarity(embedding1, embedding2)[0][0]

    # Normalize to 0-1 range (0 = different, 1 = same)
    # Cosine similarity is already in [-1, 1], but for faces it's typically [0, 1]
    similarity = max(0.0, min(1.0, similarity))

    return float(similarity)

def save_face(user_id: str, face_image_base64: str):
    """Save face image and generate real embedding using DeepFace"""
    try:
        # Create user directory
        user_dir = STORAGE_DIR / user_id
        user_dir.mkdir(exist_ok=True)

        # Save image
        image_path = user_dir / "face.jpg"
        save_image_from_base64(face_image_base64, image_path)

        # Generate embedding using DeepFace
        print(f"📸 Generating embedding for user {user_id}...")
        embedding = generate_embedding(image_path)
        print(f"✅ Embedding generated: {len(embedding)} dimensions")

        # Save metadata with embedding
        metadata = {
            'user_id': user_id,
            'embedding': embedding.tolist(),  # Convert numpy array to list for JSON
            'image_path': str(image_path),
            'model': MODEL_NAME,
            'embedding_dimensions': len(embedding)
        }

        metadata_path = user_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)

        return True, user_id

    except Exception as e:
        error_msg = f"Failed to save face: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        return False, error_msg

def search_face(face_image_base64: str, threshold: float = DEFAULT_THRESHOLD):
    """Search for matching face using real face recognition"""
    temp_path = None
    try:
        # Save temporary image for processing
        temp_path = STORAGE_DIR / "temp_query.jpg"
        save_image_from_base64(face_image_base64, temp_path)

        # Generate embedding for query image
        print("🔍 Generating embedding for query image...")
        query_embedding = generate_embedding(temp_path)
        print(f"✅ Query embedding generated: {len(query_embedding)} dimensions")

        # Search through all registered faces
        best_match = None
        best_similarity = 0.0

        print(f"📂 Searching through registered faces...")
        for user_dir in STORAGE_DIR.iterdir():
            if not user_dir.is_dir() or user_dir.name == "temp_query.jpg":
                continue

            metadata_path = user_dir / "metadata.json"
            if not metadata_path.exists():
                continue

            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)

                # Load stored embedding
                stored_embedding = np.array(metadata['embedding'])

                # Calculate similarity using cosine similarity
                similarity = calculate_similarity(query_embedding, stored_embedding)

                print(f"  User {metadata['user_id'][:8]}...: similarity = {similarity:.3f}")

                # Update best match if this is better and meets threshold
                if similarity > best_similarity and similarity >= threshold:
                    best_similarity = similarity
                    best_match = metadata['user_id']

            except Exception as e:
                print(f"⚠️ Error processing user {user_dir.name}: {e}")
                continue

        # Clean up temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink()

        if best_match:
            print(f"✅ Match found! User: {best_match}, Similarity: {best_similarity:.3f}")
            return True, best_match, best_similarity
        else:
            print(f"❌ No match found (best similarity: {best_similarity:.3f}, threshold: {threshold})")
            return False, None, 0.0

    except Exception as e:
        error_msg = f"Search failed: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()

        # Clean up temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink()

        return False, None, 0.0

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'face-recognition',
        'model': MODEL_NAME,
        'version': 'production'
    }), 200

@app.route('/register', methods=['POST'])
def register():
    """Register a new face"""
    try:
        data = request.get_json()

        if not data or 'id' not in data or 'image' not in data:
            return jsonify({'error': 'Missing required fields: id, image'}), 400

        user_id = data['id']
        face_image = data['image']

        # Remove data URI prefix if present
        if 'data:image' in face_image:
            face_image = face_image.split(',')[1]

        print(f"\n🆕 Registering face for user: {user_id}")
        success, result = save_face(user_id, face_image)

        if success:
            return jsonify({
                'success': True,
                'id': user_id,
                'message': 'Face registered successfully',
                'model': MODEL_NAME
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result
            }), 400

    except Exception as e:
        error_msg = f"Registration error: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500

@app.route('/search', methods=['POST'])
def search():
    """Search for a matching face"""
    try:
        data = request.get_json()

        if not data or 'image' not in data:
            return jsonify({'error': 'Missing required field: image'}), 400

        face_image = data['image']
        threshold = data.get('threshold', DEFAULT_THRESHOLD)

        # Remove data URI prefix if present
        if 'data:image' in face_image:
            face_image = face_image.split(',')[1]

        print(f"\n🔎 Searching for face (threshold: {threshold})...")
        success, user_id, similarity = search_face(face_image, threshold)

        if success:
            return jsonify({
                'success': True,
                'id': user_id,
                'similarity': similarity,
                'message': 'Face found',
                'model': MODEL_NAME
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No matching face found'
            }), 404

    except Exception as e:
        error_msg = f"Search error: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500

@app.route('/remove', methods=['POST'])
def remove():
    """Remove a registered face"""
    try:
        data = request.get_json()

        if not data or 'id' not in data:
            return jsonify({'error': 'Missing required field: id'}), 400

        user_id = data['id']
        user_dir = STORAGE_DIR / user_id

        if user_dir.exists():
            import shutil
            shutil.rmtree(user_dir)
            print(f"🗑️ Removed face for user: {user_id}")
            return jsonify({
                'success': True,
                'message': 'Face removed successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

    except Exception as e:
        print(f"❌ Error removing face: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/user_list', methods=['GET'])
def user_list():
    """Get list of registered users"""
    try:
        users = []
        for user_dir in STORAGE_DIR.iterdir():
            if user_dir.is_dir():
                users.append(user_dir.name)

        return jsonify({
            'success': True,
            'users': users,
            'count': len(users),
            'model': MODEL_NAME
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Face Recognition Service (Production Grade)")
    print("="*60)
    print(f"📦 Model: {MODEL_NAME}")
    print(f"📏 Embedding dimensions: 512")
    print(f"📁 Storage directory: {STORAGE_DIR.absolute()}")
    print(f"🎯 Default threshold: {DEFAULT_THRESHOLD}")
    print(f"🌐 Server: http://0.0.0.0:8080")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=8080, debug=False)
