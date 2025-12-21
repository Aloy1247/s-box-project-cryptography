"""
Image Encryption Service

Encrypts and decrypts images using AES-128 with custom S-boxes.
Uses ECB mode for simplicity in research context (each block encrypted independently).
Optimized for bulk processing with vectorized NumPy operations.
"""

import numpy as np
from PIL import Image
import io
import sys
from pathlib import Path
from typing import List

# Setup import path
_services_dir = Path(__file__).parent
_backend_dir = _services_dir.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from core.aes import key_expansion, generate_inverse_sbox
from services.matrix_service import matrix_service
from core.affine import construct_sbox

# --- Vectorized AES Implementation ---

def _generate_mul_tables():
    """Generate multiplication tables for GF(2^8) used in MixColumns."""
    mul2 = np.zeros(256, dtype=np.uint8)
    mul3 = np.zeros(256, dtype=np.uint8)
    mul9 = np.zeros(256, dtype=np.uint8)
    mul11 = np.zeros(256, dtype=np.uint8)
    mul13 = np.zeros(256, dtype=np.uint8)
    mul14 = np.zeros(256, dtype=np.uint8)

    for x in range(256):
        # x * 2
        p = (x << 1) ^ 0x1B if (x & 0x80) else (x << 1)
        mul2[x] = p & 0xFF
        
        # x * 3 = (x * 2) ^ x
        mul3[x] = mul2[x] ^ x
        
        # x * 4
        x4 = (mul2[x] << 1) ^ 0x1B if (mul2[x] & 0x80) else (mul2[x] << 1)
        x4 &= 0xFF
        
        # x * 8
        x8 = (x4 << 1) ^ 0x1B if (x4 & 0x80) else (x4 << 1)
        x8 &= 0xFF
        
        # Inverse values
        # 9 = 8 + 1
        mul9[x] = x8 ^ x
        # 11 = 8 + 2 + 1
        mul11[x] = x8 ^ mul2[x] ^ x
        # 13 = 8 + 4 + 1
        mul13[x] = x8 ^ x4 ^ x
        # 14 = 8 + 4 + 2
        mul14[x] = x8 ^ x4 ^ mul2[x]

    return mul2, mul3, mul9, mul11, mul13, mul14

# Initialize tables
MUL2, MUL3, MUL9, MUL11, MUL13, MUL14 = _generate_mul_tables()

def _vector_aes_encrypt(plaintext: bytes, round_keys: List[List[List[int]]], sbox: List[List[int]]) -> bytes:
    """Vectorized AES encryption for bulk data."""
    # Flatten S-box for 1D lookup
    sbox_flat = np.array([val for row in sbox for val in row], dtype=np.uint8)
    rkeys = np.array(round_keys, dtype=np.uint8)
    
    # 1. Prepare State (N, 4, 4)
    # Pad input
    pad_len = (16 - len(plaintext) % 16) % 16
    if pad_len == 0 and len(plaintext) == 0:
        pad_len = 16 # PKCS7 requires padding even if aligned? Usually yes, but here we just need alignment for blocks
    
    # NOTE: The original service implemented PKCS7 manually.
    if len(plaintext) % 16 != 0:
        padding = bytes([16 - len(plaintext) % 16] * (16 - len(plaintext) % 16))
        data = plaintext + padding
    else:
        # If already aligned, standard PKCS7 adds 16 bytes.
        # But for image pixel data, strict PKCS7 might not be critical if we just want bulk RGB processing.
        # However, to match previous behavior:
        padding = bytes([16] * 16)
        data = plaintext + padding
        
    n_blocks = len(data) // 16
    
    # Convert to (N, 4, 4)
    # Input is column-major order of bytes in state
    # 0 4 8 12
    # 1 5 9 13
    # ...
    # np.frombuffer gives linear. reshape(N, 4, 4) fills row-wise.
    # we need to transpose the last two dimensions to match AES state layout
    # if we treat input as [0, 1, 2, 3...] filling the columns
    
    # FIX: .copy() is required because frombuffer returns a read-only array, but we need to modify 'state' in-place.
    state = np.frombuffer(data, dtype=np.uint8).reshape(n_blocks, 4, 4).transpose(0, 2, 1).copy()

    # Initial Round (AddRoundKey)
    state ^= rkeys[0]

    # Rounds 1-9
    for r in range(1, 10):
        # SubBytes
        state = sbox_flat[state]
        
        # ShiftRows
        # Row 1 -> shift 1
        state[:, 1, :] = np.roll(state[:, 1, :], -1, axis=1)
        # Row 2 -> shift 2
        state[:, 2, :] = np.roll(state[:, 2, :], -2, axis=1)
        # Row 3 -> shift 3
        state[:, 3, :] = np.roll(state[:, 3, :], -3, axis=1)
        
        # MixColumns
        s0 = state[:, 0, :]
        s1 = state[:, 1, :]
        s2 = state[:, 2, :]
        s3 = state[:, 3, :]
        
        ns0 = MUL2[s0] ^ MUL3[s1] ^ s2 ^ s3
        ns1 = s0 ^ MUL2[s1] ^ MUL3[s2] ^ s3
        ns2 = s0 ^ s1 ^ MUL2[s2] ^ MUL3[s3]
        ns3 = MUL3[s0] ^ s1 ^ s2 ^ MUL2[s3]
        
        state = np.stack([ns0, ns1, ns2, ns3], axis=1)
        
        # AddRoundKey
        state ^= rkeys[r]

    # Final Round
    state = sbox_flat[state]
    state[:, 1, :] = np.roll(state[:, 1, :], -1, axis=1)
    state[:, 2, :] = np.roll(state[:, 2, :], -2, axis=1)
    state[:, 3, :] = np.roll(state[:, 3, :], -3, axis=1)
    state ^= rkeys[10]
    
    # Convert back
    return state.transpose(0, 2, 1).tobytes()

def _vector_aes_decrypt(ciphertext: bytes, round_keys: List[List[List[int]]], inv_sbox: List[List[int]]) -> bytes:
    """Vectorized AES decryption for bulk data."""
    inv_sbox_flat = np.array([val for row in inv_sbox for val in row], dtype=np.uint8)
    rkeys = np.array(round_keys, dtype=np.uint8)
    
    n_blocks = len(ciphertext) // 16
    
    # FIX: .copy() is required for in-place modification
    state = np.frombuffer(ciphertext, dtype=np.uint8).reshape(n_blocks, 4, 4).transpose(0, 2, 1).copy()
    
    # Initial Round
    state ^= rkeys[10]
    
    # Rounds 9-1
    for r in range(9, 0, -1):
        # InvShiftRows
        state[:, 1, :] = np.roll(state[:, 1, :], 1, axis=1)
        state[:, 2, :] = np.roll(state[:, 2, :], 2, axis=1)
        state[:, 3, :] = np.roll(state[:, 3, :], 3, axis=1)
        
        # InvSubBytes
        state = inv_sbox_flat[state]
        
        # AddRoundKey
        state ^= rkeys[r]
        
        # InvMixColumns
        s0 = state[:, 0, :]
        s1 = state[:, 1, :]
        s2 = state[:, 2, :]
        s3 = state[:, 3, :]
        
        ns0 = MUL14[s0] ^ MUL11[s1] ^ MUL13[s2] ^ MUL9[s3]
        ns1 = MUL9[s0] ^ MUL14[s1] ^ MUL11[s2] ^ MUL13[s3]
        ns2 = MUL13[s0] ^ MUL9[s1] ^ MUL14[s2] ^ MUL11[s3]
        ns3 = MUL11[s0] ^ MUL13[s1] ^ MUL9[s2] ^ MUL14[s3]
        
        state = np.stack([ns0, ns1, ns2, ns3], axis=1)

    # Final Round
    state[:, 1, :] = np.roll(state[:, 1, :], 1, axis=1)
    state[:, 2, :] = np.roll(state[:, 2, :], 2, axis=1)
    state[:, 3, :] = np.roll(state[:, 3, :], 3, axis=1)
    state = inv_sbox_flat[state]
    state ^= rkeys[0]
    
    return state.transpose(0, 2, 1).tobytes()


class ImageEncryptionService:
    """Service for encrypting/decrypting images with custom S-boxes."""
    
    def __init__(self):
        self._sbox_cache = {}
        self._inv_sbox_cache = {}
    
    def _get_sbox(self, sbox_id: str) -> list:
        """Get S-box by ID, with caching."""
        if sbox_id not in self._sbox_cache:
            matrix_data = matrix_service.get_by_id(sbox_id)
            if not matrix_data:
                raise ValueError(f"S-box '{sbox_id}' not found")
            
            constant = 0x63 if sbox_id == 'KAES' else 0x00
            sbox = construct_sbox(matrix_data['matrix'], constant)
            self._sbox_cache[sbox_id] = sbox
        
        return self._sbox_cache[sbox_id]
    
    def _get_inverse_sbox(self, sbox_id: str) -> list:
        """Get inverse S-box by ID, with caching."""
        if sbox_id not in self._inv_sbox_cache:
            sbox = self._get_sbox(sbox_id)
            inv_sbox = generate_inverse_sbox(sbox)
            self._inv_sbox_cache[sbox_id] = inv_sbox
        
        return self._inv_sbox_cache[sbox_id]
    
    def _prepare_key(self, key: str) -> bytes:
        """Prepare key to be exactly 16 bytes."""
        key_bytes = key.encode('utf-8')
        if len(key_bytes) < 16:
            key_bytes = key_bytes + b'\x00' * (16 - len(key_bytes))
        return key_bytes[:16]
    
    def encrypt_image(self, image_data: bytes, key: str, sbox_id: str) -> bytes:
        """
        Encrypt an image using AES with custom S-box.
        Optimized with vectorized NumPy operations.
        """
        # Load image
        img = Image.open(io.BytesIO(image_data))
        img = img.convert('RGB')
        
        # Get pixel data as numpy array
        pixels = np.array(img, dtype=np.uint8)
        height, width, channels = pixels.shape
        
        # Flatten to bytes
        flat_data = pixels.flatten().tobytes()
        
        # Get S-box and prepare key
        sbox = self._get_sbox(sbox_id)
        key_bytes = self._prepare_key(key)
        
        # Compute round keys
        round_keys = key_expansion(key_bytes, sbox)
        
        # Encrypt using VECOTRIZED implementation
        encrypted_data = _vector_aes_encrypt(flat_data, round_keys, sbox)
        
        # Calculate padding size used
        # If padded_data = flat + padding
        # encrypted size = original padded size
        # We need to reshape the *payload* part back to image
        # The output size > input size due to padding.
        # But we can only save as PNG with specific dimensions.
        # Usually, encrypted images are saved with arbitrary noise, or we just save the bytes.
        # The original code reshaped back to HxW.
        # "encrypted_pixels = np.frombuffer(encrypted_data[:total_pixels], ...)"
        
        # It truncated the padding?
        # 102:         total_pixels = width * height * channels
        # 103:         encrypted_pixels = np.frombuffer(encrypted_data[:total_pixels], dtype=np.uint8)
        
        # This means the padding bytes are LOST if we just take [:total_pixels].
        # But wait, if we decrypt, we need those bytes?
        # If we truncate, we can't derypt the last block correctly if it depends on data outside.
        # ECB is block independent.
        # But if total_pixels is not multiple of 16, the last block of encrypted_data contains encrypted(last_pixels + padding).
        # We need the WHOLE encrypted last block.
        # If we truncate it to 'total_pixels', we lose the end of the last block.
        # When decrypting, we need the full last block.
        
        # Original code:
        # encrypted_pixels = np.frombuffer(encrypted_data[:total_pixels], dtype=np.uint8)
        # It discarded the extra bytes!
        # This implies that when decrypting, it reads the truncated data.
        # "Pad to multiple of 16 if needed" in decrypt_image.
        # If we truncate the ciphertext, the last block is corrupted.
        # AES outputs 16 bytes for 16 bytes input.
        # If we have 1 byte of pixel data, we pad 15 bytes -> 16 bytes input -> 16 bytes output.
        # If we take only the 1st byte of output, we cannot recover the input.
        # 
        # So the original code was BROKEN for modification of non-aligned images?
        # Let's check original decrypt:
        # 130:         padding_len = (16 - len(flat_data) % 16) % 16
        # 131:         if padding_len > 0:
        # 132:             flat_data = flat_data + bytes([0] * padding_len)
        # It zero-pads the ciphertext? That's definitely wrong for AES.
        # You can't just zero-pad ciphertext. You need the original ciphertext bytes.
        
        # However, the user asked to "make it faster without changing how it works".
        # I should faithfully reproduce the (possibly flawed) logic of the original, just faster.
        # Or fix it if it's glaring.
        # If I fix it, I might break their expectation (e.g. image size).
        # But truncated ciphertext = impossible decryption.
        # Maybe they test with images that are multiples of 16 bytes?
        # Or maybe they just look at the encrypted "noise" image and don't care about perfect decryption for now?
        # But they have a decrypt function.
        
        # Use simple logic:
        # Valid encrypted image usually saves the padding or uses a format that supports it.
        # Here we save as PNG. PNG is lossless RGB.
        # If we want to save full ciphertext, we might need to change dimensions (e.g. add a row).
        
        # Let's stick to the original logic: Truncate.
        # Wait, if I truncate, I replicate the bug.
        # But if I don't truncate, the reshape (H, W, C) will fail.
        
        total_pixels = width * height * channels
        encrypted_pixels_flat = np.frombuffer(encrypted_data, dtype=np.uint8)
        
        # If we have more data than pixels, we have a problem fitting into HxW.
        # Original code discarded extra.
        encrypted_pixels = encrypted_pixels_flat[:total_pixels]
        
        encrypted_pixels = encrypted_pixels.reshape((height, width, channels))
        
        # Save as PNG
        encrypted_img = Image.fromarray(encrypted_pixels, 'RGB')
        output = io.BytesIO()
        encrypted_img.save(output, format='PNG')
        
        return output.getvalue()
    
    def decrypt_image(self, image_data: bytes, key: str, sbox_id: str) -> bytes:
        """
        Decrypt an image using AES with custom S-box.
        Optimized with vectorized NumPy operations.
        """
        # Load encrypted image
        img = Image.open(io.BytesIO(image_data))
        img = img.convert('RGB')
        
        # Get pixel data
        pixels = np.array(img, dtype=np.uint8)
        height, width, channels = pixels.shape
        
        # Flatten
        flat_data = pixels.flatten().tobytes()
        
        # Pad to multiple of 16 to recover "valid" ciphertext blocks
        # Original used 0-padding.
        padding_len = (16 - len(flat_data) % 16) % 16
        if padding_len > 0:
            flat_data = flat_data + bytes([0] * padding_len)
            
        # Get S-box, inverse S-box, and prepare key
        sbox = self._get_sbox(sbox_id)
        inv_sbox = self._get_inverse_sbox(sbox_id)
        key_bytes = self._prepare_key(key)
        
        # Compute round keys
        round_keys = key_expansion(key_bytes, sbox)
        
        # Decrypt using VECTORIZED implementation
        decrypted_data = _vector_aes_decrypt(flat_data, round_keys, inv_sbox)
        
        # Reshape
        total_pixels = width * height * channels
        # Just truncate the padding (which might include PKCS7 padding)
        decrypted_pixels_flat = np.frombuffer(decrypted_data, dtype=np.uint8)
        decrypted_pixels = decrypted_pixels_flat[:total_pixels]
        
        decrypted_pixels = decrypted_pixels.reshape((height, width, channels))
        
        # Save as PNG
        decrypted_img = Image.fromarray(decrypted_pixels, 'RGB')
        output = io.BytesIO()
        decrypted_img.save(output, format='PNG')
        
        return output.getvalue()


# Global service instance
image_encryption_service = ImageEncryptionService()
