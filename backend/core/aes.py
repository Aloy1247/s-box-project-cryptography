"""
AES Core Implementation with Custom S-box Support

This module implements AES-128 single-block encryption/decryption 
with the ability to use custom S-boxes derived from affine matrices.
"""

import numpy as np
from typing import List, Tuple
import sys
from pathlib import Path

# Ensure core module can be found
_core_dir = Path(__file__).parent
if str(_core_dir) not in sys.path:
    sys.path.insert(0, str(_core_dir))

from gf256 import gf_mul


# AES constants
BLOCK_SIZE = 16  # 128 bits = 16 bytes
KEY_SIZE = 16    # 128 bits = 16 bytes
NUM_ROUNDS = 10  # For AES-128


# Round constants for key expansion
RCON = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36
]


def generate_inverse_sbox(sbox: List[List[int]]) -> List[List[int]]:
    """Generate inverse S-box from forward S-box."""
    # Flatten the 16x16 S-box to 256 elements
    flat_sbox = [sbox[i][j] for i in range(16) for j in range(16)]
    
    # Create inverse mapping
    inv_flat = [0] * 256
    for i, val in enumerate(flat_sbox):
        inv_flat[val] = i
    
    # Reshape back to 16x16
    inv_sbox = [[inv_flat[i * 16 + j] for j in range(16)] for i in range(16)]
    return inv_sbox


def sub_bytes(state: List[List[int]], sbox: List[List[int]]) -> List[List[int]]:
    """Apply SubBytes transformation using the given S-box."""
    result = [[0] * 4 for _ in range(4)]
    for i in range(4):
        for j in range(4):
            byte_val = state[i][j]
            row = (byte_val >> 4) & 0x0F
            col = byte_val & 0x0F
            result[i][j] = sbox[row][col]
    return result


def inv_sub_bytes(state: List[List[int]], inv_sbox: List[List[int]]) -> List[List[int]]:
    """Apply InvSubBytes transformation using the inverse S-box."""
    return sub_bytes(state, inv_sbox)


def shift_rows(state: List[List[int]]) -> List[List[int]]:
    """Apply ShiftRows transformation."""
    result = [row[:] for row in state]
    # Row 0: no shift
    # Row 1: shift left by 1
    result[1] = state[1][1:] + state[1][:1]
    # Row 2: shift left by 2
    result[2] = state[2][2:] + state[2][:2]
    # Row 3: shift left by 3
    result[3] = state[3][3:] + state[3][:3]
    return result


def inv_shift_rows(state: List[List[int]]) -> List[List[int]]:
    """Apply InvShiftRows transformation."""
    result = [row[:] for row in state]
    # Row 0: no shift
    # Row 1: shift right by 1
    result[1] = state[1][-1:] + state[1][:-1]
    # Row 2: shift right by 2
    result[2] = state[2][-2:] + state[2][:-2]
    # Row 3: shift right by 3
    result[3] = state[3][-3:] + state[3][:-3]
    return result


def mix_columns(state: List[List[int]]) -> List[List[int]]:
    """Apply MixColumns transformation."""
    result = [[0] * 4 for _ in range(4)]
    
    for col in range(4):
        # Extract column
        s0 = state[0][col]
        s1 = state[1][col]
        s2 = state[2][col]
        s3 = state[3][col]
        
        # MixColumns matrix multiplication in GF(2^8)
        result[0][col] = gf_mul(0x02, s0) ^ gf_mul(0x03, s1) ^ s2 ^ s3
        result[1][col] = s0 ^ gf_mul(0x02, s1) ^ gf_mul(0x03, s2) ^ s3
        result[2][col] = s0 ^ s1 ^ gf_mul(0x02, s2) ^ gf_mul(0x03, s3)
        result[3][col] = gf_mul(0x03, s0) ^ s1 ^ s2 ^ gf_mul(0x02, s3)
    
    return result


def inv_mix_columns(state: List[List[int]]) -> List[List[int]]:
    """Apply InvMixColumns transformation."""
    result = [[0] * 4 for _ in range(4)]
    
    for col in range(4):
        s0 = state[0][col]
        s1 = state[1][col]
        s2 = state[2][col]
        s3 = state[3][col]
        
        # InvMixColumns matrix multiplication in GF(2^8)
        result[0][col] = gf_mul(0x0e, s0) ^ gf_mul(0x0b, s1) ^ gf_mul(0x0d, s2) ^ gf_mul(0x09, s3)
        result[1][col] = gf_mul(0x09, s0) ^ gf_mul(0x0e, s1) ^ gf_mul(0x0b, s2) ^ gf_mul(0x0d, s3)
        result[2][col] = gf_mul(0x0d, s0) ^ gf_mul(0x09, s1) ^ gf_mul(0x0e, s2) ^ gf_mul(0x0b, s3)
        result[3][col] = gf_mul(0x0b, s0) ^ gf_mul(0x0d, s1) ^ gf_mul(0x09, s2) ^ gf_mul(0x0e, s3)
    
    return result


def add_round_key(state: List[List[int]], round_key: List[List[int]]) -> List[List[int]]:
    """Apply AddRoundKey transformation (XOR with round key)."""
    result = [[0] * 4 for _ in range(4)]
    for i in range(4):
        for j in range(4):
            result[i][j] = state[i][j] ^ round_key[i][j]
    return result


def key_expansion(key: bytes, sbox: List[List[int]]) -> List[List[List[int]]]:
    """
    Expand the cipher key into round keys.
    Uses the provided S-box for the SubWord step.
    """
    # Convert key bytes to 4x4 state (column-major order)
    key_words = []
    for i in range(4):
        word = [key[i*4 + j] for j in range(4)]
        key_words.append(word)
    
    # Generate additional words
    for i in range(4, 44):  # 44 words for AES-128 (11 round keys * 4 words)
        temp = key_words[i - 1][:]
        
        if i % 4 == 0:
            # RotWord
            temp = temp[1:] + temp[:1]
            
            # SubWord using provided S-box
            for j in range(4):
                row = (temp[j] >> 4) & 0x0F
                col = temp[j] & 0x0F
                temp[j] = sbox[row][col]
            
            # XOR with Rcon
            temp[0] ^= RCON[(i // 4) - 1]
        
        # XOR with word i-4
        new_word = [key_words[i - 4][j] ^ temp[j] for j in range(4)]
        key_words.append(new_word)
    
    # Convert to round keys (4x4 matrices)
    round_keys = []
    for r in range(11):
        round_key = [[0] * 4 for _ in range(4)]
        for col in range(4):
            word = key_words[r * 4 + col]
            for row in range(4):
                round_key[row][col] = word[row]
        round_keys.append(round_key)
    
    return round_keys


def bytes_to_state(data: bytes) -> List[List[int]]:
    """Convert 16 bytes to 4x4 state matrix (column-major order)."""
    state = [[0] * 4 for _ in range(4)]
    for col in range(4):
        for row in range(4):
            state[row][col] = data[col * 4 + row]
    return state


def state_to_bytes(state: List[List[int]]) -> bytes:
    """Convert 4x4 state matrix to 16 bytes (column-major order)."""
    result = []
    for col in range(4):
        for row in range(4):
            result.append(state[row][col])
    return bytes(result)


def aes_encrypt_block(plaintext: bytes, key: bytes, sbox: List[List[int]]) -> bytes:
    """
    Encrypt a single 16-byte block using AES-128.
    
    Args:
        plaintext: 16 bytes of plaintext
        key: 16 bytes cipher key
        sbox: 16x16 S-box to use for SubBytes
    
    Returns:
        16 bytes of ciphertext
    """
    if len(plaintext) != BLOCK_SIZE:
        raise ValueError(f"Plaintext must be {BLOCK_SIZE} bytes, got {len(plaintext)}")
    if len(key) != KEY_SIZE:
        raise ValueError(f"Key must be {KEY_SIZE} bytes, got {len(key)}")
    
    # Key expansion
    round_keys = key_expansion(key, sbox)
    
    # Convert plaintext to state
    state = bytes_to_state(plaintext)
    
    # Initial round: AddRoundKey only
    state = add_round_key(state, round_keys[0])
    
    # Main rounds (1-9)
    for round_num in range(1, NUM_ROUNDS):
        state = sub_bytes(state, sbox)
        state = shift_rows(state)
        state = mix_columns(state)
        state = add_round_key(state, round_keys[round_num])
    
    # Final round (no MixColumns)
    state = sub_bytes(state, sbox)
    state = shift_rows(state)
    state = add_round_key(state, round_keys[NUM_ROUNDS])
    
    return state_to_bytes(state)


def aes_decrypt_block(ciphertext: bytes, key: bytes, sbox: List[List[int]]) -> bytes:
    """
    Decrypt a single 16-byte block using AES-128.
    
    Args:
        ciphertext: 16 bytes of ciphertext
        key: 16 bytes cipher key
        sbox: 16x16 S-box (forward S-box, inverse will be computed)
    
    Returns:
        16 bytes of plaintext
    """
    if len(ciphertext) != BLOCK_SIZE:
        raise ValueError(f"Ciphertext must be {BLOCK_SIZE} bytes, got {len(ciphertext)}")
    if len(key) != KEY_SIZE:
        raise ValueError(f"Key must be {KEY_SIZE} bytes, got {len(key)}")
    
    # Generate inverse S-box
    inv_sbox = generate_inverse_sbox(sbox)
    
    # Key expansion (uses forward S-box)
    round_keys = key_expansion(key, sbox)
    
    # Convert ciphertext to state
    state = bytes_to_state(ciphertext)
    
    # Initial round (reverse of final encryption round)
    state = add_round_key(state, round_keys[NUM_ROUNDS])
    state = inv_shift_rows(state)
    state = inv_sub_bytes(state, inv_sbox)
    
    # Main rounds (reverse order: 9 down to 1)
    for round_num in range(NUM_ROUNDS - 1, 0, -1):
        state = add_round_key(state, round_keys[round_num])
        state = inv_mix_columns(state)
        state = inv_shift_rows(state)
        state = inv_sub_bytes(state, inv_sbox)
    
    # Final AddRoundKey
    state = add_round_key(state, round_keys[0])
    
    return state_to_bytes(state)


def aes_decrypt_block_fast(
    ciphertext: bytes, 
    inv_sbox: List[List[int]], 
    round_keys: List[List[List[int]]]
) -> bytes:
    """
    Optimized decrypt using pre-computed inverse S-box and round keys.
    Use this for bulk decryption to avoid redundant computation.
    
    Args:
        ciphertext: 16 bytes of ciphertext
        inv_sbox: Pre-computed inverse S-box
        round_keys: Pre-computed round keys from key_expansion()
    
    Returns:
        16 bytes of plaintext
    """
    if len(ciphertext) != BLOCK_SIZE:
        raise ValueError(f"Ciphertext must be {BLOCK_SIZE} bytes, got {len(ciphertext)}")
    
    # Convert ciphertext to state
    state = bytes_to_state(ciphertext)
    
    # Initial round (reverse of final encryption round)
    state = add_round_key(state, round_keys[NUM_ROUNDS])
    state = inv_shift_rows(state)
    state = inv_sub_bytes(state, inv_sbox)
    
    # Main rounds (reverse order: 9 down to 1)
    for round_num in range(NUM_ROUNDS - 1, 0, -1):
        state = add_round_key(state, round_keys[round_num])
        state = inv_mix_columns(state)
        state = inv_shift_rows(state)
        state = inv_sub_bytes(state, inv_sbox)
    
    # Final AddRoundKey
    state = add_round_key(state, round_keys[0])
    
    return state_to_bytes(state)


def aes_encrypt_block_fast(
    plaintext: bytes, 
    sbox: List[List[int]], 
    round_keys: List[List[List[int]]]
) -> bytes:
    """
    Optimized encrypt using pre-computed round keys.
    Use this for bulk encryption to avoid redundant computation.
    
    Args:
        plaintext: 16 bytes of plaintext
        sbox: S-box for substitution
        round_keys: Pre-computed round keys from key_expansion()
    
    Returns:
        16 bytes of ciphertext
    """
    if len(plaintext) != BLOCK_SIZE:
        raise ValueError(f"Plaintext must be {BLOCK_SIZE} bytes, got {len(plaintext)}")
    
    # Convert plaintext to state
    state = bytes_to_state(plaintext)
    
    # Initial round
    state = add_round_key(state, round_keys[0])
    
    # Main rounds
    for round_num in range(1, NUM_ROUNDS):
        state = sub_bytes(state, sbox)
        state = shift_rows(state)
        state = mix_columns(state)
        state = add_round_key(state, round_keys[round_num])
    
    # Final round (no MixColumns)
    state = sub_bytes(state, sbox)
    state = shift_rows(state)
    state = add_round_key(state, round_keys[NUM_ROUNDS])
    
    return state_to_bytes(state)


def pkcs7_pad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:
    """Apply PKCS#7 padding."""
    padding_len = block_size - (len(data) % block_size)
    if padding_len == 0:
        padding_len = block_size
    return data + bytes([padding_len] * padding_len)


def pkcs7_unpad(data: bytes) -> bytes:
    """Remove PKCS#7 padding."""
    if not data:
        raise ValueError("Cannot unpad empty data")
    padding_len = data[-1]
    if padding_len > len(data) or padding_len > BLOCK_SIZE:
        raise ValueError("Invalid padding")
    # Verify padding
    for i in range(padding_len):
        if data[-(i + 1)] != padding_len:
            raise ValueError("Invalid padding")
    return data[:-padding_len]
