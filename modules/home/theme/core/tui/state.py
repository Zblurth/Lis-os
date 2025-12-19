"""
state.py — Session persistence for Magician TUI
Loads/saves session state to ~/.cache/theme-engine/session.json
"""
import json
import os
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

XDG_CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
SESSION_FILE = XDG_CACHE_HOME / "theme-engine" / "session.json"
PALETTE_FILE = XDG_CACHE_HOME / "theme-engine" / "palette.json"


@dataclass
class SessionState:
    """TUI session state."""
    current_screen: str = "MAIN"
    last_wallpaper: Optional[str] = None
    last_mood: str = "adaptive"
    last_preset: Optional[str] = None
    gowall_enabled: bool = False
    primary_color: str = "#888888"  # For logo coloring
    

def load_session() -> SessionState:
    """Load session from disk, or return defaults."""
    state = SessionState()
    
    # Try loading session
    if SESSION_FILE.exists():
        try:
            with open(SESSION_FILE) as f:
                data = json.load(f)
                state.current_screen = data.get("current_screen", "MAIN")
                state.last_wallpaper = data.get("last_wallpaper")
                state.last_mood = data.get("last_mood", "adaptive")
                state.last_preset = data.get("last_preset")
                state.gowall_enabled = data.get("gowall_enabled", False)
        except Exception:
            pass
    
    # Try loading primary color from palette
    if PALETTE_FILE.exists():
        try:
            with open(PALETTE_FILE) as f:
                palette = json.load(f)
                colors = palette.get("colors", {})
                state.primary_color = colors.get("ui_prim", "#888888")
        except Exception:
            pass
    
    return state


def save_session(state: SessionState):
    """Save session to disk."""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(SESSION_FILE, "w") as f:
            json.dump(asdict(state), f, indent=2)
    except Exception:
        pass
