"""
Image Analysis Metrics

Calculates security and quality metrics for image encryption:
- Entropy
- NPCR (Number of Pixels Change Rate)
- UACI (Unified Average Changing Intensity)
- Correlation coefficients (Horizontal, Vertical, Diagonal)
"""

import numpy as np
from PIL import Image
import io
from typing import Dict, Tuple
import math


def calculate_entropy(image_data: bytes) -> float:
    """
    Calculate Shannon entropy of an image.
    
    For a well-encrypted image, entropy should be close to 8 (maximum for 8-bit).
    
    Args:
        image_data: Image bytes
        
    Returns:
        Entropy value (0-8)
    """
    img = Image.open(io.BytesIO(image_data)).convert('L')  # Grayscale
    pixels = np.array(img).flatten()
    
    # Calculate histogram
    histogram, _ = np.histogram(pixels, bins=256, range=(0, 256))
    histogram = histogram / histogram.sum()  # Normalize
    
    # Calculate entropy
    entropy = 0.0
    for p in histogram:
        if p > 0:
            entropy -= p * math.log2(p)
    
    return entropy


def calculate_npcr_uaci(original_data: bytes, encrypted_data: bytes) -> Tuple[float, float]:
    """
    Calculate NPCR and UACI metrics.
    
    NPCR: Number of Pixels Change Rate - percentage of different pixels
    UACI: Unified Average Changing Intensity - average intensity difference
    
    Ideal values: NPCR ≈ 99.6%, UACI ≈ 33.46%
    
    Args:
        original_data: Original image bytes
        encrypted_data: Encrypted image bytes
        
    Returns:
        (NPCR percentage, UACI percentage)
    """
    img1 = Image.open(io.BytesIO(original_data)).convert('RGB')
    img2 = Image.open(io.BytesIO(encrypted_data)).convert('RGB')
    
    # Resize to same dimensions if needed
    if img1.size != img2.size:
        img2 = img2.resize(img1.size)
    
    pixels1 = np.array(img1, dtype=np.float64)
    pixels2 = np.array(img2, dtype=np.float64)
    
    # NPCR calculation
    diff = np.abs(pixels1 - pixels2)
    changed_pixels = np.count_nonzero(diff)
    total_pixels = pixels1.size
    npcr = (changed_pixels / total_pixels) * 100
    
    # UACI calculation
    uaci = (np.sum(diff) / (255.0 * total_pixels)) * 100
    
    return npcr, uaci


def calculate_correlation(image_data: bytes, num_samples: int = 1000) -> Dict[str, float]:
    """
    Calculate correlation coefficients between adjacent pixels.
    
    For a well-encrypted image, correlation should be close to 0.
    For original images, correlation is typically close to 1.
    
    Args:
        image_data: Image bytes
        num_samples: Number of pixel pairs to sample
        
    Returns:
        Dictionary with horizontal, vertical, diagonal correlations
    """
    img = Image.open(io.BytesIO(image_data)).convert('L')
    pixels = np.array(img, dtype=np.float64)
    height, width = pixels.shape
    
    def correlation_coefficient(x: np.ndarray, y: np.ndarray) -> float:
        """Calculate Pearson correlation coefficient."""
        if len(x) == 0 or len(y) == 0:
            return 0.0
        
        mean_x = np.mean(x)
        mean_y = np.mean(y)
        
        numerator = np.sum((x - mean_x) * (y - mean_y))
        denominator = np.sqrt(np.sum((x - mean_x)**2) * np.sum((y - mean_y)**2))
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator
    
    # Sample random positions
    np.random.seed(42)  # For reproducibility
    num_samples = min(num_samples, (height - 1) * (width - 1))
    
    # Horizontal correlation
    h_x, h_y = [], []
    for _ in range(num_samples):
        row = np.random.randint(0, height)
        col = np.random.randint(0, width - 1)
        h_x.append(pixels[row, col])
        h_y.append(pixels[row, col + 1])
    
    # Vertical correlation
    v_x, v_y = [], []
    for _ in range(num_samples):
        row = np.random.randint(0, height - 1)
        col = np.random.randint(0, width)
        v_x.append(pixels[row, col])
        v_y.append(pixels[row + 1, col])
    
    # Diagonal correlation
    d_x, d_y = [], []
    for _ in range(num_samples):
        row = np.random.randint(0, height - 1)
        col = np.random.randint(0, width - 1)
        d_x.append(pixels[row, col])
        d_y.append(pixels[row + 1, col + 1])
    
    return {
        'horizontal': correlation_coefficient(np.array(h_x), np.array(h_y)),
        'vertical': correlation_coefficient(np.array(v_x), np.array(v_y)),
        'diagonal': correlation_coefficient(np.array(d_x), np.array(d_y)),
    }


def analyze_encryption(original_data: bytes, encrypted_data: bytes) -> Dict[str, float]:
    """
    Perform complete analysis of encryption quality.
    
    Args:
        original_data: Original image bytes
        encrypted_data: Encrypted image bytes
        
    Returns:
        Dictionary with all metrics
    """
    # Calculate entropy of encrypted image
    entropy = calculate_entropy(encrypted_data)
    
    # Calculate NPCR and UACI
    npcr, uaci = calculate_npcr_uaci(original_data, encrypted_data)
    
    # Calculate correlation of encrypted image
    correlation = calculate_correlation(encrypted_data)
    
    return {
        'entropy': entropy,
        'npcr': npcr,
        'uaci': uaci,
        'correlationH': correlation['horizontal'],
        'correlationV': correlation['vertical'],
        'correlationD': correlation['diagonal'],
    }
