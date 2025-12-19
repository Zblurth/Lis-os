"""
forge.py — FORGE screen for Magician TUI
The unified wallpaper selection, preview, and theme application screen.
"""
import os
import subprocess
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, Checkbox
from textual.binding import Binding
from textual.reactive import reactive
from textual.message import Message
from rich.text import Text
from rich.style import Style

from .state import load_session, save_session, SessionState

# Constants
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
WALLPAPER_DIR = Path.home() / "Pictures" / "Wallpapers"
CHAFA_CACHE = XDG_CACHE_HOME / "theme-engine" / "chafa"
PALETTE_FILE = XDG_CACHE_HOME / "theme-engine" / "palette.json"

# Moods and Presets (imported from core)
MOODS = ["adaptive", "deep", "pastel", "vibrant", "bw"]
PRESETS = ["catppuccin_mocha", "nord"]


def get_wallpapers(directory: Path = WALLPAPER_DIR) -> list[Path]:
    """Get list of wallpaper files."""
    if not directory.exists():
        return []
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    files = sorted([f for f in directory.iterdir() if f.suffix.lower() in exts and f.is_file()])
    return files


def truncate_middle(text: str, max_len: int = 20) -> str:
    """Truncate string in the middle with ellipsis."""
    if len(text) <= max_len:
        return text
    half = (max_len - 1) // 2
    return text[:half] + "…" + text[-(max_len - half - 1):]


def get_chafa_preview(image_path: Path, width: int = 50, height: int = 12) -> str:
    """Get terminal preview of image using chafa."""
    CHAFA_CACHE.mkdir(parents=True, exist_ok=True)
    
    try:
        cache_key = f"{image_path.stem}_{int(image_path.stat().st_mtime)}"
        cache_file = CHAFA_CACHE / f"{cache_key}.txt"
        
        if cache_file.exists():
            return cache_file.read_text()
        
        # Try to find chafa - it may be in a Nix wrapper path
        chafa_path = shutil.which("chafa")
        if not chafa_path:
            # Fallback: try common Nix paths
            nix_paths = [
                "/run/current-system/sw/bin/chafa",
                Path.home() / ".nix-profile/bin/chafa",
            ]
            for p in nix_paths:
                if Path(p).exists():
                    chafa_path = str(p)
                    break
        
        if not chafa_path:
            return f"[No chafa found]\n{image_path.name}"
        
        result = subprocess.run(
            [chafa_path, "-s", f"{width}x{height}", "--animate=off", str(image_path)],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            preview = result.stdout
            cache_file.write_text(preview)
            return preview
        else:
            return f"[chafa error: {result.stderr[:50]}]"
            
    except subprocess.TimeoutExpired:
        return "[Preview timeout]"
    except Exception as e:
        return f"[Preview error: {str(e)[:30]}]"


def load_palette() -> dict:
    """Load current palette from cache."""
    import json
    if PALETTE_FILE.exists():
        try:
            with open(PALETTE_FILE) as f:
                data = json.load(f)
                return data.get("colors", {})
        except:
            pass
    return {}


def calculate_contrast(fg_hex: str, bg_hex: str) -> float:
    """Calculate WCAG contrast ratio."""
    def get_luminance(hex_color: str) -> float:
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 8:
            hex_color = hex_color[2:]
        r = int(hex_color[0:2], 16) / 255
        g = int(hex_color[2:4], 16) / 255
        b = int(hex_color[4:6], 16) / 255
        
        def adjust(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        
        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)
    
    try:
        lum1 = get_luminance(fg_hex)
        lum2 = get_luminance(bg_hex)
        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)
        return (lighter + 0.05) / (darker + 0.05)
    except:
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# WIDGETS
# ─────────────────────────────────────────────────────────────────────────────

class TopBar(Static):
    """Top control bar with mode toggle, selectors, and gowall checkbox."""
    
    mode = reactive("mood")
    mood_index = reactive(0)
    preset_index = reactive(0)
    gowall = reactive(False)
    
    def on_mount(self):
        self._update()
    
    def _update(self):
        text = Text()
        
        # Mode toggle
        if self.mode == "mood":
            text.append("[", style="dim")
            text.append("Mood", style="bold cyan")
            text.append("]", style="dim")
            text.append("Preset ", style="dim")
        else:
            text.append(" Mood", style="dim")
            text.append("[", style="dim")
            text.append("Preset", style="bold magenta")
            text.append("]", style="dim")
        
        text.append("  ", style="")
        
        # Selector
        if self.mode == "mood":
            mood = MOODS[self.mood_index]
            text.append("←", style="cyan")
            text.append(f" {mood} ", style="bold white")
            text.append("→", style="cyan")
        else:
            preset = PRESETS[self.preset_index]
            text.append("←", style="magenta")
            text.append(f" {preset} ", style="bold white")
            text.append("→", style="magenta")
            
            text.append("  ", style="")
            
            # Gowall checkbox (only in preset mode)
            gw_status = "✓" if self.gowall else " "
            text.append(f"Gowall:[{gw_status}]", style="green" if self.gowall else "dim")
        
        self.update(text)
    
    def watch_mode(self, old, new):
        self._update()
    
    def watch_mood_index(self, old, new):
        self._update()
    
    def watch_preset_index(self, old, new):
        self._update()
    
    def watch_gowall(self, old, new):
        self._update()
    
    def next_mood(self):
        self.mood_index = (self.mood_index + 1) % len(MOODS)
    
    def prev_mood(self):
        self.mood_index = (self.mood_index - 1) % len(MOODS)
    
    def next_preset(self):
        self.preset_index = (self.preset_index + 1) % len(PRESETS)
    
    def prev_preset(self):
        self.preset_index = (self.preset_index - 1) % len(PRESETS)
    
    def toggle_mode(self):
        self.mode = "preset" if self.mode == "mood" else "mood"
    
    def toggle_gowall(self):
        self.gowall = not self.gowall
    
    def get_current_mood(self) -> str:
        return MOODS[self.mood_index]
    
    def get_current_preset(self) -> str:
        return PRESETS[self.preset_index]


class WallpaperItem(Static):
    """A wallpaper item in the sidebar list."""
    
    def __init__(self, path: Path, is_current: bool = False, **kwargs):
        super().__init__(**kwargs)
        self.path = path
        self.is_current = is_current
        self.is_selected = False
    
    def on_mount(self):
        self._update_display()
    
    def _update_display(self):
        name = truncate_middle(self.path.name, 20)
        prefix = ">" if self.is_current else " "
        sel = "✓" if self.is_selected else " "
        style = "bold white" if self.is_current else "dim"
        self.update(Text(f"{prefix}[{sel}]{name}", style=style))
    
    def set_current(self, is_current: bool):
        self.is_current = is_current
        self._update_display()
    
    def toggle_selected(self):
        self.is_selected = not self.is_selected
        self._update_display()


class PreviewPanel(Static):
    """Panel showing chafa preview and image info."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_path: Path | None = None
        self._executor = ThreadPoolExecutor(max_workers=2)
    
    def update_preview(self, path: Path):
        """Update preview for the given wallpaper."""
        self.current_path = path
        self.update("[dim]Loading...[/dim]")
        
        # Load preview in background
        future = self._executor.submit(get_chafa_preview, path)
        future.add_done_callback(self._on_preview_loaded)
    
    def _on_preview_loaded(self, future):
        """Callback when preview is loaded."""
        try:
            preview = future.result()
            if self.current_path:
                stat = self.current_path.stat()
                size_mb = stat.st_size / (1024 * 1024)
                header = f"[bold]{self.current_path.name}[/bold] ({size_mb:.1f}MB)\n"
                # Schedule update on main thread
                self.call_from_thread(self.update, header + preview)
        except Exception as e:
            self.call_from_thread(self.update, f"[red]Error: {e}[/red]")


class MatrixPanel(Static):
    """The Unixporn Matrix showing contrast validation with actual colors."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.palette_colors: dict = {}
    
    def update_colors(self, colors: dict):
        self.palette_colors = colors
        self.refresh_matrix()
    
    def refresh_matrix(self):
        if not self.palette_colors:
            self.update("[dim]No palette loaded[/dim]")
            return
        
        lines = []
        
        # Get colors
        bg = self.palette_colors.get("bg", "#000000")
        surf = self.palette_colors.get("surface", "#111111")
        light = self.palette_colors.get("surfaceLighter", "#222222")
        anchor = self.palette_colors.get("anchor", "#888888")
        fg = self.palette_colors.get("fg", "#ffffff")
        fg_dim = self.palette_colors.get("fg_dim", "#aaaaaa")
        
        def status(fg_hex: str, bg_hex: str) -> str:
            ratio = calculate_contrast(fg_hex, bg_hex)
            if ratio >= 7:
                return "✓"
            elif ratio >= 4.5:
                return "⚠"
            else:
                return "✗"
        
        lines.append("┌────────── Unixporn Matrix ──────────┐")
        lines.append("│     [bg] [surf] [light] [anchor]    │")
        
        # Text row
        s = f"│text ⣿⣿{status(fg, bg)}  ⣿⣿{status(fg, surf)}  ⣿⣿{status(fg, light)}   ⣿⣿{status(fg, anchor)}  │"
        lines.append(s)
        
        # Dim row
        s = f"│dim  ⠛⠛{status(fg_dim, bg)}  ⠛⠛{status(fg_dim, surf)}  ⠛⠛{status(fg_dim, light)}   ⠛⠛{status(fg_dim, anchor)}  │"
        lines.append(s)
        
        lines.append("│─────────────────────────────────────│")
        
        # Semantic colors row
        ui_prim = self.palette_colors.get("ui_prim", "#888888")
        sem_red = self.palette_colors.get("sem_red", "#ff0000")
        sem_green = self.palette_colors.get("sem_green", "#00ff00")
        sem_blue = self.palette_colors.get("sem_blue", "#0000ff")
        
        lines.append("│ prim   red   green  blue            │")
        s = f"│  ⣿{status(ui_prim, bg)}   ⣿{status(sem_red, bg)}    ⣿{status(sem_green, bg)}    ⣿{status(sem_blue, bg)}           │"
        lines.append(s)
        
        lines.append("└─────────────────────────────────────┘")
        
        self.update("\n".join(lines))


class ReadabilityBar(Static):
    """Single line readability status."""
    
    def update_from_palette(self, colors: dict):
        if not colors:
            self.update("[dim]No readability data[/dim]")
            return
        
        bg = colors.get("bg", "#000000")
        checks = [
            ("text", colors.get("fg", "#ffffff")),
            ("dim", colors.get("fg_dim", "#aaaaaa")),
            ("prim", colors.get("ui_prim", "#888888")),
            ("red", colors.get("sem_red", "#ff0000")),
            ("green", colors.get("sem_green", "#00ff00")),
            ("blue", colors.get("sem_blue", "#0000ff")),
        ]
        
        parts = []
        for name, fg in checks:
            ratio = calculate_contrast(fg, bg)
            if ratio >= 7:
                parts.append(f"{name}[green]✓[/green]")
            elif ratio >= 4.5:
                parts.append(f"{name}[yellow]⚠[/yellow]")
            else:
                parts.append(f"{name}[red]✗[/red]")
        
        self.update("Readability: " + " ".join(parts))


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SCREEN
# ─────────────────────────────────────────────────────────────────────────────

class ForgeScreen(Screen):
    """The Forge screen for wallpaper selection and theme application."""
    
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("tab", "toggle_mode", "Mode", show=True),
        Binding("enter", "apply_theme", "Apply", show=True),
        Binding("left", "selector_prev", "←", show=False),
        Binding("right", "selector_next", "→", show=False),
        Binding("up", "cursor_up", show=False),
        Binding("down", "cursor_down", show=False),
        Binding("space", "toggle_select", "Select", show=False),
        Binding("g", "toggle_gowall", "Gowall", show=True),
        Binding("r", "random_wallpaper", "Random", show=True),
    ]
    
    CSS = """
    ForgeScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: 1 2 1fr 1;
    }
    
    #header-bar {
        height: 1;
        background: $surface;
        padding: 0 1;
    }
    
    #top-bar {
        height: 2;
        border: solid $primary;
        padding: 0 1;
    }
    
    #content-area {
        layout: horizontal;
    }
    
    #sidebar {
        width: 28;
        border: solid $surface;
        height: 100%;
    }
    
    #main-panel {
        width: 1fr;
        border: solid $surface;
        padding: 1;
    }
    
    #preview-panel {
        height: auto;
        min-height: 8;
    }
    
    #readability-bar {
        height: 1;
        margin-top: 1;
    }
    
    #matrix-panel {
        height: auto;
        margin-top: 1;
    }
    
    #footer-bar {
        height: 1;
        background: $surface;
        padding: 0 1;
    }
    
    WallpaperItem {
        height: 1;
        padding: 0 1;
    }
    
    WallpaperItem:hover {
        background: $primary 20%;
    }
    """
    
    cursor_index = reactive(0)
    
    def __init__(self):
        super().__init__()
        self.session = load_session()
        self.wallpapers = get_wallpapers()
        self.palette = load_palette()
    
    def compose(self) -> ComposeResult:
        # Header
        with Container(id="header-bar"):
            yield Static(self._build_header())
        
        # Top bar with controls
        yield TopBar(id="top-bar")
        
        # Content area (sidebar + main)
        with Horizontal(id="content-area"):
            # Sidebar (28 cols per R-02)
            with ScrollableContainer(id="sidebar"):
                for i, wp in enumerate(self.wallpapers):
                    yield WallpaperItem(wp, is_current=(i == 0), id=f"wp-{i}")
            
            # Main panel
            with Vertical(id="main-panel"):
                yield PreviewPanel(id="preview-panel")
                yield ReadabilityBar(id="readability-bar")
                yield MatrixPanel(id="matrix-panel")
        
        # Footer
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
    
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔮 ", style="bold")
        text.append("Forge", style="bold magenta")
        text.append(f"  [Files:{len(self.wallpapers)}]", style="dim")
        text.append(f"  [Folder:~/Pic/Walls]", style="dim")
        text.append("  [?][q]", style="dim")
        return text
    
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓ ", style="white")
        text.append("[Sel]", style="cyan")
        text.append("Space ", style="white")
        text.append("[Mode]", style="cyan")
        text.append("Tab ", style="white")
        text.append("[←→]", style="cyan")
        text.append("Select ", style="white")
        text.append("[Apply]", style="cyan")
        text.append("Enter ", style="white")
        text.append("[Gowall]", style="cyan")
        text.append("g", style="white")
        return text
    
    def on_mount(self):
        # Load initial preview
        if self.wallpapers:
            preview = self.query_one("#preview-panel", PreviewPanel)
            preview.update_preview(self.wallpapers[0])
        
        # Load palette data
        if self.palette:
            matrix = self.query_one("#matrix-panel", MatrixPanel)
            matrix.update_colors(self.palette)
            
            readability = self.query_one("#readability-bar", ReadabilityBar)
            readability.update_from_palette(self.palette)
    
    def watch_cursor_index(self, old: int, new: int):
        # Update item highlights
        for i, wp in enumerate(self.wallpapers):
            try:
                item = self.query_one(f"#wp-{i}", WallpaperItem)
                item.set_current(i == new)
            except:
                pass
        
        # Update preview
        if self.wallpapers and 0 <= new < len(self.wallpapers):
            preview = self.query_one("#preview-panel", PreviewPanel)
            preview.update_preview(self.wallpapers[new])
    
    def action_go_back(self):
        self.app.pop_screen()
    
    def action_toggle_mode(self):
        topbar = self.query_one("#top-bar", TopBar)
        topbar.toggle_mode()
        self.notify(f"Mode: {topbar.mode.title()}")
    
    def action_selector_prev(self):
        topbar = self.query_one("#top-bar", TopBar)
        if topbar.mode == "mood":
            topbar.prev_mood()
            self.notify(f"Mood: {topbar.get_current_mood()}")
        else:
            topbar.prev_preset()
            self.notify(f"Preset: {topbar.get_current_preset()}")
    
    def action_selector_next(self):
        topbar = self.query_one("#top-bar", TopBar)
        if topbar.mode == "mood":
            topbar.next_mood()
            self.notify(f"Mood: {topbar.get_current_mood()}")
        else:
            topbar.next_preset()
            self.notify(f"Preset: {topbar.get_current_preset()}")
    
    def action_cursor_up(self):
        if self.cursor_index > 0:
            self.cursor_index -= 1
    
    def action_cursor_down(self):
        if self.cursor_index < len(self.wallpapers) - 1:
            self.cursor_index += 1
    
    def action_toggle_select(self):
        if not self.wallpapers:
            return
        try:
            item = self.query_one(f"#wp-{self.cursor_index}", WallpaperItem)
            item.toggle_selected()
        except:
            pass
    
    def action_toggle_gowall(self):
        topbar = self.query_one("#top-bar", TopBar)
        if topbar.mode == "preset":
            topbar.toggle_gowall()
            self.notify(f"Gowall: {'On' if topbar.gowall else 'Off'}")
        else:
            self.notify("Gowall only available in Preset mode", severity="warning")
    
    def action_random_wallpaper(self):
        import random
        if self.wallpapers:
            self.cursor_index = random.randint(0, len(self.wallpapers) - 1)
    
    def action_apply_theme(self):
        """Apply theme for the selected wallpaper."""
        if not self.wallpapers:
            self.notify("No wallpaper selected", severity="warning")
            return
        
        current = self.wallpapers[self.cursor_index]
        topbar = self.query_one("#top-bar", TopBar)
        
        # Build command
        cmd = ["magician", "set", str(current)]
        
        if topbar.mode == "mood":
            mood = topbar.get_current_mood()
            if mood != "adaptive":
                cmd.extend(["--mood", mood])
        else:
            preset = topbar.get_current_preset()
            cmd.extend(["--preset", preset])
            if topbar.gowall:
                cmd.append("--gowall")
        
        self.notify(f"Applying: {current.name}...", severity="information")
        
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Update session
            self.session.last_wallpaper = str(current)
            self.session.last_mood = topbar.get_current_mood() if topbar.mode == "mood" else None
            self.session.last_preset = topbar.get_current_preset() if topbar.mode == "preset" else None
            self.session.gowall_enabled = topbar.gowall
            save_session(self.session)
            
            self.notify("Theme applied!", severity="information")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")
