"""
Core Color Utilities
Wrapper around 'pastel' binary for LCh extraction (used by extraction.py).
"""
import subprocess
import re
from typing import Tuple


def get_lch(hex_val: str) -> Tuple[float, float, float]:
    """Get L, C, H components from pastel."""
    cmd = f'pastel format lch "{hex_val}"'
    res = subprocess.check_output(cmd, shell=True, text=True).strip()
    
    # Parse: LCh(15.2, 30.5, 120.4)
    nums = re.findall(r"[-+]?\d*\.?\d+", res)
    if len(nums) >= 3:
        return float(nums[0]), float(nums[1]), float(nums[2])
    return 0.0, 0.0, 0.0
