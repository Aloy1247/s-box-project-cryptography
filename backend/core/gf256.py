"""
GF(2^8) Galois Field Operations

Implements finite field arithmetic over GF(2^8) using the AES irreducible polynomial:
x^8 + x^4 + x^3 + x + 1 (0x11B)

All operations are explicitly implemented for research transparency.
No black-box cryptographic libraries are used.
"""

import numpy as np
from typing import List, Tuple


# AES irreducible polynomial: x^8 + x^4 + x^3 + x + 1
IRREDUCIBLE_POLY = 0x11B


def gf_add(a: int, b: int) -> int:
    """
    Addition in GF(2^8) is XOR.
    
    Args:
        a: First operand (0-255)
        b: Second operand (0-255)
    
    Returns:
        a XOR b
    """
    return a ^ b


def gf_mul(a: int, b: int, poly: int = IRREDUCIBLE_POLY) -> int:
    """
    Multiplication in GF(2^8) using Russian peasant algorithm.
    
    Args:
        a: First operand (0-255)
        b: Second operand (0-255)
        poly: Irreducible polynomial (default: AES polynomial)
    
    Returns:
        a * b mod poly
    """
    result = 0
    while b:
        if b & 1:
            result ^= a
        a <<= 1
        if a & 0x100:
            a ^= poly
        b >>= 1
    return result


def gf_pow(base: int, exp: int, poly: int = IRREDUCIBLE_POLY) -> int:
    """
    Exponentiation in GF(2^8) using square-and-multiply.
    
    Args:
        base: Base value (0-255)
        exp: Exponent
        poly: Irreducible polynomial
    
    Returns:
        base^exp mod poly
    """
    if exp == 0:
        return 1
    
    result = 1
    while exp:
        if exp & 1:
            result = gf_mul(result, base, poly)
        base = gf_mul(base, base, poly)
        exp >>= 1
    return result


def gf_inverse(a: int, poly: int = IRREDUCIBLE_POLY) -> int:
    """
    Multiplicative inverse in GF(2^8).
    
    Uses Fermat's little theorem: a^(-1) = a^(2^8 - 2) = a^254
    
    Args:
        a: Value to invert (0-255)
        poly: Irreducible polynomial
    
    Returns:
        Multiplicative inverse of a, or 0 if a=0
    """
    if a == 0:
        return 0
    return gf_pow(a, 254, poly)


def generate_inverse_table(poly: int = IRREDUCIBLE_POLY) -> List[int]:
    """
    Generate lookup table for multiplicative inverses.
    
    Args:
        poly: Irreducible polynomial
    
    Returns:
        List of 256 inverse values
    """
    return [gf_inverse(i, poly) for i in range(256)]


def generate_log_antilog_tables(
    generator: int = 0x03, 
    poly: int = IRREDUCIBLE_POLY
) -> Tuple[List[int], List[int]]:
    """
    Generate logarithm and antilogarithm tables for GF(2^8).
    
    Args:
        generator: Primitive element (default: 3 for AES)
        poly: Irreducible polynomial
    
    Returns:
        (log_table, antilog_table)
    """
    log_table = [0] * 256
    antilog_table = [0] * 256
    
    val = 1
    for i in range(255):
        antilog_table[i] = val
        log_table[val] = i
        val = gf_mul(val, generator, poly)
    
    # Handle wraparound
    antilog_table[255] = antilog_table[0]
    
    return log_table, antilog_table


# Pre-computed inverse table for performance
INVERSE_TABLE = generate_inverse_table()


def get_inverse(a: int) -> int:
    """
    Get multiplicative inverse using pre-computed table.
    
    Args:
        a: Value (0-255)
    
    Returns:
        Multiplicative inverse
    """
    return INVERSE_TABLE[a]
