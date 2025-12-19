"""
forge.py — FORGE screen for Magician TUI
The unified wallpaper selection, preview, and theme application screen.
"""
import os
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, ListView, ListItem, Label, Footer, Button, Select
from textual.binding import Binding
from textual.reactive import reactive
from textual.message import Message
from rich.text import Text

from .state import load_session, save_session, SessionState
from .widgets import Header

# Constants
XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
WALLPAPER_DIR = Path.home() / "Pictures" / "Wallpapers"
CHAFA_CACHE = XDG_CACHE_HOME / "theme-engine" / "chafa"


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


def get_chafa_preview(image_path: Path, width: int = 60, height: int = 15) -> str:
    """Get terminal preview of image using chafa. Returns cached if available."""
    CHAFA_CACHE.mkdir(parents=True, exist_ok=True)
    
    # Simple cache key from filename + mtime
    cache_key = f"{image_path.stem}_{int(image_path.stat().st_mtime)}"
    cache_file = CHAFA_CACHE / f"{cache_key}.txt"
    
    if cache_file.exists():
        return cache_file.read_text()
    
    try:
        result = subprocess.run(
            ["chafa", "-s", f"{width}x{height}", "--animate=off", str(image_path)],
            capture_output=True,
            text=True,
            timeout=5
        )
        preview = result.stdout
        cache_file.write_text(preview)
        return preview
    except Exception:
        return f"[Preview unavailable: {image_path.name}]"


class WallpaperItem(ListItem):
    """A wallpaper item in the sidebar list."""
    
    def __init__(self, path: Path, selected: bool = False):
        super().__init__()
        self.path = path
        self.is_selected = selected
    
    def compose(self) -> ComposeResult:
        name = truncate_middle(self.path.name, 22)
        prefix = "[✓] " if self.is_selected else "    "
        yield Label(f"{prefix}{name}")


class WallpaperList(ScrollableContainer):
    """Scrollable list of wallpapers with selection support."""
    
    BINDINGS = [
        Binding("up", "cursor_up", "Up", show=False),
        Binding("down", "cursor_down", "Down", show=False),
        Binding("space", "toggle_select", "Select", show=False),
    ]
    
    cursor_index = reactive(0)
    
    def __init__(self, wallpapers: list[Path], **kwargs):
        super().__init__(**kwargs)
        self.wallpapers = wallpapers
        self.selected: set[Path] = set()
    
    def compose(self) -> ComposeResult:
        for i, wp in enumerate(self.wallpapers):
            item = WallpaperItem(wp)
            item.add_class("cursor" if i == 0 else "")
            yield item
    
    def on_mount(self):
        self._update_cursor()
    
    def _update_cursor(self):
        """Update visual cursor position."""
        for i, child in enumerate(self.children):
            if isinstance(child, WallpaperItem):
                if i == self.cursor_index:
                    child.add_class("cursor")
                else:
                    child.remove_class("cursor")
    
    def watch_cursor_index(self, old: int, new: int):
        self._update_cursor()
        # Notify parent of selection change
        if self.wallpapers:
            self.post_message(self.WallpaperHighlighted(self.wallpapers[new]))
    
    def action_cursor_up(self):
        if self.cursor_index > 0:
            self.cursor_index -= 1
            self.scroll_to_widget(list(self.children)[self.cursor_index])
    
    def action_cursor_down(self):
        if self.cursor_index < len(self.wallpapers) - 1:
            self.cursor_index += 1
            self.scroll_to_widget(list(self.children)[self.cursor_index])
    
    def action_toggle_select(self):
        if not self.wallpapers:
            return
        wp = self.wallpapers[self.cursor_index]
        if wp in self.selected:
            self.selected.discard(wp)
        else:
            self.selected.add(wp)
        # Update visual
        child = list(self.children)[self.cursor_index]
        if isinstance(child, WallpaperItem):
            child.is_selected = wp in self.selected
            # Refresh the label
            label = child.query_one(Label)
            prefix = "[✓] " if child.is_selected else "    "
            label.update(f"{prefix}{truncate_middle(wp.name, 22)}")
    
    def get_current(self) -> Path | None:
        if self.wallpapers:
            return self.wallpapers[self.cursor_index]
        return None
    
    class WallpaperHighlighted(Message):
        """Posted when a wallpaper is highlighted."""
        def __init__(self, path: Path):
            super().__init__()
            self.path = path


class PreviewPanel(Static):
    """Panel showing chafa preview and image info."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_path: Path | None = None
        self._executor = ThreadPoolExecutor(max_workers=2)
    
    def update_preview(self, path: Path):
        """Update preview for the given wallpaper."""
        self.current_path = path
        self.update("[dim]Loading preview...[/dim]")
        
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
                self.update(header + preview)
        except Exception as e:
            self.update(f"[red]Preview error: {e}[/red]")


class MatrixPanel(Static):
    """The Unixporn Matrix showing contrast validation."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.colors: dict = {}
    
    def update_colors(self, colors: dict):
        """Update the matrix with new colors."""
        self.colors = colors
        self.refresh_matrix()
    
    def refresh_matrix(self):
        """Rebuild the matrix display."""
        if not self.colors:
            self.update("[dim]No palette loaded[/dim]")
            return
        
        # Build matrix text
        lines = []
        lines.append("┌──────────── Unixporn Matrix ────────────┐")
        lines.append("│     [bg]  [surf] [light] [anchor]       │")
        
        # Get background colors
        bg = self.colors.get("bg", "#000000")
        surf = self.colors.get("surface", "#111111")
        light = self.colors.get("surfaceLighter", "#222222")
        anchor = self.colors.get("anchor", "#888888")
        
        # Get foreground colors
        fg = self.colors.get("fg", "#ffffff")
        fg_dim = self.colors.get("fg_dim", "#aaaaaa")
        
        # Build rows with braille patterns
        # Using colored braille to show the FG color
        def braille_cell(fg_hex: str, bg_hex: str) -> str:
            """Create a braille block with contrast status."""
            # Calculate contrast (simplified)
            try:
                fg_lum = self._get_luminance(fg_hex)
                bg_lum = self._get_luminance(bg_hex)
                ratio = (max(fg_lum, bg_lum) + 0.05) / (min(fg_lum, bg_lum) + 0.05)
                if ratio >= 7:
                    status = "✓"
                elif ratio >= 4.5:
                    status = "⚠"
                else:
                    status = "✗"
            except:
                status = "?"
            
            return f"⣿⣿⣿{status}"
        
        # Text row
        row = "│text "
        for bg_c in [bg, surf, light, anchor]:
            row += braille_cell(fg, bg_c) + " "
        row += "│"
        lines.append(row)
        
        # Dim row
        row = "│dim  "
        for bg_c in [bg, surf, light, anchor]:
            row += braille_cell(fg_dim, bg_c).replace("⣿", "⠛") + " "
        row += "│"
        lines.append(row)
        
        lines.append("│─────────────────────────────────────────│")
        
        # Semantic colors row
        sem_colors = ["ui_prim", "sem_red", "sem_green", "sem_blue"]
        row = "│     "
        for key in sem_colors:
            short = key.replace("sem_", "").replace("ui_", "")[:4]
            row += f" {short}  "
        row += "│"
        lines.append(row)
        
        row = "│     "
        for key in sem_colors:
            c = self.colors.get(key, "#888888")
            row += f" ⣿    "
        row += "│"
        lines.append(row)
        
        lines.append("└─────────────────────────────────────────┘")
        
        self.update("\n".join(lines))
    
    def _get_luminance(self, hex_color: str) -> float:
        """Calculate relative luminance of a color."""
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 8:  # ARGB
            hex_color = hex_color[2:]
        r = int(hex_color[0:2], 16) / 255
        g = int(hex_color[2:4], 16) / 255
        b = int(hex_color[4:6], 16) / 255
        
        def adjust(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        
        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)


class ForgeScreen(Screen):
    """The Forge screen for wallpaper selection and theme application."""
    
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("tab", "toggle_mode", "Mode", show=True),
        Binding("enter", "apply_theme", "Apply", show=True),
        Binding("r", "random_wallpaper", "Random", show=True),
        Binding("up", "focus_up", show=False),
        Binding("down", "focus_down", show=False),
        Binding("space", "toggle_select", show=False),
    ]
    
    CSS = """
    ForgeScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: 3 1fr 3;
    }
    
    #header-bar {
        height: 3;
        border: round $primary;
        padding: 0 1;
    }
    
    #content-area {
        layout: horizontal;
    }
    
    #sidebar {
        width: 28;
        border: round $surface;
        height: 100%;
    }
    
    #main-panel {
        width: 1fr;
        border: round $surface;
        padding: 1;
    }
    
    #preview-panel {
        height: auto;
        min-height: 10;
    }
    
    #matrix-panel {
        height: auto;
        margin-top: 1;
    }
    
    #footer-bar {
        height: 3;
        border: round $surface;
        padding: 0 1;
    }
    
    .cursor {
        background: $primary 30%;
    }
    
    WallpaperItem {
        height: 1;
        padding: 0 1;
    }
    
    WallpaperItem:hover {
        background: $surface;
    }
    """
    
    mode = reactive("mood")  # "mood" or "preset"
    current_mood = reactive("adaptive")
    current_preset = reactive("catppuccin_mocha")
    gowall_enabled = reactive(False)
    
    def __init__(self):
        super().__init__()
        self.session = load_session()
        self.wallpapers = get_wallpapers()
        self.current_colors: dict = {}
    
    def compose(self) -> ComposeResult:
        # Header
        with Container(id="header-bar"):
            yield Static(self._build_header())
        
        # Content area (sidebar + main)
        with Horizontal(id="content-area"):
            # Sidebar (28 cols per R-02)
            with Container(id="sidebar"):
                yield WallpaperList(self.wallpapers, id="wallpaper-list")
            
            # Main panel
            with Vertical(id="main-panel"):
                yield PreviewPanel(id="preview-panel")
                yield MatrixPanel(id="matrix-panel")
        
        # Footer
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
        
        yield Footer()
    
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔮 ", style="bold")
        text.append("Forge", style="bold magenta")
        text.append(f"  [Mode:{self.mode.title()}]", style="cyan")
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
        text.append("[Apply]", style="cyan")
        text.append("Enter ", style="white")
        text.append("[Back]", style="cyan")
        text.append("q", style="white")
        return text
    
    def on_mount(self):
        # Load initial preview
        if self.wallpapers:
            preview = self.query_one("#preview-panel", PreviewPanel)
            preview.update_preview(self.wallpapers[0])
            
            # Load palette if exists
            self._load_current_palette()
    
    def _load_current_palette(self):
        """Load the current palette from cache."""
        import json
        palette_file = XDG_CACHE_HOME / "theme-engine" / "palette.json"
        if palette_file.exists():
            try:
                with open(palette_file) as f:
                    data = json.load(f)
                    self.current_colors = data.get("colors", {})
                    matrix = self.query_one("#matrix-panel", MatrixPanel)
                    matrix.update_colors(self.current_colors)
            except Exception:
                pass
    
    def on_wallpaper_list_wallpaper_highlighted(self, event: WallpaperList.WallpaperHighlighted):
        """Handle wallpaper highlight change."""
        preview = self.query_one("#preview-panel", PreviewPanel)
        preview.update_preview(event.path)
    
    def action_go_back(self):
        self.app.pop_screen()
    
    def action_toggle_mode(self):
        self.mode = "preset" if self.mode == "mood" else "mood"
        # Update header
        header = self.query_one("#header-bar Static", Static)
        header.update(self._build_header())
        self.notify(f"Mode: {self.mode.title()}")
    
    def action_focus_up(self):
        wl = self.query_one("#wallpaper-list", WallpaperList)
        wl.action_cursor_up()
    
    def action_focus_down(self):
        wl = self.query_one("#wallpaper-list", WallpaperList)
        wl.action_cursor_down()
    
    def action_toggle_select(self):
        wl = self.query_one("#wallpaper-list", WallpaperList)
        wl.action_toggle_select()
    
    def action_random_wallpaper(self):
        import random
        if self.wallpapers:
            wl = self.query_one("#wallpaper-list", WallpaperList)
            wl.cursor_index = random.randint(0, len(self.wallpapers) - 1)
    
    def action_apply_theme(self):
        """Apply theme for the selected wallpaper."""
        wl = self.query_one("#wallpaper-list", WallpaperList)
        current = wl.get_current()
        
        if not current:
            self.notify("No wallpaper selected", severity="warning")
            return
        
        # Build command
        cmd = ["magician", "set", str(current)]
        
        if self.mode == "mood":
            if self.current_mood != "adaptive":
                cmd.extend(["--mood", self.current_mood])
        else:
            cmd.extend(["--preset", self.current_preset])
            if self.gowall_enabled:
                cmd.append("--gowall")
        
        self.notify(f"Applying: {current.name}...", severity="information")
        
        # Run in background
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Update session
            self.session.last_wallpaper = str(current)
            self.session.last_mood = self.current_mood if self.mode == "mood" else None
            self.session.last_preset = self.current_preset if self.mode == "preset" else None
            self.session.gowall_enabled = self.gowall_enabled
            save_session(self.session)
            
            self.notify("Theme applied!", severity="information")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")
