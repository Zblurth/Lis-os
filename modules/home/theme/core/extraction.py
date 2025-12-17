"""
Image Extraction Logic (Saliency-based)
Uses ImageMagick + Pastel for strict parity with engine.sh.
"""
import subprocess
import math
import re
from typing import List, Tuple
from .color import get_lch

def get_saliency_score(c: float, count: int) -> float:
    """Implement the engine.sh saliency formula: C * log(count)."""
    if count < 1:
        count = 1
    return c * math.log(count)

def extract_anchor(image_path: str, fallback_hex: str = None) -> str:
    """
    Extract the best anchor color from an image using ImageMagick pipeline.
    Replicates engine.sh logic:
    1. Resize 100x100
    2. Modulate 100,150,100 (Sat * 1.5)
    3. Histogram -> Sort by count
    4. Saliency Score = Chroma (Pastel) * log(Count)
    5. Monochrome Rescue: If Chroma < 5, use fallback.
    """
    try:
        # Command: magick "$IMG" -resize 100x100 -modulate 100,150,100 -depth 8 -format "%c" histogram:info: | sort -nr | head -n 30
        
        # We run the magick command. encoding 'utf-8'.
        cmd = [
            "magick", image_path, 
            "-resize", "100x100", 
            "-modulate", "100,150,100", 
            "-depth", "8", 
            "-format", "%c", 
            "histogram:info:"
        ]
        
        # We need to pipe to sort | head. 
        # Python subprocess piping is cleaner if we just capture output and sort in python.
        res = subprocess.check_output(cmd, text=True)
        
        # Output format: "    200: ( 10, 20, 30) #0A141E srgb(10,20,30)"
        # Regex to parse count and hex.
        # engine.sh uses `sort -nr | head -n 30`
        
        hist_lines = res.strip().splitlines()
        candidates = []
        
        for line in hist_lines:
            line = line.strip()
            if not line: continue
            # Parse "count: ... #HEX ..."
            # Regex: (\d+):.*(#[0-9A-Fa-f]{6})
            match = re.match(r"(\d+):.*(#[0-9A-Fa-f]{6})", line)
            if match:
                count = int(match.group(1))
                hex_val = match.group(2)
                candidates.append((count, hex_val))
                
        # Sort by count desc
        candidates.sort(key=lambda x: x[0], reverse=True)
        candidates = candidates[:30]
        
        best_score = 0.0
        best_anchor = None
        best_chroma = 0.0
        raw_fallback = None
        
        for i, (count, hex_val) in enumerate(candidates):
            if i == 0:
                raw_fallback = hex_val
                
            # Get LCH from Pastel
            l, c, h = get_lch(hex_val)
            
            # Validity Check (engine.sh logic)
            # if (l >= 1 && c > 5) ok
            # else if (l >= 12 && l <= 98 && c >= 2) ok
            
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
            # Fallback to raw frequency winner if no valid anchor found
            if raw_fallback:
                # Need to check chroma of raw fallback too?
                # engine.sh: "if [[ -z "$ANCHOR" ]]; then ANCHOR=... FINAL_CHROMA=..."
                best_anchor = raw_fallback
                _, best_chroma, _ = get_lch(raw_fallback)
            else:
                return "#000000"

        # Monochrome Rescue
        # engine.sh: if [[ "$IS_MONOCHROME" == "1" ]]; then ... ANCHOR="$FALLBACK_ANCHOR" ...
        if best_chroma < 5 and fallback_hex:
            print(f"   [!] Monochrome (C:{best_chroma:.1f}). Rescue -> {fallback_hex}")
            return fallback_hex

        return best_anchor
            
    except Exception as e:
        print(f"Extraction Error: {e}")
        return "#000000"
