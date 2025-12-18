"""
Core Color Utilities
Native coloraide implementation (no subprocess to `pastel`).
"""
from typing import Tuple
from coloraide import Color


def get_lch(hex_val: str) -> Tuple[float, float, float]:
    """
    Get L, C, H components using native coloraide.
    
    Returns Oklch values scaled to match legacy pastel output:
    - L: 0-100 (pastel scale)
    - C: 0-100 (approx, pastel scale)  
    - H: 0-360 (degrees)
    """
    try:
        c = Color(hex_val).convert("oklch")
        # Oklch in coloraide: L is 0-1, C is 0-0.4ish, H is 0-360
        # Pastel LCh: L is 0-100, C is 0-100ish, H is 0-360
        l = c['lightness'] * 100
        chroma = c['chroma'] * 100  # Scale to roughly match pastel
        h = c['hue'] if c['hue'] is not None else 0.0
        return l, chroma, h
    except Exception:
        return 0.0, 0.0, 0.0
