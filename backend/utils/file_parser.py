"""
File Parser Utility

Parses CSV and XLSX files containing matrix data.
"""

import io
from typing import List
import pandas as pd


def parse_matrix_file(content: bytes, extension: str) -> List[List[int]]:
    """
    Parse a matrix file (CSV or XLSX) into a 2D list.
    
    Args:
        content: File content as bytes
        extension: File extension (csv, xlsx, xls)
    
    Returns:
        Matrix as nested list of integers
    
    Raises:
        ValueError: If file cannot be parsed
    """
    try:
        if extension == "csv":
            df = pd.read_csv(io.BytesIO(content), header=None)
        else:  # xlsx or xls
            df = pd.read_excel(io.BytesIO(content), header=None)
        
        # Convert to list of lists
        matrix = df.values.tolist()
        
        # Convert all values to integers
        matrix = [[int(val) for val in row] for row in matrix]
        
        return matrix
        
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")
