"""
AES Service

Handles AES encryption/decryption with custom S-box support.
"""

from typing import Optional, List, Dict

try:
    from core.aes import (
        aes_encrypt_block, 
        aes_decrypt_block, 
        pkcs7_pad, 
        pkcs7_unpad,
        BLOCK_SIZE
    )
    from core.affine import construct_sbox
    # matrix_service imported locally
except ImportError:
    from ..core.aes import (
        aes_encrypt_block, 
        aes_decrypt_block, 
        pkcs7_pad, 
        pkcs7_unpad,
        BLOCK_SIZE
    )
    from ..core.affine import construct_sbox
    # matrix_service imported locally


class AESService:
    """Service for AES operations with custom S-boxes."""
    
    def __init__(self):
        self._sbox_cache = {}
    
    def _resolve_sbox(self, sbox_id: str = None, custom_sbox: List[List[int]] = None, custom_matrix: List[List[int]] = None, constant: int = 0x63) -> List[List[int]]:
        """Resolve S-box from ID or custom inputs."""
        # 1. Custom S-box (Direct)
        if custom_sbox:
            return custom_sbox
            
        # 2. Custom Matrix -> Construct S-box
        if custom_matrix:
            return construct_sbox(custom_matrix, constant)
            
        # 3. Predefined S-box ID
        if sbox_id:
            if sbox_id in self._sbox_cache:
                return self._sbox_cache[sbox_id]
                
            try:
                from services.matrix_service import matrix_service
            except ImportError:
                from .matrix_service import matrix_service

            matrix_data = matrix_service.get_by_id(sbox_id)
            if not matrix_data or not matrix_data.get("matrix"):
                 # Should we try fallback to KAES or just fail? Original failed.
                 raise ValueError(f"Unknown S-box ID: {sbox_id}")
            
            # Constant handling
            c = matrix_data.get("constant", "63")
            if c is None: c = "63"
            try:
                c_val = int(c, 16)
            except:
                c_val = 0x63
            
            if sbox_id == 'KAES':
                 c_val = 0x63
                 
            sbox = construct_sbox(matrix_data["matrix"], c_val)
            self._sbox_cache[sbox_id] = sbox
            return sbox
            
        # Default fallback (KAES)
        return self._resolve_sbox(sbox_id='KAES')
    
    def encrypt(
        self, 
        plaintext: str, 
        key: str, 
        sbox_id: str = None, 
        custom_sbox: List[List[int]] = None, 
        custom_matrix: List[List[int]] = None, 
        constant: int = 0x63
    ) -> str:
        """
        Encrypt plaintext using AES-128 with the resolved S-box.
        
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
             # Just truncate for now or error? Origin logic raised error.
             # Wait, standard AES usually pads.
             # Origin checked if len > BLOCK_SIZE
             pass
        if len(plaintext_bytes) > BLOCK_SIZE:
            raise ValueError(f"Plaintext too long. Max {BLOCK_SIZE} bytes for single-block mode.")
        
        # Pad to block size
        padded = pkcs7_pad(plaintext_bytes, BLOCK_SIZE)
        
        # Resolve S-box
        sbox = self._resolve_sbox(sbox_id, custom_sbox, custom_matrix, constant)
        
        # Encrypt
        key_bytes = key.encode('utf-8')
        ciphertext = aes_encrypt_block(padded, key_bytes, sbox)
        
        # Return as hex
        return ciphertext.hex().upper()
    
    def decrypt(
        self, 
        ciphertext_hex: str, 
        key: str, 
        sbox_id: str = None, 
        custom_sbox: List[List[int]] = None, 
        custom_matrix: List[List[int]] = None, 
        constant: int = 0x63
    ) -> str:
        """
        Decrypt ciphertext using AES-128 with the resolved S-box.
        
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
        
        # Resolve S-box
        sbox = self._resolve_sbox(sbox_id, custom_sbox, custom_matrix, constant)
        
        # Decrypt
        key_bytes = key.encode('utf-8')
        decrypted = aes_decrypt_block(ciphertext, key_bytes, sbox)
        
        # Remove padding
        try:
            unpadded = pkcs7_unpad(decrypted)
        except:
             # If padding fails, return raw or error? 
             # Usually means wrong key or sbox.
             # Let's just return what we have if unpad fails, or let it raise. 
             # pkcs7_unpad in core/aes probably handles checks.
             unpadded = decrypted # Fallback if padding logic is weird? No, let it raise or handle.
             # Actually, pkcs7_unpad should raise ValueError if padding invalid.
             # We'll re-raise or catch.
             # Let's stick to original behavior: it calls unpad.
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
