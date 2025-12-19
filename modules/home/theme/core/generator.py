"""
generator.py — Color Science v2
Generates a harmonic palette from extracted colors using Matsuda's Harmonic Templates.

Replaces the legacy MoodGenerator and hardcoded poles.
"""
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
import numpy as np
from coloraide import Color

# -------------------------------------------------------------------------
# 1. Harmonic Templates (Matsuda 1995)
# -------------------------------------------------------------------------

@dataclass
class HarmonicSector:
    width: float   # Degrees
    offset: float  # Degrees from primary center

@dataclass
class HarmonicTemplate:
    name: str
    description: str
    sectors: List[HarmonicSector]

# Define the 7 Standard Templates
TEMPLATES = [
    HarmonicTemplate("i", "Identity",     [HarmonicSector(18.0, 0.0)]),
    HarmonicTemplate("V", "V-Shape",      [HarmonicSector(93.6, 0.0)]),
    HarmonicTemplate("L", "L-Shape",      [HarmonicSector(18.0, 0.0), HarmonicSector(79.2, 90.0)]),
    HarmonicTemplate("I", "Complementary",[HarmonicSector(18.0, 0.0), HarmonicSector(18.0, 180.0)]),
    HarmonicTemplate("T", "Triad",        [HarmonicSector(180.0, 0.0)]), # Simply loose half-circle
    HarmonicTemplate("Y", "Split Comp",   [HarmonicSector(93.6, 0.0), HarmonicSector(18.0, 180.0)]),
    HarmonicTemplate("X", "X-Shape",      [HarmonicSector(93.6, 0.0), HarmonicSector(93.6, 180.0)]),
]

@dataclass
class PaletteConfig:
    mood: str = "adaptive"
    dark_mode_l: float = 0.20       # Adjusted to match standard dark themes (VSCode/Dracula)
    light_mode_l: float = 0.96
    bg_chroma: float = 0.025

# -------------------------------------------------------------------------
# 2. Generator Class
# -------------------------------------------------------------------------

from core.solver import solve_contrast

class PaletteGenerator:
    """
    Fits harmonic templates to source colors and generates a full UI palette.
    """
    def __init__(self, config: PaletteConfig = PaletteConfig()):
        self.config = config
        self.templates = TEMPLATES

    def generate(self, anchor_hex: str, extracted_palette: List[str], weights: List[float]) -> Dict:
        """
        Main entry point.
        """
        anchor = Color(anchor_hex)
        
        # --- 1. Fit Template ---
        hues = []
        valid_weights = []
        for hex_val, w in zip(extracted_palette, weights):
            c = Color(hex_val).convert("oklch")
            if c['c'] > 0.02: 
                hues.append(c['h'])
                valid_weights.append(w)
        
        if not hues:
            best_template = self.templates[0]
            best_rotation = anchor.convert("oklch")['h']
        else:
            best_template, best_rotation = self._fit_template(hues, valid_weights)
            
        # --- 2. Determine Background ---
        # Heuristic: Check anchor L to decide Theme Mode (Light/Dark)?
        # Or force Dark Mode for now (as standard efficient theme)?
        # Let's derive from anchor lightness.
        # If anchor L < 0.5, assume Dark Mode intent -> Bg L~0.04
        # If anchor L > 0.8, assume Light Mode intent -> Bg L~0.96
        # Else (Midtones) -> Default to Dark Mode usually for "system themes".
        # Let's default to a Deep Dark bg for vibrancy.
        
        # Override: derive logic
        anchor_l = anchor.convert("oklch")['l']
        is_light_theme = anchor_l > 0.9
        
        # Tune by Mood
        bg_l = self.config.dark_mode_l
        bg_c = self.config.bg_chroma
        
        if self.config.mood == 'pastel':
            bg_l = 0.25 if not is_light_theme else 0.98
            bg_c = 0.04
        elif self.config.mood == 'deep':
            bg_l = 0.05
            bg_c = 0.02
        elif self.config.mood == 'vibrant':
            bg_c = 0.06
            
        if is_light_theme:
            bg_l = self.config.light_mode_l

        # Use anchor hue
        bg_color = Color("oklch", [bg_l, bg_c, anchor.convert("oklch")['h']])
        if not bg_color.in_gamut('srgb'):
            bg_color.fit('srgb')
        bg_hex = bg_color.to_string(hex=True)
        
        # --- 3. Solve Colors Against Background ---
        
        def solve(base_color: Color, min_ratio=4.5) -> str:
            c = base_color.convert("oklch")
            return solve_contrast(bg_hex, c['h'], c['c'], min_ratio=min_ratio)

        # Primary UI (usually anchor derived)
        primary = Color(solve_contrast(bg_hex, anchor.convert("oklch")['h'], 0.14, min_ratio=3.0))
        # Note: 0.14 chroma is a "vibrant but safe" target if original anchor is dull. 
        # Actually use Anchor's own chroma?
        # Let's use Anchor's chroma but clamp it.
        anc_c = anchor.convert("oklch")['c']
        target_c = max(0.12, anc_c) # boost dull anchors slightly
        primary_hex = solve_contrast(bg_hex, anchor.convert("oklch")['h'], target_c, min_ratio=3.0)
        
        # Secondary/Tertiary
        sec_base = self._derive_color_from_template(anchor, best_template, best_rotation, "secondary")
        sec_hex = solve_contrast(bg_hex, sec_base['h'], target_c, min_ratio=3.0)
        
        ter_base = self._derive_color_from_template(anchor, best_template, best_rotation, "tertiary")
        ter_hex = solve_contrast(bg_hex, ter_base['h'], target_c, min_ratio=3.0)

        # Semantics
        err_base = self._harmonize_semantic("error", 29.0, best_template, best_rotation)
        err_hex = solve_contrast(bg_hex, err_base['h'], 0.15, min_ratio=3.0)
        
        warn_base = self._harmonize_semantic("warning", 85.0, best_template, best_rotation)
        warn_hex = solve_contrast(bg_hex, warn_base['h'], 0.15, min_ratio=3.0)
        
        succ_base = self._harmonize_semantic("success", 145.0, best_template, best_rotation)
        succ_hex = solve_contrast(bg_hex, succ_base['h'], 0.15, min_ratio=3.0)
        
        # Text
        fg_hex = solve_contrast(bg_hex, anchor.convert("oklch")['h'], 0.02, min_ratio=7.0) # High contrast text

        return {
            "template": best_template.name,
            "rotation": round(best_rotation, 1),
            "colors": {
                "anchor": anchor_hex,
                "primary": primary_hex,
                "secondary": sec_hex,
                "tertiary": ter_hex,
                "error": err_hex,
                "warning": warn_hex,
                "success": succ_hex,
                "bg_base": bg_hex, 
                "fg_base": fg_hex
            }
        }

    # --- Internal Math ---

    def _circular_dist(self, a, b):
        d = abs(a - b)
        return min(d, 360 - d)

    def _fit_template(self, hues: List[float], weights: List[float]) -> Tuple[HarmonicTemplate, float]:
        """Finds the template and rotation that minimizes exclusion cost."""
        best_t = self.templates[0]
        best_rot = 0.0
        min_cost = float('inf')
        
        hues = np.array(hues)
        weights = np.array(weights)
        
        # Check every 5 degrees
        for t in self.templates:
            for rot in range(0, 360, 5):
                cost = 0.0
                for h, w in zip(hues, weights):
                    # Distance to nearest sector
                    dist_to_sector = 360.0
                    for s in t.sectors:
                        center = (rot + s.offset) % 360
                        # Arc distance to center
                        d_center = self._circular_dist(h, center)
                        # Distance to edge (0 if inside)
                        d_edge = max(0, d_center - (s.width / 2.0))
                        dist_to_sector = min(dist_to_sector, d_edge)
                    
                    cost += dist_to_sector * w
                
                if cost < min_cost:
                    min_cost = cost
                    best_t = t
                    best_rot = rot
                    
        return best_t, best_rot

    def _derive_color_from_template(self, origin: Color, tmpl: HarmonicTemplate, rot: float, role: str) -> Color:
        """
        Derives a color that fits the template.
        For Secondary: Picks a hue from a non-primary sector (if exists).
        """
        base = origin.convert("oklch")
        
        target_hue = base['h']
        
        if role == "secondary":
            # Try to find a sector roughly 90-180 deg away if possible
            # Or just the "next" sector in the list
            if len(tmpl.sectors) > 1:
                # Use the second sector's center
                s = tmpl.sectors[1]
                target_hue = (rot + s.offset) % 360
            else:
                # Monochromatic: shift slightly (analogous)
                target_hue = (base['h'] + 30) % 360
                
        elif role == "tertiary":
            if len(tmpl.sectors) > 2:
                s = tmpl.sectors[2]
                target_hue = (rot + s.offset) % 360
            elif len(tmpl.sectors) == 2:
                # Use the second sector again but shift or complement
                target_hue = (rot + tmpl.sectors[1].offset + 180) % 360
            else:
                target_hue = (base['h'] - 30) % 360

        # Return new color with same L/C as origin (will be solved later)
        return Color("oklch", [base['l'], base['c'], target_hue])

    def _harmonize_semantic(self, name: str, core_hue: float, tmpl: HarmonicTemplate, rot: float) -> Color:
        """
        Harmonizes a semantic color (e.g. Red) with the template.
        If the core hue is inside the template, strictly use it.
        If not, check if we can shift it slightly to fit.
        If not, stick to core hue (Safety first!) but maybe desaturate.
        """
        # 1. Check if core_hue fits
        fits = False
        for s in tmpl.sectors:
            center = (rot + s.offset) % 360
            if self._circular_dist(core_hue, center) <= (s.width / 2.0):
                fits = True
                break
        
        final_hue = core_hue
        if not fits:
            # Try to shift towards nearest sector edge, but clamp to "Safe Zone"
            # For simplicity in V1, we just stick to core hue to guarantee meaning.
            # (Phase 3 simplified: "Hue Locking" strategy from research)
            pass
            
        # Return generic semantic color (standard L/C)
        # These L/C values are placeholders; Solver will fix them.
        return Color("oklch", [0.65, 0.15, final_hue])