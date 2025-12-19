"""
lab.py — TEST_LAB screen for Magician TUI
The crucible for testing palettes across anchors and moods.
"""
import os
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional

from textual.screen import Screen
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Static, Label, Footer, DataTable
from textual.binding import Binding
from textual.reactive import reactive
from rich.text import Text

from .widgets import Header
from .state import XDG_CACHE_HOME

# Test anchors (realistic wallpaper colors)
TEST_ANCHORS = {
    "Deep Purple": "#220975",
    "Sunset Orange": "#E07848",
    "Forest Green": "#2D5A3D",
    "Ocean Blue": "#1E4D6B",
    "Sakura Pink": "#D4A5A5",
    "Twilight": "#4A3B5C",
    "Desert Sand": "#C19A6B",
    "Arctic Blue": "#6B9DAD",
    "Autumn Red": "#8B3A3A",
    "Storm Gray": "#4A5568",
}

# Moods to test
TEST_MOODS = ["adaptive", "deep", "pastel", "vibrant", "bw"]


@dataclass
class TestResult:
    """Result of a palette test."""
    anchor_name: str
    anchor_hex: str
    mood: str
    status: str  # "pass", "warn", "fail"
    contrast_ratio: float = 0.0
    palette: dict = None


def calculate_contrast(fg_hex: str, bg_hex: str) -> float:
    """Calculate WCAG contrast ratio between two colors."""
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


def get_status_from_ratio(ratio: float) -> str:
    """Get status symbol from contrast ratio."""
    if ratio >= 7.0:
        return "✓"
    elif ratio >= 4.5:
        return "⚠"
    else:
        return "✗"


class GridCell(Static):
    """A single cell in the test grid."""
    
    def __init__(self, anchor: str, mood: str, status: str = "?", **kwargs):
        super().__init__(**kwargs)
        self.anchor = anchor
        self.mood = mood
        self.status = status
    
    def on_mount(self):
        self._update_display()
    
    def _update_display(self):
        # Mood short codes
        mood_codes = {
            "adaptive": "ad",
            "deep": "de",
            "pastel": "pa",
            "vibrant": "vi",
            "bw": "bw"
        }
        code = mood_codes.get(self.mood, self.mood[:2])
        
        style = "green" if self.status == "✓" else "yellow" if self.status == "⚠" else "red" if self.status == "✗" else "dim"
        self.update(f"{code}{self.status}")
        self.styles.color = style


class InspectorPanel(Static):
    """Panel showing details of selected test result."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_result: Optional[TestResult] = None
    
    def update_result(self, result: TestResult):
        """Update the inspector with a test result."""
        self.current_result = result
        self._refresh_display()
    
    def _refresh_display(self):
        if not self.current_result:
            self.update("[dim]Select a cell to inspect[/dim]")
            return
        
        r = self.current_result
        lines = []
        
        lines.append(f"[bold]Inspector: {r.anchor_name} + {r.mood}[/bold]")
        lines.append("┌────────────────────────────────────────┐")
        lines.append(f"│ Anchor: {r.anchor_name} ({r.anchor_hex})")
        lines.append(f"│ Mood: {r.mood}")
        lines.append(f"│ Status: {r.status} (Contrast: {r.contrast_ratio:.1f}:1)")
        lines.append("└────────────────────────────────────────┘")
        
        if r.palette:
            lines.append("")
            lines.append("[bold]Palette:[/bold]")
            for key in ["bg", "fg", "ui_prim", "sem_red", "sem_green"]:
                if key in r.palette:
                    lines.append(f"  ⣿ {r.palette[key]} {key}")
        
        self.update("\n".join(lines))


class LabScreen(Screen):
    """The Test Lab screen for batch palette testing."""
    
    BINDINGS = [
        Binding("q", "go_back", "Back", show=True),
        Binding("escape", "go_back", "Back", show=False),
        Binding("s", "start_tests", "Start", show=True),
        Binding("x", "export_results", "Export", show=True),
        Binding("up", "cursor_up", show=False),
        Binding("down", "cursor_down", show=False),
        Binding("left", "cursor_left", show=False),
        Binding("right", "cursor_right", show=False),
    ]
    
    CSS = """
    LabScreen {
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
    
    #grid-panel {
        width: 40;
        border: round $surface;
        padding: 1;
    }
    
    #inspector-panel {
        width: 1fr;
        border: round $surface;
        padding: 1;
    }
    
    #footer-bar {
        height: 3;
        border: round $surface;
        padding: 0 1;
    }
    
    DataTable {
        height: 100%;
    }
    
    DataTable > .datatable--cursor {
        background: $primary 40%;
    }
    """
    
    def __init__(self):
        super().__init__()
        self.results: dict[tuple[str, str], TestResult] = {}
        self.status = "Ready"
    
    def compose(self) -> ComposeResult:
        # Header
        with Container(id="header-bar"):
            yield Static(self._build_header())
        
        # Content
        with Horizontal(id="content-area"):
            # Grid panel
            with Container(id="grid-panel"):
                table = DataTable(id="test-grid")
                table.cursor_type = "cell"
                yield table
            
            # Inspector
            with Vertical(id="inspector-panel"):
                yield InspectorPanel(id="inspector")
        
        # Footer
        with Container(id="footer-bar"):
            yield Static(self._build_footer())
        
        yield Footer()
    
    def _build_header(self) -> Text:
        text = Text()
        text.append("🔬 ", style="blue")
        text.append("Test Lab", style="bold blue")
        text.append(f"  [Anchors:{len(TEST_ANCHORS)}]", style="dim")
        text.append(f"  [Moods:{len(TEST_MOODS)}]", style="dim")
        text.append(f"  [Status:{self.status}]", style="cyan")
        text.append("  [?][q]", style="dim")
        return text
    
    def _build_footer(self) -> Text:
        text = Text()
        text.append("[Nav]", style="cyan")
        text.append("↑↓←→ ", style="white")
        text.append("[Start]", style="cyan")
        text.append("s ", style="white")
        text.append("[Export]", style="cyan")
        text.append("x ", style="white")
        text.append("[Back]", style="cyan")
        text.append("q", style="white")
        return text
    
    def on_mount(self):
        # Setup grid
        table = self.query_one("#test-grid", DataTable)
        
        # Columns: Anchor name + each mood
        table.add_column("Anchor", key="anchor")
        for mood in TEST_MOODS:
            code = mood[:2]
            table.add_column(code, key=mood)
        
        # Rows: Each anchor
        for anchor_name in TEST_ANCHORS:
            row = [anchor_name[:10]]  # Truncated name
            for mood in TEST_MOODS:
                row.append("?")  # Placeholder
            table.add_row(*row, key=anchor_name)
    
    def on_data_table_cell_selected(self, event: DataTable.CellSelected):
        """Handle cell selection in the grid."""
        # Get anchor and mood from selection
        table = self.query_one("#test-grid", DataTable)
        row_key = event.cell_key.row_key
        col_key = event.cell_key.column_key
        
        if row_key and col_key and col_key.value != "anchor":
            anchor_name = row_key.value
            mood = col_key.value
            
            result = self.results.get((anchor_name, mood))
            if result:
                inspector = self.query_one("#inspector", InspectorPanel)
                inspector.update_result(result)
    
    def action_go_back(self):
        self.app.pop_screen()
    
    def action_start_tests(self):
        """Run tests for all anchors and moods."""
        self.status = "Running..."
        self._update_header()
        self.notify("Starting tests...", severity="information")
        
        # Run tests (simplified - just calculate contrast)
        table = self.query_one("#test-grid", DataTable)
        
        for anchor_name, anchor_hex in TEST_ANCHORS.items():
            for mood in TEST_MOODS:
                # Simulate palette generation (in real impl, would call pipeline)
                # For now, estimate contrast based on anchor luminance
                fg = "#ffffff" if self._is_dark(anchor_hex) else "#000000"
                ratio = calculate_contrast(fg, anchor_hex)
                status = get_status_from_ratio(ratio)
                
                result = TestResult(
                    anchor_name=anchor_name,
                    anchor_hex=anchor_hex,
                    mood=mood,
                    status=status,
                    contrast_ratio=ratio,
                    palette={"bg": anchor_hex, "fg": fg}
                )
                self.results[(anchor_name, mood)] = result
                
                # Update table cell
                mood_idx = TEST_MOODS.index(mood) + 1  # +1 for anchor column
                table.update_cell(anchor_name, mood, status)
        
        self.status = "Complete"
        self._update_header()
        self.notify("Tests complete!", severity="information")
    
    def _is_dark(self, hex_color: str) -> bool:
        """Check if a color is dark."""
        hex_color = hex_color.lstrip("#")
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance < 0.5
    
    def _update_header(self):
        header = self.query_one("#header-bar Static", Static)
        header.update(self._build_header())
    
    def action_cursor_up(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_up()
    
    def action_cursor_down(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_down()
    
    def action_cursor_left(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_left()
    
    def action_cursor_right(self):
        table = self.query_one("#test-grid", DataTable)
        table.action_cursor_right()
    
    def action_export_results(self):
        """Export test results to markdown."""
        if not self.results:
            self.notify("No results to export. Run tests first.", severity="warning")
            return
        
        export_path = XDG_CACHE_HOME / "theme-engine" / "lab_results.md"
        
        lines = ["# Test Lab Results", ""]
        lines.append(f"Generated: {__import__('datetime').datetime.now().isoformat()}")
        lines.append("")
        
        # Table header
        header = "| Anchor | " + " | ".join(TEST_MOODS) + " |"
        separator = "|--------|" + "|".join(["----"] * len(TEST_MOODS)) + "|"
        lines.append(header)
        lines.append(separator)
        
        for anchor_name in TEST_ANCHORS:
            row = f"| {anchor_name} |"
            for mood in TEST_MOODS:
                result = self.results.get((anchor_name, mood))
                status = result.status if result else "?"
                row += f" {status} |"
            lines.append(row)
        
        try:
            export_path.parent.mkdir(parents=True, exist_ok=True)
            export_path.write_text("\n".join(lines))
            self.notify(f"Exported to {export_path}", severity="information")
        except Exception as e:
            self.notify(f"Export failed: {e}", severity="error")
