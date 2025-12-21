"""
Affine Transformation Module

Implements the affine transformation step of AES-style S-box construction:
S(x) = M * x^(-1) + c

where:
- M is the 8x8 affine matrix over GF(2)
- c is the affine constant
- x^(-1) is the multiplicative inverse in GF(2^8)
"""

import numpy as np
from typing import List
from .gf256 import get_inverse


def int_to_bits(val: int) -> np.ndarray:
    """
    Convert an integer (0-255) to an 8-bit column vector.
    
    Args:
        val: Integer value (0-255)
    
    Returns:
        numpy array of shape (8,) with LSB first
    """
    return np.array([(val >> i) & 1 for i in range(8)], dtype=np.uint8)


def bits_to_int(bits: np.ndarray) -> int:
    """
    Convert an 8-bit vector to an integer.
    
    Args:
        bits: numpy array of shape (8,) with LSB first
    
    Returns:
        Integer value (0-255)
    """
    result = 0
    for i in range(8):
        if bits[i]:
            result |= (1 << i)
    return result


def apply_affine_transform(
    inverse_val: int,
    matrix: np.ndarray,
    constant: int
) -> int:
    """
    Apply affine transformation: S = M * x + c (over GF(2))
    
    Args:
        inverse_val: The multiplicative inverse x^(-1)
        matrix: 8x8 affine matrix
        constant: Affine constant (0-255)
    
    Returns:
        Transformed value (0-255)
    """
    # Convert to bit vectors
    x_bits = int_to_bits(inverse_val)
    c_bits = int_to_bits(constant)
    
    # Matrix multiplication over GF(2): result = M @ x mod 2
    result_bits = np.dot(matrix, x_bits) % 2
    
    # Add constant over GF(2): result = result XOR c
    result_bits = (result_bits + c_bits) % 2
    
    return bits_to_int(result_bits.astype(np.uint8))


def construct_sbox(
    matrix: List[List[int]],
    constant: int
) -> List[List[int]]:
    """
    Construct a 256-element S-box using AES methodology.
    
    Process:
    1. For each input x (0-255):
       a. Compute x^(-1) in GF(2^8)
       b. Apply affine transformation: S(x) = M * x^(-1) + c
    
    Args:
        matrix: 8x8 affine matrix as nested list
        constant: Affine constant (0-255)
    
    Returns:
        16x16 S-box as nested list (row-major)
    """
    # Convert matrix to numpy array
    M = np.array(matrix, dtype=np.uint8)
    
    # Generate 256-element S-box
    sbox_flat = []
    for x in range(256):
        # Step 1: Multiplicative inverse
        inv = get_inverse(x)
        
        # Step 2: Affine transformation
        s = apply_affine_transform(inv, M, constant)
        sbox_flat.append(s)
    
    # Reshape to 16x16 grid
    sbox = [sbox_flat[i*16:(i+1)*16] for i in range(16)]
    
    return sbox


def construct_inverse_sbox(
    matrix: List[List[int]],
    constant: int
) -> List[List[int]]:
    """
    Construct the inverse S-box for decryption.
    
    The inverse S-box is computed by inverting the forward S-box:
    InvS[S[x]] = x for all x in 0-255
    
    Args:
        matrix: 8x8 affine matrix as nested list
        constant: Affine constant (0-255)
    
    Returns:
        16x16 inverse S-box as nested list (row-major)
    """
    # First construct the forward S-box
    sbox = construct_sbox(matrix, constant)
    
    # Flatten the S-box
    sbox_flat = []
    for row in sbox:
        sbox_flat.extend(row)
    
    # Create inverse by swapping indices and values
    inv_sbox_flat = [0] * 256
    for x in range(256):
        inv_sbox_flat[sbox_flat[x]] = x
    
    # Reshape to 16x16 grid
    inv_sbox = [inv_sbox_flat[i*16:(i+1)*16] for i in range(16)]
    
    return inv_sbox


def find_fixed_points(sbox_flat: List[int]) -> List[int]:
    """
    Find fixed points where S(x) = x.
    
    Args:
        sbox_flat: 256-element S-box as flat list
    
    Returns:
        List of fixed point values
    """
    fixed = []
    for x in range(256):
        if sbox_flat[x] == x:
            fixed.append(x)
    return fixed


def validate_matrix(matrix: List[List[int]]) -> tuple:
    """
    Validate that a matrix is 8x8, binary, and invertible.
    
    Args:
        matrix: Matrix to validate
    
    Returns:
        (is_valid, error_message, details)
    """
    # Check dimensions
    if len(matrix) != 8:
        return False, f"Matrix must have 8 rows. Found {len(matrix)}.", {"rows": len(matrix)}
    
    for i, row in enumerate(matrix):
        if len(row) != 8:
            return False, f"Row {i+1} must have 8 columns. Found {len(row)}.", {"row": i+1, "cols": len(row)}
    
    # Check binary values
    for i, row in enumerate(matrix):
        for j, val in enumerate(row):
            if val not in (0, 1):
                return False, f"All values must be 0 or 1. Found {val} at [{i+1},{j+1}].", {"row": i+1, "col": j+1, "value": val}
    
    # Check invertibility (rank = 8)
    M = np.array(matrix, dtype=np.float64)
    rank = np.linalg.matrix_rank(M)
    if rank != 8:
        return False, f"Matrix must be invertible (rank=8). Found rank={rank}.", {"rank": rank}
    
    return True, None, {"rank": 8, "invertible": True}
