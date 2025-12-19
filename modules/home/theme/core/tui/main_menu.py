"""
main_menu.py — MAIN screen for Magician TUI
The gateway screen with logo, navigation, and recent theme info.
"""
from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, Center
from textual.widgets import Static, Footer
from textual.binding import Binding
from rich.text import Text
from pathlib import Path

from .widgets import Logo, LOGO_LINES
from .state import load_session


class MainMenu(Screen):
    """Main menu screen - the gateway."""
    
    BINDINGS = [
        Binding("1", "goto_forge", "Forge", show=True),
        Binding("2", "goto_forge", "Gowall", show=True),  # Same as forge, different mode
        Binding("3", "goto_lab", "Lab", show=True),
        Binding("4", "goto_favorites", "Favorites", show=True),
        Binding("5", "goto_settings", "Settings", show=True),
        Binding("q", "quit", "Quit", show=True),
        Binding("?", "help", "Help", show=True),
        Binding("enter", "apply_recent", "Apply Recent", show=False),
    ]
    
    DEFAULT_CSS = """
    MainMenu {
        align: center middle;
    }
    
    #main-container {
        width: 70;
        height: auto;
        border: round $primary;
        padding: 0;
    }
    
    #header {
        width: 100%;
        height: 1;
        background: $surface;
        text-align: center;
    }
    
    #nav-row {
        width: 100%;
        height: 1;
        text-align: center;
        margin: 0;
        padding: 0;
    }
    
    #recent-row {
        width: 100%;
        height: 1;
        text-align: center;
        color: $text-muted;
        margin: 1 0;
    }
    
    #logo-container {
        width: 100%;
        height: auto;
        align: center middle;
        margin: 1 0;
    }
    
    #hint {
        width: 100%;
        height: 1;
        text-align: center;
        color: $text-muted;
        margin-top: 1;
    }
    
    .separator {
        width: 100%;
        height: 1;
        background: $surface;
    }
    """
    
    def __init__(self):
        super().__init__()
        self.session = load_session()
    
    def compose(self) -> ComposeResult:
        with Container(id="main-container"):
            # Header
            yield Static(self._build_header(), id="header")
            yield Static("", classes="separator")
            
            # Navigation row
            yield Static(self._build_nav(), id="nav-row")
            
            # Recent theme line
            yield Static(self._build_recent(), id="recent-row")
            
            yield Static("", classes="separator")
            
            # Logo
            with Center(id="logo-container"):
                yield Logo(color=self.session.primary_color)
            
            # Hint
            yield Static("Press 1-5 or ? for help", id="hint")
    
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔮 ", style="bold")
        text.append("MAGICAL", style="bold magenta")
        text.append("  v2.2  ", style="dim")
        text.append("[nixos@wayland]", style="cyan")
        text.append("  [?]  [q:Quit]", style="dim")
        return text
    
    def _build_nav(self) -> Text:
        text = Text()
        text.append("[1]", style="cyan")
        text.append("⚡Forge ", style="yellow")
        text.append("[2]", style="cyan")
        text.append("🎨Gowall ", style="green")
        text.append("[3]", style="cyan")
        text.append("🔬Lab ", style="blue")
        text.append("[4]", style="cyan")
        text.append("⭐Fav ", style="yellow")
        text.append("[5]", style="cyan")
        text.append("⚙️ Settings", style="white")
        return text
    
    def _build_recent(self) -> Text:
        if not self.session.last_wallpaper:
            return Text("No recent theme", style="dim")
        
        text = Text()
        wallpaper_name = Path(self.session.last_wallpaper).name if self.session.last_wallpaper else "none"
        # Truncate if too long
        if len(wallpaper_name) > 20:
            wallpaper_name = wallpaper_name[:8] + "…" + wallpaper_name[-8:]
        
        text.append("Recent: ", style="dim")
        text.append(wallpaper_name, style="white")
        
        if self.session.last_preset:
            text.append(" + ", style="dim")
            text.append(self.session.last_preset, style="magenta")
        elif self.session.last_mood:
            text.append(" + ", style="dim")
            text.append(self.session.last_mood, style="cyan")
        
        if self.session.gowall_enabled:
            text.append(" [Gowall:✓]", style="green")
        
        text.append(" [Enter:▶]", style="dim")
        return text
    
    # Actions
    def action_goto_forge(self):
        self.app.push_screen("forge")
    
    def action_goto_lab(self):
        self.notify("Test Lab not implemented yet", severity="warning")
    
    def action_goto_favorites(self):
        self.notify("Favorites not implemented yet", severity="warning")
    
    def action_goto_settings(self):
        self.notify("Settings not implemented yet", severity="warning")
    
    def action_help(self):
        self.notify("Help overlay not implemented yet", severity="information")
    
    def action_apply_recent(self):
        if self.session.last_wallpaper:
            self.notify(f"Would apply: {self.session.last_wallpaper}", severity="information")
        else:
            self.notify("No recent theme to apply", severity="warning")
    
    def action_quit(self):
        self.app.exit()
