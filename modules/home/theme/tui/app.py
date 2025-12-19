from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Label, Static
from textual.containers import Container

class MagicianTUI(App):
    """Magician Theme Engine TUI."""
    
    CSS = """
    Screen {
        layout: vertical;
        align: center middle;
    }
    .welcome {
        text-align: center;
        padding: 2;
    }
    """
    
    BINDINGS = [("q", "quit", "Quit")]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        yield Container(
            Label("🔮 Magician TUI", classes="welcome"),
            Button("Initialize Engine", variant="primary"),
            classes="main_menu"
        )
        yield Footer()

if __name__ == "__main__":
    app = MagicianTUI()
    app.run()
