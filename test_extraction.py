"""
Comparison Test: Legacy vs New Saliency Extraction
"""
import sys
import os
import argparse
import time

# Mock legacy extraction logic (simplified version of old code)
# We can't import the old file because we overwrote it, but I recall the logic:
# 1. Resize 100x100
# 2. Saturation boost 1.5x
# 3. Frequency counter
# 4. Score = Chroma * log(frequency)
from collections import Counter
from coloraide import Color
from PIL import Image, ImageEnhance

def legacy_extract(image_path):
    start = time.time()
    img = Image.open(image_path).convert("RGB")
    img = img.resize((100, 100))
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.5)
    
    pixels = list(img.getdata())
    histogram = Counter(pixels)
    
    best_pixel = None
    max_score = -1
    
    for pixel, count in histogram.most_common(20):
        hex_val = '#{:02x}{:02x}{:02x}'.format(*pixel)
        c = Color(hex_val).convert("oklch")
        chroma = c['c']
        score = chroma * np.log(count)
        
        if score > max_score:
            max_score = score
            best_pixel = hex_val
            
    return best_pixel, time.time() - start

# Import new extraction
sys.path.append(os.path.join(os.getcwd(), 'modules/home/theme'))
from core.extraction import PerceptualExtractor
import numpy as np

def new_extract(image_path):
    start = time.time()
    extractor = PerceptualExtractor()
    res = extractor.extract(image_path)
    return res["anchor"], time.time() - start, res["palette"]

def print_color(hex_val, label):
    # Color('hex').to_string() returns "rgb(r, g, b)"
    # We parse that manually
    c = Color(hex_val)
    r, g, b = [int(v * 255) for v in c.convert('srgb').coords()]
    print(f"\033[48;2;{r};{g};{b}m    \033[0m {label}: {hex_val}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 test_extra.py <image_folder>")
        sys.exit(1)
        
    folder = sys.argv[1]
    images = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    images = sorted(images)[:5] # Test first 5 images
    
    print(f"Testing {len(images)} images from {folder}...\n")
    
    for img_name in images:
        path = os.path.join(folder, img_name)
        print(f"--- {img_name} ---")
        
        try:
            old_anchor, old_time = legacy_extract(path)
            new_anchor, new_time, palette = new_extract(path)
            
            print_color(old_anchor, f"OLD (freq-based)   [{old_time:.3f}s]")
            print_color(new_anchor, f"NEW (saliency-based) [{new_time:.3f}s]")
            print(f"    Palette candidates: {', '.join(palette[:4])}...")
            print("")
            
        except Exception as e:
            print(f"Error processing {img_name}: {e}")
