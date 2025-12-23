"""
S-box Service

Handles S-box construction and analysis.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import time
from typing import List, Dict, Tuple, Optional

from backend.core import construct_sbox, find_fixed_points, analyze_sbox


class SboxService:
    """Service for S-box construction and analysis."""
    
    def construct_and_analyze(
        self,
        matrix: List[List[int]],
        constant: int
    ) -> Tuple[List[List[int]], Dict, List[int], int]:
        """
        Construct S-box and run full analysis.
        
        Args:
            matrix: 8x8 affine matrix
            constant: Affine constant (0-255)
        
        Returns:
            (sbox, analysis_metrics, fixed_points, calculation_time_ms)
        """
        start_time = time.perf_counter()
        
        # Construct S-box
        sbox = construct_sbox(matrix, constant)
        
        # Run analysis
        metrics = analyze_sbox(sbox)
        
        # Find fixed points
        flat_sbox = [val for row in sbox for val in row]
        fixed_points = find_fixed_points(flat_sbox)
        
        # Calculate time
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        
        return sbox, metrics, fixed_points, elapsed_ms

    def analyze_custom_sbox(
        self,
        sbox: List[List[int]]
    ) -> Tuple[List[List[int]], Dict, List[int], int]:
        """
        Analyze a custom provided S-box.
        
        Args:
            sbox: 16x16 table of integers (0-255)
        
        Returns:
            (sbox, analysis_metrics, fixed_points, calculation_time_ms)
        """
        start_time = time.perf_counter()
        
        # Run analysis directly
        metrics = analyze_sbox(sbox)
        
        # Find fixed points
        flat_sbox = [val for row in sbox for val in row]
        fixed_points = find_fixed_points(flat_sbox)
        
        # Calculate time
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        
        return sbox, metrics, fixed_points, elapsed_ms


# Singleton instance
sbox_service = SboxService()
