"""
widgets.py — Shared TUI components for Magician
"""
from textual.widget import Widget
from textual.app import ComposeResult
from textual.widgets import Static
from rich.text import Text


# MAGICIAN ASCII Logo (from design doc)
LOGO_LINES = [
    "███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗██╗ █████╗ ███╗   ██╗",
    "████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝██║██╔══██╗████╗  ██║",
    "██╔████╔██║███████║██║  ███╗██║██║     ██║███████║██╔██╗ ██║",
    "██║╚██╔╝██║██╔══██║██║   ██║██║██║     ██║██╔══██║██║╚██╗██║",
    "██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗██║██║  ██║██║ ╚████║",
    "╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝",
]


class Logo(Static):
    """The MAGICIAN ASCII logo, colored with the primary theme color."""
    
    DEFAULT_CSS = """
    Logo {
        width: 100%;
        height: auto;
        content-align: center middle;
        text-align: center;
    }
    """
    
    def __init__(self, color: str = "#888888", **kwargs):
        super().__init__(**kwargs)
        self.color = color
    
    def compose(self) -> ComposeResult:
        return []
    
    def on_mount(self):
        self.update_logo()
    
    def update_logo(self, color: str = None):
        if color:
            self.color = color
        text = Text()
        for line in LOGO_LINES:
            text.append(line + "\n", style=self.color)
        self.update(text)


class KeyHint(Static):
    """Footer key hint in format [Action]key"""
    
    DEFAULT_CSS = """
    KeyHint {
        text-align: center;
        color: $text-muted;
    }
    """


class Header(Static):
    """Screen header with title and badges."""
    
    DEFAULT_CSS = """
    Header {
        dock: top;
        height: 1;
        background: $surface;
        color: $text;
        text-align: center;
        padding: 0 1;
    }
    """
