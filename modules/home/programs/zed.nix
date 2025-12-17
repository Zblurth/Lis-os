{ pkgs, config, ... }:
{
  programs.zed-editor = {
    enable = true;
    # We use the standard package for native speed and a perfect terminal experience.
    package = pkgs.zed-editor;

    # A minimal, useful set of extensions. No AI.
    extensions = [
      "nix"
      "toml"
      "make"
      "git-firefly" # A great Git history extension
    ];

    # All settings are focused on the core editing experience.
    userSettings = {
      # --- UI & Editor ---
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

      # --- Terminal ---
      terminal = {
        font_family = "JetBrains Mono";
        font_size = 15;
      };

      # --- Core Language Support for Nix ---
      # This is the most important part for a great NixOS experience.
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

      # Specific LSP configuration for nixd.
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
  };

  # --- Personal Theme ---
  # Your custom theming is completely independent and works perfectly.
  xdg.configFile."theme-engine/templates/zed.json".source = ../theme/templates/zed.template;
}
