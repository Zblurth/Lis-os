"""
Integration Test: Mood + Extraction
"""
import sys
import os
import time

sys.path.append(os.path.join(os.getcwd(), 'modules/home/theme'))
from core.mood import MoodEngine, get_mood
from core.extraction import PerceptualExtractor
from coloraide import Color

def print_color(hex_val, label):
    try:
        c = Color(hex_val)
        if not c.in_gamut('srgb'): c.fit('srgb')
        r, g, b = [int(v * 255) for v in c.convert('srgb').coords()]
        print(f"\033[48;2;{r};{g};{b}m    \033[0m {label}: {hex_val}")
    except:
        print(f"       {label}: {hex_val} (Color Error)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 test_mood.py <image_path>")
        sys.exit(1)
        
    img_path = sys.argv[1]
    
    # 1. Standard Extraction
    print("\n--- Standard ---")
    extractor = PerceptualExtractor()
    t0 = time.time()
    res_std = extractor.extract(img_path)
    print_color(res_std['anchor'], f"Standard ({time.time()-t0:.3f}s)")
    
    # 2. Moods
    for mood_name in ["deep", "pastel", "vibrant", "bw"]:
        print(f"\n--- Mood: {mood_name} ---")
        
        # Grading
        t0 = time.time()
        cfg = get_mood(mood_name)
        engine = MoodEngine(cfg)
        
        processed_img = engine.process_image(img_path)
        t_grade = time.time() - t0
        
        # Extraction
        t1 = time.time()
        res_mood = extractor.extract(processed_img)
        t_extract = time.time() - t1
        
        print_color(res_mood['anchor'], f"Result ({t_grade:.3f}s grade + {t_extract:.3f}s extract)")
