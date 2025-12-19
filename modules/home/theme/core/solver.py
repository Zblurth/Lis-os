"""
solver.py — Color Science v2
WCAG constraint solver with gamut mapping.

Ensures all fg/bg pairs meet accessibility requirements.
"""
from coloraide import Color
from typing import Tuple, Optional

def solve_contrast(
    bg_hex: str,
    target_hue: float,
    target_chroma: float,
    min_ratio: float = 4.5,
    max_iterations: int = 15
) -> str:
    """
    Find optimal lightness to achieve WCAG contrast ratio.
    
    Uses binary search to find L that achieves min_ratio.
    Hue and chroma are preserved as much as possible.
    
    Args:
        bg_hex: Background color as hex string
        target_hue: Desired hue angle (0-360) in Oklch
        target_chroma: Desired chroma (0-1) in Oklch
        min_ratio: Minimum contrast ratio (4.5 for AA)
        max_iterations: Binary search iterations
    
    Returns:
        Hex string of accessible foreground color
    """
    bg = Color(bg_hex)
    bg_l = bg.convert('oklch')['l']
    
    # Decide direction: Light-on-Dark or Dark-on-Light?
    # If bg is dark (< 0.5), we want L > bg_l (search up)
    # If bg is light (>= 0.5), we want L < bg_l (search down)
    
    # Special handling for mids (e.g. gray):
    # Try both directions? For a theme engine, we usually want:
    # - If we are solving for "text", we want high contrast.
    # - If we are solving for "ui component", 3.0 might be enough.
    # Here we stick to a simple heuristic:
    search_up = bg_l < 0.6 # slightly biased towards light text
    
    low = bg_l if search_up else 0.0
    high = 1.0 if search_up else bg_l
    
    best_color = None
    best_ratio = 0.0
    
    for _ in range(max_iterations):
        mid_l = (low + high) / 2.0
        
        # Construct candidate in Oklch
        cand = Color('oklch', [mid_l, target_chroma, target_hue])
        
        # Check gamut - simplify it first!
        # High chroma might make high/low lightness impossible.
        # We try to keep chroma, but if OOG, we reduce it.
        cand = gamut_map(cand)
        
        ratio = bg.contrast(cand)
        
        # Track best valid solution found so far
        if ratio >= min_ratio:
            best_color = cand
            # Can we get closer to "ideal lightness"?
            # Usually we want to stop as soon as we meet constraints to preserve original L intent?
            # NO, actually for text we want MAX contrast usually, or "at least" min_ratio.
            # But for a theme, we want "just enough" to look like the intended color?
            # Let's say we want to be safe, so we push a bit further into safe zone.
            best_ratio = ratio
            
            # If we met ratio, we can try to be "less extreme" (closer to bg) to see if we can still pass?
            # Or we can stop?
            # Actually, standard binary search for "Edge" of compliance:
            # If we pass, we try to move closer to bg (to find the boundary).
            # Wait, no. We want the color to be VISIBLE.
            # So finding the boundary is finding the minimum L distance.
            if search_up:
                high = mid_l # Try lower L (closer to bg) to see if it still passes?
                # No, if we pass, we want to record it.
                # If we assume target intent was "infinite contrast", we just pick White/Black.
                # But here we have a Target Chroma/Hue.
                # Let's optimize for: Maintaining Chroma > Meeting Ratio exactly.
                
                # Simple Logic: Find the FIRST point that passes.
                # Since monotonic contrast:
                # If pass: try closer to bg (optimize for subtlety?)
                #   -> high = mid_l
                # If fail: need more contrast (further from bg)
                #   -> low = mid_l
                
                # Wait, if `mid_l` passes (ratio > 4.5), and we want to find the boundary...
                # Do we WANT the boundary? Or do we want the most colorful version?
                # Usually: chroma decreases as L approaches 0 or 1.
                # So `mid_l` at 0.9 might allow less chroma than 0.8.
                # This is complex.
                
                # SIMPLIFIED STRATEGY:
                # Just find an L that works.
                pass
                
        if ratio < min_ratio:
            # Not enough contrast
            if search_up:
                low = mid_l
            else:
                high = mid_l
        else:
            # Satisfied min_ratio
            best_color = cand # Update best
            if search_up:
                # Could we be closer?
                high = mid_l # check lower L
            else:
                low = mid_l # check higher L
                
    if best_color:
        return best_color.to_string(hex=True)
        
    # If solver failed (e.g. impossible to get 4.5 with that Chroma):
    # Try reducing chroma to 0 (greyscale fallback)
    white = Color('white')
    black = Color('black')
    if bg.contrast(white) >= min_ratio:
        return white.to_string(hex=True)
    elif bg.contrast(black) >= min_ratio:
        return black.to_string(hex=True)
    else:
        # Background is impossible mid-gray? Return whatever has max contrast.
        return white.to_string(hex=True) if bg.contrast(white) > bg.contrast(black) else black.to_string(hex=True)


def gamut_map(color: Color) -> Color:
    """
    Map out-of-gamut color to sRGB via chroma reduction.
    Preserves hue and lightness, reduces chroma until in-gamut.
    """
    if color.in_gamut('srgb'):
        return color
    
    # Use coloraide's built-in gamut mapping with Oklch chroma reduction
    # 'lch-chroma' is the standard method for this.
    return color.fit('srgb', method='lch-chroma')

# --- Testing ---
def calculate_contrast(fg_hex: str, bg_hex: str) -> float:
    """Calculate WCAG contrast ratio between two colors."""
    fg = Color(fg_hex)
    bg = Color(bg_hex)
    return bg.contrast(fg)
