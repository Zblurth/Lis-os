"""
MAGICIAN: The Lis-OS Theme Engine CLI
Replaces engine.sh and lis-daemon.
"""
import sys
import os
import argparse
import json
import time
import subprocess
import shutil
from pathlib import Path

# Add current directory to path if needed (though wrapper handles it)
# Local imports
from core.extraction import extract_anchor
from core.generator import generate_palette
from core.renderer import render_template
from core.icons import tint_icons

# CONFIG
XDG_CONFIG_HOME = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))

CONFIG_DIR = XDG_CONFIG_HOME / "theme-engine"
# We now prioritize moods.json, falling back to profiles.json if needed
MOODS_FILE = CONFIG_DIR / "moods.json"
TEMPLATE_DIR = CONFIG_DIR / "templates"

CACHE_DIR = XDG_CACHE_HOME / "theme-engine"
PALETTE_FILE = CACHE_DIR / "palette.json"
SIGNAL_FILE = CACHE_DIR / "signal"

# Ensures
CACHE_DIR.mkdir(parents=True, exist_ok=True)
(XDG_CACHE_HOME / "wal").mkdir(parents=True, exist_ok=True)
(XDG_CONFIG_HOME / "astal").mkdir(parents=True, exist_ok=True)

def atomic_write(path: Path, content: str):
    tmp = path.with_suffix('.tmp')
    tmp.parent.mkdir(parents=True, exist_ok=True)
    with open(tmp, 'w') as f:
        f.write(content)
    shutil.move(tmp, path)

def load_config():
    """Load moods.json configuration."""
    if not MOODS_FILE.exists():
        # Fallback or empty
        return {"moods": {}, "active_mood": "adaptive"}
    try:
        with open(MOODS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading moods.json: {e}")
        return {"moods": {}, "active_mood": "adaptive"}

def action_set(args):
    """Set theme from image."""
    img_path = Path(args.image).resolve()
    if not img_path.exists():
        print(f"Error: Image not found: {img_path}")
        sys.exit(1)

    # 0. Load Config
    config_data = load_config()
    
    # Override mood if specified
    if args.mood:
        if args.mood not in config_data.get("moods", {}):
            print(f"Warning: Mood '{args.mood}' not found in config. Using default.")
        else:
            config_data["active_mood"] = args.mood

    # Get Fallback Anchor from the active mood config
    active_mood_name = config_data.get("active_mood", "adaptive")
    mood_config = config_data.get("moods", {}).get(active_mood_name, {})
    fallback_anchor = mood_config.get("fallback_anchor")

    print(f":: Extracting Anchor from {img_path.name}...")
    anchor = extract_anchor(str(img_path), fallback_hex=fallback_anchor)
    print(f"   Anchor: {anchor}")

    # 1. Generate Palette
    print(f":: Generating Palette ({config_data.get('active_mood')})...")
    palette = generate_palette(anchor, config_data)
    
    # 2. Save Palette
    print(":: Saving State...")
    palette_json = json.dumps(palette, indent=2)
    atomic_write(PALETTE_FILE, palette_json)
    atomic_write(XDG_CONFIG_HOME / "astal" / "appearance.json", palette_json)

    # 3. Render Templates
    print(":: Rendering Templates...")
    templates = [
        ("ags-colors.css", XDG_CACHE_HOME / "wal" / "ags-colors.css"),
        ("kitty.conf", XDG_CACHE_HOME / "wal" / "colors-kitty.conf"),
        ("rofi.rasi", XDG_CACHE_HOME / "wal" / "colors-rofi.rasi"),
        ("starship.toml", XDG_CONFIG_HOME / "starship.toml"),
        ("niri.kdl", XDG_CONFIG_HOME / "niri" / "colors.kdl"),
        ("zed.json", XDG_CONFIG_HOME / "zed" / "themes" / "LisTheme.json"),
        ("vesktop.css", XDG_CONFIG_HOME / "vesktop" / "themes" / "lis.css"),
        ("wezterm.lua", XDG_CACHE_HOME / "wal" / "colors-wezterm.lua"),
        ("antigravity.template", Path.home() / ".antigravity" / "extensions" / "lis-theme" / "themes" / "lis-theme.json"),
        ("hyfetch.json", XDG_CONFIG_HOME / "hyfetch.json"),
        ("zellij.kdl", XDG_CONFIG_HOME / "zellij" / "themes" / "default.kdl"),
        ("gtk.css", XDG_CONFIG_HOME / "gtk-4.0" / "gtk.css")
    ]

    for tpl_name, dest in templates:
        src = TEMPLATE_DIR / tpl_name
        if src.exists():
            print(f"   -> {dest}")
            render_template(src, dest, palette)
            
    # 4. Reloaders
    print(":: Reloading Apps...")
    try:
        subprocess.run(["kitty", "@", "--to=unix:@mykitty", "set-colors", "-a", "-c", str(XDG_CACHE_HOME / "wal" / "colors-kitty.conf")], stderr=subprocess.DEVNULL)
    except: pass
    
    # Niri
    niri_base = XDG_CONFIG_HOME / "niri" / "config-base.kdl"
    niri_colors = XDG_CONFIG_HOME / "niri" / "colors.kdl"
    niri_final = XDG_CONFIG_HOME / "niri" / "config.kdl"
    if niri_base.exists() and niri_colors.exists():
        with open(niri_final, 'w') as f:
            f.write(niri_base.read_text() + "\n" + niri_colors.read_text())
        subprocess.run(["niri", "msg", "action", "load-config-file"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # GTK 3
    gtk3_dest = XDG_CONFIG_HOME / "gtk-3.0" / "gtk.css"
    gtk4_src = XDG_CONFIG_HOME / "gtk-4.0" / "gtk.css"
    if gtk4_src.exists():
        gtk3_dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(gtk4_src, gtk3_dest)
        
    # 5. Icons
    prim = palette["colors"]["ui_prim"]
    acc = palette["colors"]["syn_acc"]
    
    # 5b. Antigravity Settings
    settings_base = XDG_CONFIG_HOME / "Antigravity" / "User" / "settings-base.json"
    settings_final = XDG_CONFIG_HOME / "Antigravity" / "User" / "settings.json"
    
    if settings_base.exists():
        print(":: Merging Antigravity Settings...")
        try:
            with open(settings_base) as f:
                base_data = json.load(f)
            c = palette["colors"]
            workbench_colors = {
                "activityBar.background": c["ui_sec"],
                "activityBar.foreground": c["fg"],
                "editor.background": c["bg"],
                "editor.foreground": c["fg"],
                "statusBar.background": c["ui_sec"],
                "sideBar.background": c["bg"],
                "titleBar.activeBackground": c["bg"],
                "terminal.background": c["bg"]
            }
            customizations = base_data.get("workbench.colorCustomizations", {})
            customizations.update(workbench_colors)
            base_data["workbench.colorCustomizations"] = customizations
            atomic_write(settings_final, json.dumps(base_data, indent=4))
        except Exception as e:
            print(f"Error updating Antigravity settings: {e}")

    print(":: Tinting Icons...")
    tint_icons(prim, acc)
    
    # 6. Wallpaper
    print(":: Setting Wallpaper...")
    # Link wallpaper
    wall_link = XDG_CACHE_HOME / "current_wallpaper.jpg"
    try:
        if wall_link.is_symlink() or wall_link.exists():
            wall_link.unlink()
        wall_link.symlink_to(img_path)
    except: pass
    
    # SWWW
    if subprocess.call(["pgrep", "-x", "swww-daemon"], stdout=subprocess.DEVNULL) != 0:
         subprocess.Popen(["swww-daemon"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
         time.sleep(0.5)
         
    subprocess.Popen([
        "swww", "img", str(img_path),
        "--transition-type", "grow",
        "--transition-pos", "0.5,0.5",
        "--transition-fps", "60",
        "--transition-duration", "2"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    SIGNAL_FILE.touch()
    subprocess.run(["notify-send", "-u", "low", "Theme Refreshed", f"Anchor: {anchor}"], check=False)

    # VISUALIZER (Single Mood)
    print(f"\n=== PALETTE PREVIEW [{config_data.get('active_mood')}] ===")
    
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"

    for key, val in sorted(palette["colors"].items()):
        if val.startswith("#"):
            print(f"{key:<15} {format_color_cell(val)}")

def action_compare(args):
    """Compare all moods against an image."""
    img_path = Path(args.image).resolve()
    if not img_path.exists():
        print(f"Error: Image not found: {img_path}")
        sys.exit(1)

    config_data = load_config()
    moods = config_data.get("moods", {})
    if not moods:
        print("No moods defined in configuration.")
        sys.exit(1)

    print(f":: Extracting Anchor from {img_path.name}...")
    anchor = extract_anchor(str(img_path))
    
    print(":: Generating Palettes for Comparison...")
    
    results = {}
    for mood_name in moods:
        # Create a temp config with this mood active
        temp_config = config_data.copy()
        temp_config["active_mood"] = mood_name
        
        pal = generate_palette(anchor, temp_config)
        results[mood_name] = pal["colors"]

    # Helper for Visuals
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"

    # Print Table
    # Columns: Component | Mood 1 | Mood 2 | ...
    mood_names = sorted(moods.keys())
    col_width = 22
    header = f"{'COMPONENT':<15}" + "".join([f"{m:<{col_width}}" for m in mood_names])
    print("\n" + header)
    print("-" * len(header))
    
    # Rows: Keys that differ
    # First, collect all keys
    all_keys = set()
    for m in results:
        all_keys.update(results[m].keys())
        
    sorted_keys = sorted(all_keys)
    
    # Filter "Constants" vs "Variables"
    variable_keys = []
    constant_keys = []
    
    for key in sorted_keys:
        # Check if values differ across moods
        values = [results[m].get(key) for m in mood_names]
        if all(v == values[0] for v in values):
            constant_keys.append((key, values[0]))
        else:
            variable_keys.append(key)
            
    # Print Variables
    for key in variable_keys:
        row = f"{key:<15}"
        for m in mood_names:
            val = results[m].get(key, "N/A")
            row += format_color_cell(val, col_width)
        print(row)
        
    # Print Constants Summary
    if constant_keys:
        print(f"\n{'CONSTANTS':<15} {format_color_cell('VALUE', col_width)}")
        print("-" * (15 + col_width))
        for key, val in constant_keys:
            print(f"{key:<15} {format_color_cell(val, col_width)}")
    print("")

def action_daemon(args):
    """Watch for changes and regenerate."""
    print(":: Magician Daemon Started.")
    from watchfiles import watch
    
    paths = [CONFIG_DIR]
    
    for changes in watch(*paths):
        print(f":: Detected changes: {changes}")
        
        if not PALETTE_FILE.exists():
            continue
            
        try:
            with open(PALETTE_FILE) as f:
                data = json.load(f)
                anchor = data["colors"].get("anchor")
        except:
            continue
            
        if not anchor:
            continue
            
        print(f":: Regenerating with anchor {anchor}...")
        try:
            config_data = load_config()
            palette = generate_palette(anchor, config_data)
            
            palette_json = json.dumps(palette, indent=2)
            atomic_write(PALETTE_FILE, palette_json)
            atomic_write(XDG_CONFIG_HOME / "astal" / "appearance.json", palette_json)
            
            # Re-render essential templates... (Logic omitted for brevity, similar to set)
        except Exception as e:
            print(f"Error regenerating: {e}")

def action_test(args):
    """Run stress test: generate palettes for multiple anchors across all moods."""
    # Realistic Wallpaper Anchors (diverse, no toxic neons)
    ANCHORS = {
        "Deep Purple":   "#220975",   # Dark anime/space
        "Sunset Orange": "#E07848",   # Warm sunset
        "Forest Green":  "#2D5A3D",   # Nature/forest
        "Ocean Blue":    "#1E4D6B",   # Ocean/sky
        "Sakura Pink":   "#D4A5A5",   # Cherry blossom
        "Twilight":      "#4A3B5C",   # Evening purple
        "Desert Sand":   "#C19A6B",   # Warm earth
        "Arctic Blue":   "#6B9DAD",   # Cool/ice
        "Autumn Red":    "#8B3A3A",   # Fall leaves
        "Storm Gray":    "#4A5568",   # Moody clouds
    }
    
    # Override with single anchor if provided
    if args.anchor:
        ANCHORS = {"Custom": args.anchor}
    
    config_data = load_config()
    moods = config_data.get("moods", {})
    
    if not moods:
        print("No moods defined in configuration.")
        sys.exit(1)
    
    def format_color_cell(hex_val, width=20):
        if not hex_val or not isinstance(hex_val, str) or not hex_val.startswith("#"):
            return f"{str(hex_val):<{width}}"
        try:
            h = hex_val.lstrip('#')
            r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            color_block = f"\033[48;2;{r};{g};{b}m      \033[0m"
            return f"{color_block} {hex_val:<{width-7}}"
        except ValueError:
            return f"{hex_val:<{width}}"
    
    print("=== THEME ENGINE STRESS TEST (Mood Matrix) ===")
    
    for name, anchor_hex in ANCHORS.items():
        print(f"\n>>> TEST: {name} [{anchor_hex}]")
        
        results = {}
        for mood in moods:
            temp_conf = config_data.copy()
            temp_conf["active_mood"] = mood
            try:
                res = generate_palette(anchor_hex, temp_conf)
                results[mood] = res["colors"]
            except Exception as e:
                results[mood] = {"error": str(e)}
        
        # Columns
        mood_names = sorted(moods.keys())
        col_width = 22
        header = f"{'COMPONENT':<15}" + "".join([f"{m:<{col_width}}" for m in mood_names])
        print(header)
        print("-" * len(header))
        
        # Keys to compare
        keys = ["bg", "fg", "ui_prim", "ui_sec", "sem_red"]
        
        for k in keys:
            row = f"{k:<15}"
            for m in mood_names:
                val = results[m].get(k, "N/A")
                row += format_color_cell(val, col_width)
            print(row)
    
    print("\n=== TEST COMPLETE ===")

def main():
    parser = argparse.ArgumentParser(description="Lis-OS Theme Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # SET
    set_parser = subparsers.add_parser("set", help="Set theme from image")
    set_parser.add_argument("image", help="Path to image")
    set_parser.add_argument("--mood", help="Override active mood", default=None)
    set_parser.set_defaults(func=action_set)
    
    # COMPARE
    comp_parser = subparsers.add_parser("compare", help="Compare all moods against an image")
    comp_parser.add_argument("image", help="Path to image")
    comp_parser.set_defaults(func=action_compare)
    
    # DAEMON
    daemon_parser = subparsers.add_parser("daemon", help="Run background daemon")
    daemon_parser.set_defaults(func=action_daemon)
    
    # TEST
    test_parser = subparsers.add_parser("test", help="Run stress test (Mood Matrix)")
    test_parser.add_argument("--anchor", help="Test single anchor (e.g. '#ff0000')", default=None)
    test_parser.set_defaults(func=action_test)
    
    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
