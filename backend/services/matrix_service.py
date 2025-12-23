"""
Matrix Service

Handles loading and managing predefined affine matrices.
"""

import json
from pathlib import Path
from typing import List, Optional, Dict

# Path to matrices data file
# We'll try multiple locations to be robust across different environments (Vercel, Local, Docker)
CANDIDATE_PATHS = [
    Path(__file__).parent.parent / "data" / "matrices.json",
    Path.cwd() / "backend" / "data" / "matrices.json",
    Path.cwd() / "data" / "matrices.json",
    Path("backend/data/matrices.json").resolve(),
]

class MatrixService:
    """Service for managing affine matrices."""
    
    def __init__(self):
        self._matrices: Dict[str, dict] = {}
        self._load_matrices()
    
    def _load_matrices(self):
        """Load matrices from JSON file."""
        self._matrices = {}
        
        data_path = None
        for path in CANDIDATE_PATHS:
            if path.exists():
                data_path = path
                break
        
        if data_path and data_path.exists():
            try:
                with open(data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for m in data.get("matrices", []):
                        self._matrices[m["id"]] = m
                print(f"[MatrixService] Loaded {len(self._matrices)} matrices from {data_path}")
            except Exception as e:
                print(f"[MatrixService] Failed to load matrices from {data_path}: {e}")
        else:
            print(f"[MatrixService] Warning: matrices.json not found in any candidate path: {[str(p) for p in CANDIDATE_PATHS]}")
    
    def reload(self):
        """Force reload matrices from file."""
        self._load_matrices()
    
    def get_all(self) -> List[dict]:
        """Get all matrix summaries."""
        return [
            {
                "id": m["id"],
                "name": m["name"],
                "author": m.get("author"),
                "tags": m.get("tags", []),
                "status": m.get("status", "placeholder"),
                "hasMatrix": m.get("matrix") is not None,
            }
            for m in self._matrices.values()
        ]
    
    def get_by_id(self, matrix_id: str) -> Optional[dict]:
        """Get full matrix details by ID."""
        return self._matrices.get(matrix_id)
    
    def exists(self, matrix_id: str) -> bool:
        """Check if matrix exists."""
        return matrix_id in self._matrices
    
    def has_matrix_data(self, matrix_id: str) -> bool:
        """Check if matrix has actual data (not placeholder)."""
        m = self._matrices.get(matrix_id)
        return m is not None and m.get("matrix") is not None


# Create singleton - reload to get fresh data
matrix_service = MatrixService()
