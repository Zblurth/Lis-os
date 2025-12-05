{ pkgs, ... }:
{
  home.packages = [ pkgs.zed-editor ];

  xdg.configFile."zed/settings.json".text = builtins.toJSON {
    ui_font_size = 16;
    buffer_font_size = 16;

    theme = {
      mode = "system";
      light = "LisTheme"; # CHANGED
      dark = "LisTheme";  # CHANGED
    };

    autosave = "on_focus_change";
    tab_size = 2;
    soft_wrap = "editor_width";

    terminal = {
      font_family = "JetBrains Mono";
      font_size = 15;
    };

    languages = {
      Nix = {
        language_servers = [ "nixd" "nil" ];
        formatter = {
          external = {
            command = "nixfmt";
            arguments = [ "--stdin" ];
          };
        };
      };
    };

    lsp = {
      nixd = {
        settings = {
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
