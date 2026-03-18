"""
Create a test image and save base64 to file
"""
import base64
from PIL import Image, ImageDraw

# Create a 400x400 image with a simple face
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

# Save image
img.save('test_face.jpg')
print("✅ Saved test face image to test_face.jpg")

# Save base64
from io import BytesIO
buffered = BytesIO()
img.save(buffered, format="JPEG")
img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

with open('test_face_base64.txt', 'w') as f:
    f.write(img_base64)

print(f"✅ Saved base64 to test_face_base64.txt ({len(img_base64)} characters)")
print("\n⚠️ NOTE: This is a drawn face - DeepFace might not detect it!")
print("For best results, use a real photograph of a face.")
