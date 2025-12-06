{ ... }:
{
  xdg.configFile."zed/settings.json".text = builtins.toJSON {
    ui_font_size = 16;
    buffer_font_size = 16;
    theme = {
      mode = "system";
      light = "LisTheme";
      dark = "LisTheme";
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
        language_servers = [ "nixd" ];
        formatter = {
          external = {
            command = "nixfmt";
            arguments = [ ];
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

  # Source the template from the separate file
  xdg.configFile."wal/templates/zed.json".source = ../theme/templates/zed.template;
}
