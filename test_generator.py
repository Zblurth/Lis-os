"""
Unit Test for Generator (Matsuda Templates)
"""
import sys
import os
import unittest
from coloraide import Color

sys.path.append(os.path.join(os.getcwd(), 'modules/home/theme'))
from core.generator import PaletteGenerator, TEMPLATES

class TestHarmonicGeneration(unittest.TestCase):
    
    def setUp(self):
        self.gen = PaletteGenerator()
        
    def test_identity_fitting(self):
        """Test if a monochromatic distribution fits Template i."""
        print("\n--- Test: Monochromatic Fitting ---")
        anchor = "#ff0000" # Red
        # Palette is just shades of red
        palette = ["#ff0000", "#cc0000", "#ff3333"] 
        weights = [1.0, 0.5, 0.2]
        
        result = self.gen.generate(anchor, palette, weights)
        print(f"Detected Template: {result['template']}")
        print(f"Colors: {result['colors']}")
        
        # Should be 'i' (Identity) or 'V' (V-shape)
        self.assertIn(result['template'], ['i', 'V'])
        
    def test_complementary_fitting(self):
        """Test if Red + Cyan fits Template I."""
        print("\n--- Test: Complementary Fitting ---")
        anchor = "#ff0000" # Red (Hue ~29)
        # Add Cyan (Hue ~209)
        palette = ["#ff0000", "#00ffff"] 
        weights = [1.0, 0.8]
        
        result = self.gen.generate(anchor, palette, weights)
        print(f"Detected Template: {result['template']}")
        
        # Should be 'I' (Complementary) or 'Y' (Split) or 'T' (loosely comp)
        t = result['template']
        valid = t in ['I', 'Y', 'L', 'T'] 
        self.assertTrue(valid, f"Expected Comp/Triad, got {t}")
        
    def test_triadic_generation(self):
        """Test generation of semantic colors."""
        print("\n--- Test: Semantic Generation ---")
        anchor = "#00ff00" # Green (Hue 142)
        
        # Fake a Y template at rotation 142 (Green primary)
        # Y has sectors: Primary 93deg wide, and Complementary 18deg wide at 180 offset
        # So Comp hue should be 142+180 = 322 (Magenta)
        
        # Force the generator to derive colors based on a detected Y template
        # We simulate this by feeding it Green + Magenta
        palette = ["#00ff00", "#ff00ff"]
        weights = [1.0, 1.0]
        
        result = self.gen.generate(anchor, palette, weights)
        sec = result['colors']['secondary']
        
        c_sec = Color(sec).convert("oklch")
        c_anchor = Color(anchor).convert("oklch")
        
        diff = abs(c_sec['h'] - c_anchor['h'])
        print(f"Anchor Hue: {c_anchor['h']:.1f}, Secondary Hue: {c_sec['h']:.1f}, Diff: {diff:.1f}")
        
        # Secondary logic in generator currently tries to pick from non-primary sector
        # For Y template, that's sector 2 (offset 180).
        # So diff should be approx 180.
        
        # Note: Circular diff logic
        circ_diff = min(diff, 360-diff)
        self.assertAlmostEqual(circ_diff, 180, delta=20)
        
    def test_contrast_compliance(self):
        """Test if generated colors meet WCAG contrast requirements."""
        print("\n--- Test: Contrast Compliance ---")
        anchor = "#4a4a4a" # Mid-gray
        palette = ["#4a4a4a"]
        weights = [1.0]
        
        result = self.gen.generate(anchor, palette, weights)
        cols = result['colors']
        bg = Color(cols['bg_base'])
        
        print(f"Background: {cols['bg_base']}")
        
        for role, min_ratio in [('primary', 3.0), ('error', 3.0), ('fg_base', 7.0)]:
            fg = Color(cols[role])
            ratio = bg.contrast(fg)
            print(f"{role}: {cols[role]} (Ratio: {ratio:.2f})")
            self.assertGreaterEqual(ratio, min_ratio, f"{role} failed contrast check")

if __name__ == '__main__':
    unittest.main()
