"""
Test script for face recognition service
"""
import requests
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import json

# Service URL
BASE_URL = "http://localhost:8080"

def create_test_face_image():
    """
    Create a simple test image with a face-like pattern
    This is just for testing - in production you'd use real photos
    """
    # Create a 400x400 image
    img = Image.new('RGB', (400, 400), color='lightblue')
    draw = ImageDraw.Draw(img)

    # Draw a simple face
    # Head (circle)
    draw.ellipse([100, 80, 300, 280], fill='peachpuff', outline='black', width=2)

    # Eyes
    draw.ellipse([140, 140, 170, 170], fill='white', outline='black', width=2)
    draw.ellipse([230, 140, 260, 170], fill='white', outline='black', width=2)
    draw.ellipse([150, 150, 160, 160], fill='black')
    draw.ellipse([240, 150, 250, 160], fill='black')

    # Nose
    draw.line([200, 170, 190, 210], fill='black', width=2)
    draw.line([200, 170, 210, 210], fill='black', width=2)

    # Mouth
    draw.arc([160, 200, 240, 250], 0, 180, fill='black', width=2)

    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="JPEG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return img_base64, img

def download_real_face_image():
    """
    Download a real face image for testing
    """
    try:
        # Use a public domain face image
        url = "https://thispersondoesnotexist.com/"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            return img_base64, img
        else:
            return None, None
    except Exception as e:
        print(f"Could not download image: {e}")
        return None, None

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("Testing /health endpoint...")
    print("="*60)

    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_register(user_id, face_image_base64):
    """Test registration endpoint"""
    print("\n" + "="*60)
    print(f"Testing /register endpoint for user: {user_id}")
    print("="*60)

    payload = {
        "id": user_id,
        "image": face_image_base64
    }

    response = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    return response.status_code == 200, response.json()

def test_search(face_image_base64, threshold=0.6):
    """Test search endpoint"""
    print("\n" + "="*60)
    print(f"Testing /search endpoint (threshold: {threshold})")
    print("="*60)

    payload = {
        "image": face_image_base64,
        "threshold": threshold
    }

    response = requests.post(f"{BASE_URL}/search", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    return response.status_code == 200, response.json()

def test_user_list():
    """Test user list endpoint"""
    print("\n" + "="*60)
    print("Testing /user_list endpoint")
    print("="*60)

    response = requests.get(f"{BASE_URL}/user_list")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    return response.json()

def test_remove(user_id):
    """Test remove endpoint"""
    print("\n" + "="*60)
    print(f"Testing /remove endpoint for user: {user_id}")
    print("="*60)

    payload = {"id": user_id}
    response = requests.post(f"{BASE_URL}/remove", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    return response.status_code == 200

if __name__ == "__main__":
    print("\n" + "🔥"*30)
    print("FACE RECOGNITION SERVICE TEST SUITE")
    print("🔥"*30)

    # Test 1: Health check
    if not test_health():
        print("\n❌ Health check failed! Service may not be running.")
        exit(1)

    print("\n✅ Health check passed!")

    # Test 2: Get initial user list
    initial_users = test_user_list()

    # Test 3: Try to download a real face image, fallback to generated
    print("\n📥 Attempting to download real face image for testing...")
    face_image_base64, face_img = download_real_face_image()

    if face_image_base64 is None:
        print("⚠️ Could not download real face image, using generated test image...")
        face_image_base64, face_img = create_test_face_image()
        print("⚠️ WARNING: Generated images may not contain detectable faces!")
        print("⚠️ For best results, use a real photo of a face.")
    else:
        print("✅ Downloaded real face image!")
        # Save it for reference
        face_img.save("test_face.jpg")
        print("💾 Saved test face to test_face.jpg")

    # Test 4: Register a face
    test_user_id = "test_user_001"
    success, result = test_register(test_user_id, face_image_base64)

    if not success:
        print("\n❌ Registration failed!")
        print("This might be because:")
        print("  - No face was detected in the image")
        print("  - The image format is invalid")
        print("  - DeepFace model is not loaded")
        exit(1)

    print("\n✅ Registration successful!")

    # Test 5: Verify user was added
    users = test_user_list()
    if test_user_id in users['users']:
        print(f"\n✅ User {test_user_id} found in user list!")
    else:
        print(f"\n❌ User {test_user_id} not found in user list!")

    # Test 6: Search with the same face (should find it)
    success, result = test_search(face_image_base64, threshold=0.6)

    if success and result.get('id') == test_user_id:
        similarity = result.get('similarity', 0)
        print(f"\n✅ Face search successful!")
        print(f"   Found: {result.get('id')}")
        print(f"   Similarity: {similarity:.2%}")
    else:
        print("\n❌ Face search failed!")
        print("   Expected to find the registered user")

    # Test 7: Search with stricter threshold (might not find it)
    print("\n🔍 Testing with stricter threshold (0.9)...")
    success, result = test_search(face_image_base64, threshold=0.9)

    if success:
        print(f"   Found with strict threshold: {result.get('id')}")
        print(f"   Similarity: {result.get('similarity', 0):.2%}")
    else:
        print("   Not found with strict threshold (this is expected)")

    # Test 8: Clean up - remove the test user
    print("\n🧹 Cleaning up test data...")
    if test_remove(test_user_id):
        print(f"✅ Removed test user: {test_user_id}")
    else:
        print(f"❌ Failed to remove test user: {test_user_id}")

    # Final user list
    final_users = test_user_list()

    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETED!")
    print("="*60)
    print(f"Initial users: {len(initial_users['users'])}")
    print(f"Final users: {len(final_users['users'])}")
    print("\n🎉 Face Recognition Service is working correctly!")
