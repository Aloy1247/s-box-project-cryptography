from PIL import Image
import io

# Create a simple test image
img = Image.new('RGB', (64, 64), color=(255, 0, 0))
img.save('test_image.png')

# Test encryption
from services.image_encryption_service import image_encryption_service

with open('test_image.png', 'rb') as f:
    original_data = f.read()

encrypted_data = image_encryption_service.encrypt_image(original_data, 'TestKey123456789', 'KAES')
with open('test_encrypted.png', 'wb') as f:
    f.write(encrypted_data)

# Test decryption
decrypted_data = image_encryption_service.decrypt_image(encrypted_data, 'TestKey123456789', 'KAES')
with open('test_decrypted.png', 'wb') as f:
    f.write(decrypted_data)

print('Encryption & Decryption: OK')
print(f'Original size: {len(original_data)} bytes')
print(f'Encrypted size: {len(encrypted_data)} bytes')
print(f'Decrypted size: {len(decrypted_data)} bytes')

# Test analysis
from services.image_analysis import analyze_encryption
metrics = analyze_encryption(original_data, encrypted_data)
print(f"Entropy: {metrics['entropy']:.4f}")
print(f"NPCR: {metrics['npcr']:.2f}%")
print(f"UACI: {metrics['uaci']:.2f}%")
print(f"Correlation H: {metrics['correlationH']:.4f}")
