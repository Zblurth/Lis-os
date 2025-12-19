"""
favorites.py — FAVORITES screen for Magician TUI
Manage saved theme combinations.
"""
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import Optional

from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, Button
from textual.binding import Binding
from textual.reactive import reactive
from textual.message import Message
from rich.text import Text

from .widgets import Header
from .state import XDG_CACHE_HOME

# Constants
FAVORITES_FILE = XDG_CACHE_HOME / "theme-engine" / "favorites.json"


@dataclass
class Favorite:
    """A saved theme favorite."""
    id: str
    name: str
    wallpaper_path: str
    generation_mode: str  # "mood" or "preset"
    mood_name: Optional[str] = None
    preset_name: Optional[str] = None
    gowall_enabled: bool = False
    colors: dict = field(default_factory=dict)
    created: str = ""
    last_used: str = ""


def load_favorites() -> list[Favorite]:
    """Load favorites from disk."""
    if not FAVORITES_FILE.exists():
        return []
    try:
        with open(FAVORITES_FILE) as f:
            data = json.load(f)
            return [Favorite(**fav) for fav in data.get("favorites", [])]
    except Exception:
        return []


def save_favorites(favorites: list[Favorite]):
    """Save favorites to disk."""
    FAVORITES_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(FAVORITES_FILE, "w") as f:
            json.dump({"favorites": [asdict(fav) for fav in favorites]}, f, indent=2)
    except Exception:
        pass


def create_favorite(
    name: str,
    wallpaper_path: str,
    mode: str,
    mood: Optional[str] = None,
    preset: Optional[str] = None,
    gowall: bool = False,
    colors: dict = None
) -> Favorite:
    """Create a new favorite."""
    now = datetime.now().isoformat()
    fav_id = f"{Path(wallpaper_path).stem}-{mode[:4]}-{int(datetime.now().timestamp())}"
    return Favorite(
        id=fav_id,
        name=name,
        wallpaper_path=wallpaper_path,
        generation_mode=mode,
        mood_name=mood,
        preset_name=preset,
        gowall_enabled=gowall,
        colors=colors or {},
        created=now,
        last_used=now
    )


class FavoriteItem(Static):
    """A favorite item in the sidebar list."""
    
    def __init__(self, favorite: Favorite, is_current: bool = False, **kwargs):
        super().__init__(**kwargs)
        self.favorite = favorite
        self.is_current = is_current
    
    def on_mount(self):
        self._update_display()
    
    def _update_display(self):
        text = Text()
        prefix = ">" if self.is_current else " "
        
        # Truncate name
        name = self.favorite.name
        if len(name) > 18:
            name = name[:15] + "..."
        
        text.append(f"{prefix} ", style="bold cyan" if self.is_current else "dim")
        text.append(name, style="white" if self.is_current else "dim")
        text.append("\n")
        
        # Show mode
        mode_short = self.favorite.mood_name or self.favorite.preset_name or "?"
        if len(mode_short) > 6:
            mode_short = mode_short[:6]
        text.append(f"  └─[{mode_short}]", style="magenta" if self.favorite.preset_name else "cyan")
        
        self.update(text)
    
    def set_current(self, is_current: bool):
        self.is_current = is_current
        self._update_display()
        if is_current:
            self.add_class("cursor")
        else:
            self.remove_class("cursor")


class FavoriteDetailPanel(Static):
    """Panel showing favorite details and preview."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_favorite: Optional[Favorite] = None
    
    def update_favorite(self, favorite: Favorite):
        """Update the detail view for a favorite."""
        self.current_favorite = favorite
        self._refresh_display()
    
    def _refresh_display(self):
        if not self.current_favorite:
            self.update("[dim]No favorite selected[/dim]")
            return
        
        fav = self.current_favorite
        lines = []
        
        # Header
        lines.append(f"[bold]Detail: {fav.name}[/bold]")
        
        # Badges
        badges = []
        if fav.gowall_enabled:
            badges.append("[green][Gowall:✓][/green]")
        badges.append(f"[dim][Mode:{fav.generation_mode}][/dim]")
        if fav.last_used:
            try:
                dt = datetime.fromisoformat(fav.last_used)
                diff = datetime.now() - dt
                if diff.days > 0:
                    age = f"{diff.days}d ago"
                elif diff.seconds > 3600:
                    age = f"{diff.seconds // 3600}h ago"
                else:
                    age = f"{diff.seconds // 60}m ago"
                badges.append(f"[dim][Used:{age}][/dim]")
            except:
                pass
        lines.append(" ".join(badges))
        lines.append("")
        
        # Wallpaper info
        wp_path = Path(fav.wallpaper_path)
        lines.append(f"[cyan]Wallpaper:[/cyan] {wp_path.name}")
        lines.append("")
        
        # Palette preview (if colors available)
        if fav.colors:
            lines.append("[bold]Palette:[/bold]")
            # Show key colors
            key_colors = ["bg", "fg", "ui_prim", "ui_sec", "anchor"]
            for key in key_colors:
                if key in fav.colors:
                    hex_val = fav.colors[key]
                    lines.append(f"  ⣿ {hex_val} {key}")
        else:
            lines.append("[dim]No palette data cached[/dim]")
        
        self.update("\n".join(lines))


class FavoritesScreen(Screen):
    """The Favorites screen for managing saved themes."""
    
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("enter", "apply_favorite", "Apply", show=True),
        Binding("d", "delete_favorite", "Delete", show=True),
        Binding("up", "cursor_up", show=False),
        Binding("down", "cursor_down", show=False),
    ]
    
    CSS = """
    FavoritesScreen {
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
    
    #footer-bar {
        height: 3;
        border: round $surface;
        padding: 0 1;
    }
    
    .cursor {
        background: $primary 30%;
    }
    
    FavoriteItem {
        height: 2;
        padding: 0 1;
    }
    
    FavoriteItem:hover {
        background: $surface;
    }
    """
    
    cursor_index = reactive(0)
    
    def __init__(self):
        super().__init__()
        self.favorites = load_favorites()
    
    def compose(self) -> ComposeResult:
        # Header
        with Container(id="header-bar"):
            yield Static(self._build_header())
        
        # Content area
        with Horizontal(id="content-area"):
            # Sidebar
            with ScrollableContainer(id="sidebar"):
                for i, fav in enumerate(self.favorites):
                    yield FavoriteItem(fav, is_current=(i == 0))
                if not self.favorites:
                    yield Static("[dim]No favorites yet[/dim]\n\nCreate one from Forge\nby saving a theme.")
            
            # Detail panel
            with Vertical(id="main-panel"):
                yield FavoriteDetailPanel(id="detail-panel")
        
        # Footer
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
        
        yield Footer()
    
    def _build_header(self) -> Text:
        text = Text()
        text.append("⭐ ", style="yellow")
        text.append("Favorites", style="bold yellow")
        text.append(f"  [{len(self.favorites)} saved]", style="dim")
        text.append("  [d]elete [a]pply [?][q]", style="dim")
        return text
    
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓ ", style="white")
        text.append("[Apply]", style="cyan")
        text.append("Enter ", style="white")
        text.append("[Delete]", style="cyan")
        text.append("d ", style="white")
        text.append("[Back]", style="cyan")
        text.append("q", style="white")
        return text
    
    def on_mount(self):
        # Show first favorite's details
        if self.favorites:
            detail = self.query_one("#detail-panel", FavoriteDetailPanel)
            detail.update_favorite(self.favorites[0])
    
    def watch_cursor_index(self, old: int, new: int):
        """Update display when cursor moves."""
        # Update item highlights
        items = list(self.query(FavoriteItem))
        for i, item in enumerate(items):
            item.set_current(i == new)
        
        # Update detail panel
        if self.favorites and 0 <= new < len(self.favorites):
            detail = self.query_one("#detail-panel", FavoriteDetailPanel)
            detail.update_favorite(self.favorites[new])
    
    def action_go_back(self):
        self.app.pop_screen()
    
    def action_cursor_up(self):
        if self.cursor_index > 0:
            self.cursor_index -= 1
    
    def action_cursor_down(self):
        if self.cursor_index < len(self.favorites) - 1:
            self.cursor_index += 1
    
    def action_apply_favorite(self):
        """Apply the selected favorite."""
        if not self.favorites:
            self.notify("No favorites to apply", severity="warning")
            return
        
        fav = self.favorites[self.cursor_index]
        
        # Build command
        cmd = ["magician", "set", fav.wallpaper_path]
        
        if fav.generation_mode == "mood" and fav.mood_name:
            cmd.extend(["--mood", fav.mood_name])
        elif fav.generation_mode == "preset" and fav.preset_name:
            cmd.extend(["--preset", fav.preset_name])
            if fav.gowall_enabled:
                cmd.append("--gowall")
        
        self.notify(f"Applying: {fav.name}...", severity="information")
        
        try:
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Update last used
            fav.last_used = datetime.now().isoformat()
            save_favorites(self.favorites)
            
            self.notify("Favorite applied!", severity="information")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")
    
    def action_delete_favorite(self):
        """Delete the selected favorite."""
        if not self.favorites:
            self.notify("No favorites to delete", severity="warning")
            return
        
        fav = self.favorites[self.cursor_index]
        self.favorites.pop(self.cursor_index)
        save_favorites(self.favorites)
        
        # Update cursor
        if self.cursor_index >= len(self.favorites) and self.cursor_index > 0:
            self.cursor_index -= 1
        
        # Refresh screen
        self.notify(f"Deleted: {fav.name}", severity="information")
        self.refresh()
