"""
AES Service

Handles AES encryption/decryption with custom S-box support.
"""

from typing import Optional

try:
    from core.aes import (
        aes_encrypt_block, 
        aes_decrypt_block, 
        pkcs7_pad, 
        pkcs7_unpad,
        BLOCK_SIZE
    )
    from core.affine import construct_sbox
    from services.matrix_service import matrix_service
except ImportError:
    from ..core.aes import (
        aes_encrypt_block, 
        aes_decrypt_block, 
        pkcs7_pad, 
        pkcs7_unpad,
        BLOCK_SIZE
    )
    from ..core.affine import construct_sbox
    from .matrix_service import matrix_service


class AESService:
    """Service for AES operations with custom S-boxes."""
    
    def __init__(self):
        self._sbox_cache = {}
    
    def _get_sbox(self, sbox_id: str) -> list:
        """Get S-box by ID, using cache for efficiency."""
        if sbox_id in self._sbox_cache:
            return self._sbox_cache[sbox_id]
        
        # Get matrix from service
        matrix_data = matrix_service.get_by_id(sbox_id)
        if not matrix_data:
            raise ValueError(f"Unknown S-box ID: {sbox_id}")
        
        matrix = matrix_data.get("matrix")
        if not matrix:
            raise ValueError(f"S-box {sbox_id} has no matrix data")
        
        # Get constant (default to 0x63 for AES compatibility)
        constant = matrix_data.get("constant", "63")
        if constant is None:
            constant = "63"
        constant_int = int(constant, 16)
        
        # Construct S-box
        sbox = construct_sbox(matrix, constant_int)
        
        # Cache it
        self._sbox_cache[sbox_id] = sbox
        return sbox
    
    def encrypt(self, plaintext: str, key: str, sbox_id: str) -> str:
        """
        Encrypt plaintext using AES-128 with the specified S-box.
        
        Args:
            plaintext: Text to encrypt (max 16 characters for single block)
            key: 16-character encryption key
            sbox_id: ID of the S-box to use
        
        Returns:
            Ciphertext as hexadecimal string
        """
        # Validate key length
        if len(key) != 16:
            raise ValueError("Key must be exactly 16 characters (128-bit)")
        
        # Convert plaintext to bytes with padding
        plaintext_bytes = plaintext.encode('utf-8')
        if len(plaintext_bytes) > BLOCK_SIZE:
            raise ValueError(f"Plaintext too long. Max {BLOCK_SIZE} bytes for single-block mode.")
        
        # Pad to block size
        padded = pkcs7_pad(plaintext_bytes, BLOCK_SIZE)
        
        # Get S-box
        sbox = self._get_sbox(sbox_id)
        
        # Encrypt
        key_bytes = key.encode('utf-8')
        ciphertext = aes_encrypt_block(padded, key_bytes, sbox)
        
        # Return as hex
        return ciphertext.hex().upper()
    
    def decrypt(self, ciphertext_hex: str, key: str, sbox_id: str) -> str:
        """
        Decrypt ciphertext using AES-128 with the specified S-box.
        
        Args:
            ciphertext_hex: Ciphertext as hexadecimal string
            key: 16-character encryption key
            sbox_id: ID of the S-box to use
        
        Returns:
            Decrypted plaintext
        """
        # Validate key length
        if len(key) != 16:
            raise ValueError("Key must be exactly 16 characters (128-bit)")
        
        # Convert hex to bytes
        try:
            ciphertext = bytes.fromhex(ciphertext_hex)
        except ValueError:
            raise ValueError("Invalid ciphertext (must be valid hexadecimal)")
        
        if len(ciphertext) != BLOCK_SIZE:
            raise ValueError(f"Ciphertext must be exactly {BLOCK_SIZE} bytes (32 hex chars)")
        
        # Get S-box
        sbox = self._get_sbox(sbox_id)
        
        # Decrypt
        key_bytes = key.encode('utf-8')
        decrypted = aes_decrypt_block(ciphertext, key_bytes, sbox)
        
        # Remove padding
        unpadded = pkcs7_unpad(decrypted)
        
        # Decode to string
        try:
            return unpadded.decode('utf-8')
        except UnicodeDecodeError:
            # If can't decode as UTF-8, return hex
            return unpadded.hex().upper()
    
    def clear_cache(self):
        """Clear the S-box cache."""
        self._sbox_cache = {}


# Singleton instance
aes_service = AESService()
