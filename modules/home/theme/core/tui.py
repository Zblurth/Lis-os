#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm

# Constants
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
WALLPAPER_DIR = Path.home() / "Pictures/Wallpapers"

# Add parent import path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from core.mood import MOOD_PRESETS
    from core.presets import PRESETS
except ImportError:
    MOOD_PRESETS = {"deep": {}, "pastel": {}}
    PRESETS = {"catppuccin_mocha": {}, "nord": {}}

CONSOLE = Console()

class MagicianApp:
    def run(self):
        try:
            main_menu()
        except KeyboardInterrupt:
            CONSOLE.print("\n[bold red]Exiting...[/]")
            sys.exit(0)

def clear():
    CONSOLE.clear()
    CONSOLE.print(Panel.fit("[bold magenta]🔮 Magician Theme Engine[/]", border_style="magenta"))

def list_wallpapers(directory=WALLPAPER_DIR):
    if not directory.exists():
        CONSOLE.print(f"[red]Wallpaper directory not found: {directory}[/]")
        return []
    exts = {".jpg", ".jpeg", ".png", ".webp"}
    files = sorted([f for f in directory.iterdir() if f.suffix.lower() in exts and f.is_file()])
    return files

def show_image_preview(path: Path):
    """Show terminal preview and live desktop preview"""
    # 1. Desktop (swww)
    subprocess.Popen(["swww", "img", str(path), "--transition-type", "none"], 
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Terminal (chafa)
    try:
        # Check if chafa exists?
        subprocess.run(["chafa", "-s", "60x20", str(path)], stdout=sys.stdout, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        CONSOLE.print("[dim]Chafa not found, skipping terminal preview[/]")

def pick_from_list(items, title="Select Option", columns=1):
    """Generic numbered picker"""
    if not items:
        CONSOLE.print("[red]No items to select.[/]")
        return None

    table = Table(title=title, show_header=False, box=None)
    
    # Setup columns
    for _ in range(columns*2): # id, val per col
       table.add_column(justify="right", style="cyan") # ID
       table.add_column(style="white") # Value

    # Flatten logic for columns
    # We want: 
    # 1 A  |  2 B
    # 3 C  |  4 D
    
    rows = []
    current_row = []
    
    for idx, item in enumerate(items, 1):
        label = str(item)
        if isinstance(item, Path): label = item.name
        
        current_row.extend([str(idx), label])
        
        if len(current_row) == columns * 2:
            table.add_row(*current_row)
            current_row = []
    
    if current_row:
        # Pad empty cells
        while len(current_row) < columns * 2:
             current_row.extend(["", ""])
        table.add_row(*current_row)

    CONSOLE.print(table)
    CONSOLE.print("")
    
    while True:
        choice = Prompt.ask("Enter number (or 'q' to back)")
        if choice.lower() == 'q': return None
        try:
            val = int(choice)
            if 1 <= val <= len(items):
                return items[val-1]
            CONSOLE.print("[red]Invalid number[/]")
        except ValueError:
             CONSOLE.print("[red]Invalid input[/]")

def pick_wallpaper():
    files = list_wallpapers()
    if not files: return None

    # We use a custom loop here because we want Preview-on-Selection BEFORE confirming
    
    # Just list them first
    table = Table(title="Select Wallpaper", show_header=False, box=None)
    table.add_column("ID", style="cyan", justify="right")
    table.add_column("Filename", style="white")
    
    # Use 2 columns for wallpapers if many?
    # Let's stick to 1 col for readable names
    for idx, f in enumerate(files, 1):
         table.add_row(str(idx), f.name)
         
    CONSOLE.print(table)
    
    while True:
        choice = Prompt.ask("Enter number to Preview (or 'q' to cancel)")
        if choice.lower() == 'q': return None
        
        try:
            val = int(choice)
            if 1 <= val <= len(files):
                f = files[val-1]
                CONSOLE.print("\n")
                show_image_preview(f)
                CONSOLE.print("")
                if Confirm.ask(f"Use [bold]{f.name}[/bold]?", default=True):
                    return f
            else:
                CONSOLE.print("[red]Invalid number[/]")
        except ValueError:
            CONSOLE.print("[red]Invalid input[/]")

def run_magician_set(image_path, args):
    cmd = [sys.executable, str(Path(__file__).parent / "magician.py"), "set", str(image_path)] + args
    CONSOLE.print(f"[dim]Running: {' '.join(cmd)}[/]")
    subprocess.run(cmd)
    Prompt.ask("\n[bold green]Theme Applied![/] Press Enter to continue...")

def menu_set_theme():
    wall = pick_wallpaper()
    if not wall: return

    clear()
    CONSOLE.print(Panel(f"[bold]Selected:[/bold] {wall.name}"))
    CONSOLE.print(" [1] Mood (Dynamic Grading)")
    CONSOLE.print(" [2] Preset (Static Palette)")
    
    mode = Prompt.ask("Select Mode", choices=["1", "2"], default="1")
    
    if mode == "1":
        moods = ["adaptive"] + sorted([m for m in MOOD_PRESETS.keys() if m != "adaptive"])
        sel = pick_from_list(moods, "Select Mood", columns=2)
        if not sel: return
        
        args = []
        if sel != "adaptive":
            args = ["--mood", sel]
        run_magician_set(wall, args)

    elif mode == "2":
        presets = sorted(list(PRESETS.keys()))
        sel = pick_from_list(presets, "Select Preset", columns=2)
        if not sel: return
        
        use_gowall = Confirm.ask("Tint wallpaper with Gowall?", default=False)
        args = ["--preset", sel]
        if use_gowall:
            args.append("--gowall")
            
        run_magician_set(wall, args)

def menu_gowall_studio():
    wall = pick_wallpaper()
    if not wall: return

    clear()
    CONSOLE.print(Panel(f"[bold]Gowall Studio[/bold] - {wall.name}"))
    CONSOLE.print("[dim]Fetching themes...[/]")
    
    try:
        res = subprocess.run(["gowall", "list"], capture_output=True, text=True)
        themes = [line.strip() for line in res.stdout.splitlines() if line.strip()]
        themes.sort()
    except Exception as e:
        CONSOLE.print(f"[red]Error fetching themes: {e}[/]")
        return

    # Use numbered picker
    # Since there are many, we loop the preview as well?
    # Or just select to preview?
    
    # User workflow: Select Theme -> Preview. Like/Dislike -> Select Another?
    # pick_from_list returns immediately.
    
    # We need a loop here.
    
    while True:
        # We can re-use pick_from_list? No, we need it to NOT return on selection immediately if we want preview loop?
        # Actually standard flow: Select Theme -> Preview -> Confirm. If No, repeat selection.
        
        sel = pick_from_list(themes, "Select Theme to Preview", columns=3)
        if not sel: return # Back
        
        # Generate Preview
        clear()
        CONSOLE.print(f"[bold]Previewing Theme:[/bold] {sel}")
        dest = XDG_CACHE_HOME / "wal" / "gowall_preview.png"
        
        try:
             subprocess.run(["gowall", "convert", str(wall), "--output", str(dest), "-t", sel], check=True, stdout=subprocess.DEVNULL)
             show_image_preview(dest)
             
             if Confirm.ask("Apply this theme?", default=True):
                  # Apply
                  run_magician_set(dest, [])
                  return
             else:
                  # Loop back to list
                  clear()
                  continue
        except Exception as e:
             CONSOLE.print(f"[red]Error: {e}[/]")
             Prompt.ask("Press Enter...")


def main_menu():
    while True:
        clear()
        CONSOLE.print(" [1] Set Theme 🎨")
        CONSOLE.print(" [2] Gowall Studio 🖌️")
        CONSOLE.print(" [q] Exit")
        
        c = Prompt.ask("\nSelect", choices=["1", "2", "q"])
        if c == "q": break
        elif c == "1": menu_set_theme()
        elif c == "2": menu_gowall_studio()

if __name__ == "__main__":
    app = MagicianApp()
    app.run()
