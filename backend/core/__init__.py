# Core module exports
from .gf256 import (
    gf_add,
    gf_mul,
    gf_pow,
    gf_inverse,
    get_inverse,
    generate_inverse_table,
    IRREDUCIBLE_POLY,
    INVERSE_TABLE,
)

from .affine import (
    construct_sbox,
    apply_affine_transform,
    find_fixed_points,
    validate_matrix,
    int_to_bits,
    bits_to_int,
)

from .metrics import (
    analyze_sbox,
    compute_nonlinearity,
    compute_sac,
    compute_bic_nl,
    compute_bic_sac,
    compute_lap,
    compute_dap,
    compute_differential_uniformity,
    compute_algebraic_degree,
    compute_transparency_order,
    compute_correlation_immunity,
)
