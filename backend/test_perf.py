import time
from PIL import Image
import io
from services.image_encryption_service import image_encryption_service

# Test with 256x256 image
img = Image.new('RGB', (256, 256), color=(255, 100, 50))
buf = io.BytesIO()
img.save(buf, 'PNG')
data = buf.getvalue()

print("Testing 256x256 image...")

start = time.time()
encrypted = image_encryption_service.encrypt_image(data, 'TestKey123', 'KAES')
enc_time = time.time() - start
print(f"Encrypt: {enc_time:.2f} seconds")

start = time.time()
decrypted = image_encryption_service.decrypt_image(encrypted, 'TestKey123', 'KAES')
dec_time = time.time() - start
print(f"Decrypt: {dec_time:.2f} seconds")

print(f"\nRatio Decrypt/Encrypt: {dec_time/enc_time:.2f}x")
