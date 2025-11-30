{ ... }:
{
  # Configure Zed settings (replaces ~/.config/zed/settings.json)
  xdg.configFile."zed/settings.json".text = builtins.toJSON {
    ui_font_size = 16;
    buffer_font_size = 16;

    # Theme (You can change this to "One Dark", "Dracula", etc.)
    # If using Stylix, it might override this, but it's good to have a default.
    theme = {
      mode = "system";
      light = "One Light";
      dark = "One Dark";
    };

    # Editor behavior
    autosave = "on_focus_change";
    tab_size = 2;
    soft_wrap = "editor_width";

    # Terminal settings
    terminal = {
      font_family = "JetBrains Mono";
      font_size = 15;
    };

    # Nix Language Server Configuration
    languages = {
      Nix = {
        # We tell Zed to use nixd first, but fallback to nil if needed
        language_servers = [
          "nixd"
          "nil"
        ];
        formatter = {
          external = {
            command = "nixfmt";
            arguments = [ "--stdin" ];
          };
        };
      };
    };

    # LSP Specific Settings
    lsp = {
      nixd = {
        settings = {
          # Tell nixd how to evaluate the system (enables autocompletion for options)
          nixpkgs = {
            expr = "import <nixpkgs> { }";
          };
          formatting = {
            command = [ "nixfmt" ];
          };
        };
      };
    };
  };
}
