"""
Icon Tinting Module
Replaces icon-tinter.sh
"""
import os
import json
import shutil
import subprocess
from pathlib import Path
from multiprocessing import Pool, cpu_count

CACHE_DIR = Path(os.environ.get("HOME", "")) / ".cache" / "lis-icons"
MAP_FILE = CACHE_DIR / "index.map"
MANIFEST_FILE = CACHE_DIR / "manifest.json"
COLOR_LOCK = CACHE_DIR / "colors.lock"

def resolve_icons():
    """
    Call resolve-icons script to build the icon map.
    Writes output to MAP_FILE.
    """
    try:
        with open(MAP_FILE, 'w') as f:
            result = subprocess.run(
                ["resolve-icons"], 
                stdout=f, 
                stderr=subprocess.PIPE, 
                text=True
            )
            if result.returncode != 0:
                print(f"Warning: resolve-icons failed: {result.stderr}")
    except FileNotFoundError:
        print("Error: resolve-icons not found in PATH. Icon tinting skipped.")
    except Exception as e:
        print(f"Error running resolve-icons: {e}")

def tint_worker(args):
    """
    Worker for tinting a single icon. 
    args: (src_path, dest_prim, dest_acc, prim_hex, acc_hex)
    """
    src, dest_prim, dest_acc, prim, acc = args
    
    # Base command parts
    # We use magick command from icon-tinter.sh
    
    def build_cmd(color_hex, dest_path):
        return [
            "magick", "-density", "384", "-background", "none", src,
            "-resize", "128x128", "-gravity", "center", "-extent", "128x128",
            "-fuzz", "10%", "-fill", "none", "-draw", "alpha 0,0 floodfill",
            "-channel", "alpha", "-morphology", "Erode", "Disk:1", "-blur", "0x0.5",
            "-channel", "RGB", "-colorspace", "gray", "-colorspace", "sRGB",
            "(", "+clone", "-fill", color_hex, "-colorize", "100", ")", "-compose", "Overlay", "-composite",
            "(", "+clone", "-alpha", "extract", ")", "-compose", "DstIn", "-composite",
            str(dest_path)
        ]
    
    cmd_prim = build_cmd(prim, dest_prim)
    cmd_acc = build_cmd(acc, dest_acc)
    
    try:
        subprocess.run(cmd_prim, check=True, stderr=subprocess.PIPE, text=True)
        subprocess.run(cmd_acc, check=True, stderr=subprocess.PIPE, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error tinting {src}: {e.stderr}")
        return False

def tint_icons(prim_hex: str, acc_hex: str, force: bool = False):
    """
    Main entry point for tinting.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    prim_dir = CACHE_DIR / "primary"
    acc_dir = CACHE_DIR / "accent"
    prim_dir.mkdir(exist_ok=True)
    acc_dir.mkdir(exist_ok=True)
    
    # 1. Check Lock
    current_sig = f"{prim_hex}-{acc_hex}"
    should_repaint = force
    
    if COLOR_LOCK.exists():
        if COLOR_LOCK.read_text().strip() != current_sig:
            should_repaint = True
            # Clean old
            shutil.rmtree(prim_dir)
            shutil.rmtree(acc_dir)
            prim_dir.mkdir()
            acc_dir.mkdir()
    else:
        should_repaint = True
        
    if not should_repaint and not force:
        print(":: Icons up to date.")
        return

    COLOR_LOCK.write_text(current_sig)
    
    # 2. Index
    if not MAP_FILE.exists():
        print(":: Indexing icons...")
        resolve_icons()
        
    if not MAP_FILE.exists():
        print("Error: Icon map creation failed.")
        return

    # 3. Prepare Tasks
    tasks = []
    with open(MAP_FILE, 'r') as f:
        for line in f:
            parts = line.strip().split('|')
            if len(parts) != 2: continue
            name, src = parts
            
            dest_prim = prim_dir / f"{name}.png"
            dest_acc = acc_dir / f"{name}.png"
            
            if dest_prim.exists() and dest_acc.exists():
                continue
                
            tasks.append((src, dest_prim, dest_acc, prim_hex, acc_hex))
            
    # 4. Run Pool
    if not tasks:
        print(":: No new icons to tint.")
    else:
        print(f":: Tinting {len(tasks)} icons...")
        with Pool(processes=cpu_count()) as pool:
            pool.map(tint_worker, tasks)
            
    # 5. Generate Manifest
    print(":: Generating Manifest...")
    # Read dirs
    manifest = {"primary": {}, "accent": {}}
    
    for f in prim_dir.glob("*.png"):
        manifest["primary"][f.stem] = str(f)
    for f in acc_dir.glob("*.png"):
        manifest["accent"][f.stem] = str(f)
        
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(manifest, f)
        
    print(":: Icons Done.")
