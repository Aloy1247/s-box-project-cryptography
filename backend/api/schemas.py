"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


# Matrix types
Matrix8x8 = List[List[int]]
SBox16x16 = List[List[int]]


class MatrixSummary(BaseModel):
    """Summary of a matrix for listing."""
    id: str
    name: str
    author: Optional[str] = None
    tags: List[str] = []
    status: str
    hasMatrix: bool


class MatrixDetail(BaseModel):
    """Full matrix details."""
    id: str
    name: str
    author: Optional[str] = None
    tags: List[str] = []
    status: str
    matrix: Optional[Matrix8x8] = None
    constant: Optional[str] = None


class MatrixListResponse(BaseModel):
    """Response for GET /api/matrices."""
    matrices: List[MatrixSummary]


class ValidationResult(BaseModel):
    """Result of matrix validation."""
    valid: bool
    matrix: Optional[Matrix8x8] = None
    rank: Optional[int] = None
    invertible: Optional[bool] = None
    error: Optional[str] = None
    details: Optional[dict] = None


class AnalyzeRequest(BaseModel):
    """Request for POST /api/analyze."""
    matrixId: Optional[str] = None
    customMatrix: Optional[Matrix8x8] = None
    customSBox: Optional[SBox16x16] = None
    constant: str = "63"
    
    @field_validator('constant')
    @classmethod
    def validate_constant(cls, v):
        try:
            val = int(v, 16)
            if not 0 <= val <= 255:
                raise ValueError("Constant must be 0x00-0xFF")
        except ValueError:
            raise ValueError("Constant must be valid hex (e.g., '63')")
        return v


class AnalysisMetrics(BaseModel):
    """All 10 cryptographic metrics."""
    nl: int = Field(description="Non-Linearity")
    sac: float = Field(description="Strict Avalanche Criterion")
    bicNl: int = Field(description="BIC Non-Linearity")
    bicSac: float = Field(description="BIC SAC")
    lap: float = Field(description="Linear Approximation Probability")
    dap: float = Field(description="Differential Approximation Probability")
    du: int = Field(description="Differential Uniformity")
    ad: int = Field(description="Algebraic Degree")
    to: float = Field(description="Transparency Order")
    ci: int = Field(description="Correlation Immunity")


class AnalyzeResponse(BaseModel):
    """Response for POST /api/analyze."""
    matrix: Matrix8x8
    sbox: SBox16x16
    analysis: AnalysisMetrics
    fixedPoints: List[int]
    calculationTimeMs: int


class ExportRequest(BaseModel):
    """Request for POST /api/export."""
    matrixId: Optional[str] = None
    customMatrix: Optional[Matrix8x8] = None
    constant: str = "63"
    format: str = "xlsx"
    include: List[str] = ["matrix", "sbox", "analysis"]


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    matrixId: Optional[str] = None
