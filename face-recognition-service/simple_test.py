#!/usr/bin/env python3
"""
Simple test script that runs inside the Docker container
"""
import base64
import json
import sys
from pathlib import Path

# Read the test image
try:
    with open('test_face.jpg', 'rb') as f:
        image_data = f.read()

    # Convert to base64
    image_base64 = base64.b64encode(image_data).decode('utf-8')

    print(f"[OK] Loaded image: {len(image_data)} bytes")
    print(f"[OK] Base64 length: {len(image_base64)} characters")

    # Create JSON payload
    register_payload = {
        "id": "test_user_001",
        "image": image_base64
    }

    # Save to file for curl
    with open('register_payload.json', 'w') as f:
        json.dump(register_payload, f)

    print("[OK] Created register_payload.json")

    # Create search payload
    search_payload = {
        "image": image_base64,
        "threshold": 0.6
    }

    with open('search_payload.json', 'w') as f:
        json.dump(search_payload, f)

    print("[OK] Created search_payload.json")
    print("\n[INFO] Run these commands to test:")
    print("  curl -X POST http://localhost:8080/register -H 'Content-Type: application/json' -d @register_payload.json")
    print("  curl -X POST http://localhost:8080/search -H 'Content-Type: application/json' -d @search_payload.json")

except Exception as e:
    print(f"[ERROR] Error: {e}")
    sys.exit(1)
