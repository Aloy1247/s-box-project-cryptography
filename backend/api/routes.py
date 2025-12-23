"""
API Routes

FastAPI endpoints for S-box Forge.
"""

import sys
from typing import List, Optional
from pathlib import Path
# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import io
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from .schemas import (
    MatrixListResponse,
    MatrixDetail,
    MatrixSummary,
    ValidationResult,
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisMetrics,
    ExportRequest,
    ErrorResponse,
)
from backend.services import matrix_service, sbox_service
from backend.core import validate_matrix
from backend.utils.file_parser import parse_matrix_file


router = APIRouter(prefix="/api", tags=["S-box API"])


@router.get("/matrices", response_model=MatrixListResponse)
async def list_matrices():
    """
    List all available predefined matrices.
    
    Returns summary info for each matrix without the actual matrix data.
    """
    matrices = matrix_service.get_all()
    return MatrixListResponse(
        matrices=[MatrixSummary(**m) for m in matrices]
    )


@router.get("/matrices/{matrix_id}", response_model=MatrixDetail)
async def get_matrix(matrix_id: str):
    """
    Get full details of a specific matrix.
    
    Returns the matrix data if available, or null if placeholder.
    """
    matrix = matrix_service.get_by_id(matrix_id)
    
    if matrix is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "Matrix not found", "matrixId": matrix_id}
        )
    
    return MatrixDetail(
        id=matrix["id"],
        name=matrix["name"],
        author=matrix.get("author"),
        tags=matrix.get("tags", []),
        status=matrix.get("status", "placeholder"),
        matrix=matrix.get("matrix"),
        constant=matrix.get("constant"),
    )


@router.post("/matrices/validate", response_model=ValidationResult)
async def validate_custom_matrix(file: UploadFile = File(...)):
    """
    Validate a custom matrix file (CSV or XLSX).
    
    Checks:
    - File format (CSV or XLSX)
    - Dimensions (8x8)
    - Binary values (0/1)
    - Invertibility (rank = 8)
    """
    # Check file extension
    filename = file.filename or ""
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    
    if ext not in ("csv", "xlsx", "xls"):
        return ValidationResult(
            valid=False,
            error="Unsupported file format. Use CSV or XLSX.",
            details={"filename": filename, "extension": ext}
        )
    
    # Read file content
    content = await file.read()
    
    # Parse file
    try:
        matrix = parse_matrix_file(content, ext)
    except Exception as e:
        return ValidationResult(
            valid=False,
            error=f"Failed to parse file: {str(e)}",
            details={"filename": filename}
        )
    
    # Validate matrix
    valid, error, details = validate_matrix(matrix)
    
    if valid:
        return ValidationResult(
            valid=True,
            matrix=matrix,
            rank=8,
            invertible=True
        )
    else:
        return ValidationResult(
            valid=False,
            error=error,
            details=details
        )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Construct S-box and run full cryptographic analysis.
    
    Either matrixId or customMatrix must be provided.
    Returns the S-box, all 10 analysis metrics, and fixed points.
    """
    # Get matrix data
    import traceback
    try:
        if request.matrixId:
            matrix_data = matrix_service.get_by_id(request.matrixId)
            
            if matrix_data is None:
                raise HTTPException(
                    status_code=404,
                    detail={"error": "Matrix not found", "matrixId": request.matrixId}
                )
            
            matrix = matrix_data.get("matrix")
            if matrix is None:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Matrix data not available (placeholder)",
                        "matrixId": request.matrixId
                    }
                )
            
            # Use matrix's constant if not specified
            constant_hex = request.constant or matrix_data.get("constant", "63")
            
            # Parse constant
            try:
                 constant = int(constant_hex, 16)
            except:
                 constant = 0x63

            # Construct and analyze
            sbox, metrics, fixed_points, calc_time = sbox_service.construct_and_analyze(
                matrix, constant
            )
            
        elif request.customMatrix:
            matrix = request.customMatrix
            constant_hex = request.constant
            
            # Validate custom matrix
            valid, error, details = validate_matrix(matrix)
            if not valid:
                raise HTTPException(
                    status_code=422,
                    detail={"error": error, "details": details}
                )
                
            # Parse constant
            constant = int(constant_hex, 16)
            
            # Construct and analyze
            sbox, metrics, fixed_points, calc_time = sbox_service.construct_and_analyze(
                matrix, constant
            )
            
        elif request.customSBox:
            sbox_input = request.customSBox
            matrix = [] # No matrix
            
            # Basic validation
            if len(sbox_input) != 16 or any(len(row) != 16 for row in sbox_input):
                 raise HTTPException(status_code=422, detail={"error": "S-box must be 16x16"})
                 
            # Analyze directly
            sbox, metrics, fixed_points, calc_time = sbox_service.analyze_custom_sbox(sbox_input)
            
        else:
            raise HTTPException(
                status_code=400,
                detail={"error": "Either matrixId, customMatrix, or customSBox must be provided"}
            )
        
        return AnalyzeResponse(
            matrix=matrix,
            sbox=sbox,
            analysis=AnalysisMetrics(**metrics),
            fixedPoints=fixed_points,
            calculationTimeMs=calc_time
        )
    except HTTPException:
        raise
    except Exception as e:
        print("Error in analyze endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/export")
async def export_report(request: ExportRequest):
    """
    Export S-box and analysis results as CSV or XLSX.
    """
    # Get matrix (same logic as analyze)
    if request.matrixId:
        matrix_data = matrix_service.get_by_id(request.matrixId)
        if matrix_data is None or matrix_data.get("matrix") is None:
            raise HTTPException(status_code=404, detail="Matrix not found or placeholder")
        matrix = matrix_data["matrix"]
        constant_hex = request.constant or matrix_data.get("constant", "63")
        filename_prefix = f"sbox_{request.matrixId}"
    elif request.customMatrix:
        matrix = request.customMatrix
        constant_hex = request.constant
        filename_prefix = "sbox_custom"
    else:
        raise HTTPException(status_code=400, detail="Matrix required")
    
    constant = int(constant_hex, 16)
    
    # Construct and analyze
    sbox, metrics, fixed_points, _ = sbox_service.construct_and_analyze(matrix, constant)
    
    # Create Excel/CSV
    output = io.BytesIO()
    
    if request.format == "xlsx":
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if "matrix" in request.include:
                df_matrix = pd.DataFrame(matrix)
                df_matrix.to_excel(writer, sheet_name="Affine Matrix", index=False, header=False)
            
            if "sbox" in request.include:
                df_sbox = pd.DataFrame(sbox)
                # Add hex column headers (0-F)
                df_sbox.columns = [f"{i:X}" for i in range(16)]
                # Add hex row headers (00, 10, 20, ... F0)
                df_sbox.index = [f"{i:X}0" for i in range(16)]
                df_sbox.to_excel(writer, sheet_name="S-Box")
            
            if "analysis" in request.include:
                df_analysis = pd.DataFrame([
                    {"Metric": k.upper(), "Value": v}
                    for k, v in metrics.items()
                ])
                df_analysis.to_excel(writer, sheet_name="Analysis", index=False)
        
        output.seek(0)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
        # Generate filename based on what's exported
        if len(request.include) == 1:
            if "matrix" in request.include:
                filename = f"{filename_prefix}_affine_matrix.xlsx"
            elif "sbox" in request.include:
                filename = f"{filename_prefix}_sbox_table.xlsx"
            else:
                filename = f"{filename_prefix}_analysis.xlsx"
        else:
            filename = f"{filename_prefix}_report.xlsx"
    else:
        # CSV format - S-box with headers
        df_sbox = pd.DataFrame(sbox)
        # Add hex column headers (0-F)
        df_sbox.columns = [f"{i:X}" for i in range(16)]
        # Add hex row headers (00, 10, 20, ... F0)
        df_sbox.index = [f"{i:X}0" for i in range(16)]
        df_sbox.to_csv(output, index=True)
        output.seek(0)
        media_type = "text/csv"
        filename = f"{filename_prefix}_sbox.csv"
    
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============ AES Encrypt/Decrypt Endpoints ============

from pydantic import BaseModel



class AESEncryptRequest(BaseModel):
    plaintext: str
    key: str
    sboxId: Optional[str] = None
    customSBox: Optional[List[List[int]]] = None
    customMatrix: Optional[List[List[int]]] = None
    constant: Optional[str] = "63"


class AESDecryptRequest(BaseModel):
    ciphertext: str
    key: str
    sboxId: Optional[str] = None
    customSBox: Optional[List[List[int]]] = None
    customMatrix: Optional[List[List[int]]] = None
    constant: Optional[str] = "63"


class AESEncryptResponse(BaseModel):
    ciphertext: str
    sboxUsed: str


class AESDecryptResponse(BaseModel):
    plaintext: str
    sboxUsed: str


@router.post("/aes/encrypt", response_model=AESEncryptResponse)
async def aes_encrypt(request: AESEncryptRequest):
    """
    Encrypt plaintext using AES-128 with the specified S-box.
    
    Single-block encryption (max 16 bytes) without mode of operation.
    Consistent with S-box research methodology.
    """
    from backend.services.aes_service import aes_service
    
    try:
        # Determine constant
        c_val = 0x63
        if request.constant:
             try:
                 c_val = int(request.constant, 16)
             except:
                 pass
                 
        ciphertext = aes_service.encrypt(
            plaintext=request.plaintext,
            key=request.key,
            sbox_id=request.sboxId,
            custom_sbox=request.customSBox,
            custom_matrix=request.customMatrix,
            constant=c_val
        )
        return AESEncryptResponse(
            ciphertext=ciphertext,
            sboxUsed=request.sboxId or "Custom"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")


@router.post("/aes/decrypt", response_model=AESDecryptResponse)
async def aes_decrypt(request: AESDecryptRequest):
    """
    Decrypt ciphertext using AES-128 with the specified S-box.
    
    Single-block decryption without mode of operation.
    Input must be 32-character hex string (16 bytes).
    """
    from backend.services.aes_service import aes_service
    
    try:
        # Determine constant
        c_val = 0x63
        if request.constant:
             try:
                 c_val = int(request.constant, 16)
             except:
                 pass

        plaintext = aes_service.decrypt(
            ciphertext_hex=request.ciphertext,
            key=request.key,
            sbox_id=request.sboxId,
            custom_sbox=request.customSBox,
            custom_matrix=request.customMatrix,
            constant=c_val
        )
        return AESDecryptResponse(
            plaintext=plaintext,
            sboxUsed=request.sboxId or "Custom"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")


# ============================================================================
# IMAGE ENCRYPTION ENDPOINTS
# ============================================================================

from fastapi import Form


@router.post("/image/encrypt")
async def encrypt_image(
    image: UploadFile = File(...),
    key: str = Form(...),
    sboxId: Optional[str] = Form(None),
    customSBox: Optional[str] = Form(None),
    customMatrix: Optional[str] = Form(None),
    constant: Optional[str] = Form("63")
):
    """
    Encrypt an image using AES with custom S-box.
    
    Returns the encrypted image as PNG.
    """
    from backend.services.image_encryption_service import image_encryption_service
    import json
    
    try:
        # Read image data
        image_data = await image.read()
        
        # Parse custom inputs
        c_sbox = json.loads(customSBox) if customSBox else None
        c_matrix = json.loads(customMatrix) if customMatrix else None
        c_const = int(constant, 16) if constant else 0x63
        
        # Encrypt
        encrypted_data = image_encryption_service.encrypt_image(
            image_data=image_data,
            key=key,
            sbox_id=sboxId,
            custom_sbox=c_sbox,
            custom_matrix=c_matrix,
            constant=c_const
        )
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(encrypted_data),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=encrypted.png"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")


@router.post("/image/decrypt")
async def decrypt_image(
    image: UploadFile = File(...),
    key: str = Form(...),
    sboxId: Optional[str] = Form(None),
    customSBox: Optional[str] = Form(None),
    customMatrix: Optional[str] = Form(None),
    constant: Optional[str] = Form("63")
):
    """
    Decrypt an image using AES with custom S-box.
    
    Returns the decrypted image as PNG.
    """
    from backend.services.image_encryption_service import image_encryption_service
    import json
    
    try:
        # Read image data
        image_data = await image.read()
        
        # Parse custom inputs
        c_sbox = json.loads(customSBox) if customSBox else None
        c_matrix = json.loads(customMatrix) if customMatrix else None
        c_const = int(constant, 16) if constant else 0x63
        
        # Decrypt
        decrypted_data = image_encryption_service.decrypt_image(
            image_data=image_data,
            key=key,
            sbox_id=sboxId,
            custom_sbox=c_sbox,
            custom_matrix=c_matrix,
            constant=c_const
        )
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(decrypted_data),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=decrypted.png"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")


@router.post("/image/analyze")
async def analyze_image_encryption(
    originalImage: UploadFile = File(...),
    encryptedImage: UploadFile = File(...)
):
    """
    Analyze encryption quality between original and encrypted images.
    
    Returns metrics: entropy, NPCR, UACI, and correlation coefficients.
    """
    from backend.services.image_analysis import analyze_encryption
    
    try:
        # Read image data
        original_data = await originalImage.read()
        encrypted_data = await encryptedImage.read()
        
        # Analyze
        metrics = analyze_encryption(original_data, encrypted_data)
        
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# API init export
api_router = router
