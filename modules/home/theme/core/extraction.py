"""
Image Extraction Logic (Saliency-based)
Uses Pillow for native image processing (no ImageMagick subprocess).
"""
import math
from typing import List, Tuple
from collections import Counter
from PIL import Image, ImageEnhance
from .color import get_lch


def get_saliency_score(c: float, count: int) -> float:
    """Implement the saliency formula: C * log(count)."""
    if count < 1:
        count = 1
    return c * math.log(count)


def extract_anchor(image_path: str, fallback_hex: str = None) -> str:
    """
    Extract the best anchor color from an image using Pillow.
    
    Algorithm (matches legacy engine.sh logic):
    1. Resize to 100x100
    2. Boost saturation 1.5x
    3. Get pixel histogram, take top 30 by frequency
    4. Score each: Saliency = Chroma * log(Count)
    5. Filter out near-black (L<1) and near-white (L>98)
    6. Monochrome Rescue: If best chroma < 5, use fallback
    """
    try:
        # 1. Load and resize
        img = Image.open(image_path).convert("RGB")
        img = img.resize((100, 100), Image.Resampling.LANCZOS)
        
        # 2. Boost saturation (equivalent to -modulate 100,150,100)
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.5)
        
        # 3. Get histogram (pixel frequency count)
        pixels = list(img.getdata())
        histogram = Counter(pixels)
        
        # Take top 30 by frequency
        candidates = histogram.most_common(30)
        
        best_score = 0.0
        best_anchor = None
        best_chroma = 0.0
        raw_fallback = None
        
        for i, ((r, g, b), count) in enumerate(candidates):
            hex_val = f"#{r:02x}{g:02x}{b:02x}"
            
            if i == 0:
                raw_fallback = hex_val
            
            # Get LCH values
            l, c, h = get_lch(hex_val)
            
            # Validity Check (engine.sh logic)
            is_valid = False
            if l >= 1 and c > 5:
                is_valid = True
            elif 12 <= l <= 98 and c >= 2:
                is_valid = True
                
            if not is_valid:
                continue
                
            score = get_saliency_score(c, count)
            if score > best_score:
                best_score = score
                best_anchor = hex_val
                best_chroma = c
                
        if not best_anchor:
            # Fallback to raw frequency winner
            if raw_fallback:
                best_anchor = raw_fallback
                _, best_chroma, _ = get_lch(raw_fallback)
            else:
                return "#000000"

        # Monochrome Rescue
        if best_chroma < 5 and fallback_hex:
            print(f"   [!] Monochrome (C:{best_chroma:.1f}). Rescue -> {fallback_hex}")
            return fallback_hex

        return best_anchor
            
    except Exception as e:
        print(f"Extraction Error: {e}")
        return "#000000"
