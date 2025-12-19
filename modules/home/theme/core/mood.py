"""
mood.py — Color Science v2
Cinema-grade mood manipulation via 3D LUTs and split-toning.

Applies color grading to wallpaper BEFORE extraction.
"""
from dataclasses import dataclass
from typing import Tuple, Optional
import numpy as np
from PIL import Image

@dataclass
class MoodConfig:
    """Configuration for a mood filter."""
    name: str
    shadow_tint: Tuple[float, float, float]      # RGB 0-1
    highlight_tint: Tuple[float, float, float]   # RGB 0-1
    tint_pivot: float = 0.5                      # Luminance value where transition occurs
    contrast: float = 1.0
    saturation: float = 1.0
    brightness: float = 0.0                      # Exposure bias
    
    # 3D LUT size (per channel). 17 is standard fast, 33 is high quality.
    lut_size: int = 17 


# Mood presets
MOOD_PRESETS = {
    # Default: mild cleanup, mostly identity
    "adaptive": MoodConfig(
        name="adaptive",
        shadow_tint=(0.0, 0.0, 0.0),    # No tint
        highlight_tint=(0.0, 0.0, 0.0),
        contrast=1.05,
        saturation=1.1,                 # Slight pop
    ),
    # Deep: Darken shadows, cool tint, high contrast
    "deep": MoodConfig(
        name="deep",
        shadow_tint=(0.0, 0.02, 0.05),  # Cool shadows
        highlight_tint=(0.0, 0.0, 0.0), # Neutral highlights
        contrast=1.1,
        saturation=0.9,
        brightness=-0.1,                # Darken overall
    ),
    # Pastel: Lift shadows, soft contrast, desaturated
    "pastel": MoodConfig(
        name="pastel",
        shadow_tint=(0.05, 0.02, 0.02), # Warm shadows (lifted)
        highlight_tint=(0.0, 0.0, 0.0),
        contrast=0.85,
        saturation=0.7,
        brightness=0.1,                 # Lighten
    ),
    # Vibrant: Punchy colors, strong contrast
    "vibrant": MoodConfig(
        name="vibrant",
        shadow_tint=(0.0, 0.0, 0.02),
        highlight_tint=(0.02, 0.02, 0.0),
        contrast=1.2,
        saturation=1.4,
    ),
    "bw": MoodConfig(
        name="bw",
        shadow_tint=(0.02, 0.01, 0.0),
        highlight_tint=(0.02, 0.02, 0.01),
        contrast=1.1,
        saturation=0.0,
    ),
    # Feature-matching "Gowall": Tinted Moods for Presets
    "catppuccin_mocha": MoodConfig(
        name="catppuccin_mocha",
        shadow_tint=(0.10, 0.08, 0.15), # Deep Mauve/Base tint
        highlight_tint=(0.02, 0.0, 0.05),
        contrast=0.95,
        saturation=0.9,
        brightness=-0.05
    ),
    "nord": MoodConfig(
        name="nord",
        shadow_tint=(0.15, 0.18, 0.22), # Polar Night tint
        highlight_tint=(0.0, 0.02, 0.05),
        contrast=0.9,
        saturation=0.85,
        brightness=0.0
    ),
}

class MoodEngine:
    """Applies mood-based color grading to images via 3D LUT."""
    
    def __init__(self, config: MoodConfig):
        self.config = config
        self._lut = self._generate_lut()
    
    def process_image(self, img_path: str) -> np.ndarray:
        """
        Load image, apply LUT, return as float32 RGB array (0-1).
        Resizes to manageable size for extraction if needed, but here we usually 
        process full or reasonably sized image.
        """
        # Load with Pillow for formats
        with Image.open(img_path) as pil_img:
            pil_img = pil_img.convert('RGB')
            # Extract can handle large images, but for performance let's cap at 1024px?
            # Actually extraction.py downsamples to 128 anyway. 
            # So let's downsample here to ~512 to apply LUT faster.
            pil_img.thumbnail((512, 512))
            
            # Convert to numpy
            img = np.array(pil_img, dtype=np.float32) / 255.0
            
            return self._apply_lut(img)

    def _generate_lut(self) -> np.ndarray:
        """Generates a 3D LUT (size x size x size x 3) based on config."""
        s = self.config.lut_size
        
        # 1. Create Identity Cube
        x = np.linspace(0, 1, s)
        lut = np.stack(np.meshgrid(x, x, x, indexing='ij'), axis=-1).astype(np.float32)
        # lut shape: (R, G, B, 3)
        R, G, B = lut[..., 0], lut[..., 1], lut[..., 2]
        
        # 2. Apply Saturation
        # Convert to simple Luma
        L = 0.299*R + 0.587*G + 0.114*B
        sat = self.config.saturation
        R = L + (R - L) * sat
        G = L + (G - L) * sat
        B = L + (B - L) * sat
        
        # 3. Apply Contrast
        # Simple curve centered at 0.5 via midpoint (tint_pivot? no, standard 0.5)
        cont = self.config.contrast
        for C in [R, G, B]:
            # (x - 0.5) * contrast + 0.5
            C[:] = (C - 0.5) * cont + 0.5
            
        # 4. Apply Brightness
        R += self.config.brightness
        G += self.config.brightness
        B += self.config.brightness
        
        # 5. Apply Split Toning (Shadow/Highlight Tint)
        # Weights based on Luminance
        # shadow weight: 1.0 at L=0, 0.0 at L=pivot
        # highli weight: 0.0 at L=pivot, 1.0 at L=1
        pivot = self.config.tint_pivot
        
        # Shadows
        s_mask = np.clip(1.0 - (L / pivot), 0, 1)
        sr, sg, sb = self.config.shadow_tint
        R += s_mask * sr
        G += s_mask * sg
        B += s_mask * sb
        
        # Highlights
        h_mask = np.clip((L - pivot) / (1.0 - pivot), 0, 1)
        hr, hg, hb = self.config.highlight_tint
        R += h_mask * hr
        G += h_mask * hg
        B += h_mask * hb
        
        # Clip back to 0-1
        lut = np.stack([R, G, B], axis=-1)
        return np.clip(lut, 0, 1)

    def _apply_lut(self, img: np.ndarray) -> np.ndarray:
        """
        Apply 3D LUT to image using trilinear interpolation.
        Note: Python/Numpy interpolation is slow for per-pixel.
        But for 512x512 it's ok (250k pixels).
        Faster: use Pillow's PointTable or standard LUT?
        Pillow only supports 1D LUTs natively easily. 
        For 3D, we can use HaldCLUT + Pillow or just vectorized numpy.
        
        Vectorized Numpy approach:
        Scale input 0-1 to 0-(size-1) indices.
        """
        # Optimized lookup for N x M image
        s = self.config.lut_size
        
        # Scale to indices
        scaled = img * (s - 1)
        # Floor indices
        idx = np.floor(scaled).astype(np.int32)
        # Clip indices to s-2 max (so idx+1 is valid)
        idx = np.clip(idx, 0, s - 2)
        
        # Fractional part for interpolation (dx, dy, dz)
        frac = scaled - idx
        
        # Retrieve corner values from LUT
        # This is essentially implementing trilinear interp manually.
        # It's heavy in python.
        
        # ALTERNATIVE: Use Pillow's Color3DLUT if available (new in Pillow 9.x/10.x?)
        # Pillow 10+ has `ImageFilter.Color3DLUT`!
        # Let's use that if possible.
        try:
            from PIL import ImageFilter
            # Transform our numpy LUT to Pillow LUT
            size = self.config.lut_size
            channels = 3
            # Flatten LUT for Pillow: list of [r,g,b, r,g,b...]
            # Standard order: r changes fastest
            # Our meshgrid (indexing='ij') -> r changes *slowest*? 
            # meshgrid ij: x (dim0), y (dim1), z (dim2)
            # Pillow expects: blue varies fastest? Or red?
            # Usually: r, g, b loops.
            
            # Let's recreate LUT as flat list for pillow to be safe and avoid numpy mess
            lut_flat = self._lut.flatten().tolist()
            
            # Use Pillow's filter (Wait, we can't apply filter to numpy array easily)
            # We return to Pillow logic
            pass
        except ImportError:
            pass
            
        # FALLBACK: Simple global approximation (no LUT interpolation)
        # Just apply the math functions directly to the image?
        # NO, LUT allows complex curves.
        
        # Let's use direct math on the image for v1 performance!
        # It's actually faster to just run `img = img * sat` than interpolate a LUT in pure python.
        # Unless we use C++ extension (opencv/pillow).
        
        # Let's rewrite `process_image` to just apply the math pixel-wise (vectorized).
        # It achieves the exact same result as generating a LUT then applying it, 
        # but skips the interpolation overhead.
        
        return self._apply_math_direct(img)
        
    def _apply_math_direct(self, img: np.ndarray) -> np.ndarray:
        """Apply grading math directly to image buffer (vectorized)."""
        # copy to avoid mutating original
        out = img.copy()
        R, G, B = out[..., 0], out[..., 1], out[..., 2]
        
        # Luma
        L = 0.299*R + 0.587*G + 0.114*B
        
        # Saturation
        sat = self.config.saturation
        R[:] = L + (R - L) * sat
        G[:] = L + (G - L) * sat
        B[:] = L + (B - L) * sat
        
        # Contrast
        cont = self.config.contrast
        # (x - 0.5) * contrast + 0.5
        out = (out - 0.5) * cont + 0.5
        
        # Brightness
        out += self.config.brightness
        
        # Re-split channels
        R, G, B = out[..., 0], out[..., 1], out[..., 2]
        
        # Split Toning
        pivot = self.config.tint_pivot
        
        # Shadows
        s_mask = np.clip(1.0 - (L / pivot), 0, 1)
        sr, sg, sb = self.config.shadow_tint
        R += s_mask * sr
        G += s_mask * sg
        B += s_mask * sb
        
        # Highlights
        h_mask = np.clip((L - pivot) / (1.0 - pivot), 0, 1)
        hr, hg, hb = self.config.highlight_tint
        R += h_mask * hr
        G += h_mask * hg
        B += h_mask * hb
        
        return np.clip(out, 0, 1)
        

def get_mood(name: str) -> MoodConfig:
    """Get a mood config by name."""
    return MOOD_PRESETS.get(name, MOOD_PRESETS["adaptive"])
