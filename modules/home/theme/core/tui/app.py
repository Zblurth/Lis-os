"""
app.py — Main Textual application for Magician TUI
"""
from textual.app import App
from textual.screen import Screen

from .main_menu import MainMenu
from .forge import ForgeScreen
from .favorites import FavoritesScreen
from .lab import LabScreen


class MagicianApp(App):
    """The Magician Theme Engine TUI."""
    
    TITLE = "Magician"
    SUB_TITLE = "Theme Engine v2.2"
    
    CSS = """
    Screen {
        background: $background;
    }
    """
    
    SCREENS = {
        "main": MainMenu,
        "forge": ForgeScreen,
        "favorites": FavoritesScreen,
        "lab": LabScreen,
    }
    
    def on_mount(self):
        self.push_screen("main")


def run():
    """Entry point for the TUI."""
    app = MagicianApp()
    app.run()


if __name__ == "__main__":
    run()
