{ pkgs, ... }:
{
  # Antigravity Configuration
  # Note: We manage this manually because programs.vscode is not compatible with the custom package structure.

  # 1. Install Package
  home.packages = with pkgs; [
    (symlinkJoin {
      name = "antigravity";
      paths = [ antigravity ];
      buildInputs = [ makeWrapper ];
      postBuild = ''
        wrapProgram $out/bin/antigravity \
          --set ELECTRON_OZONE_PLATFORM_HINT "x11"
      '';
    })
    vscode-extensions.jnoortheen.nix-ide
    vscode-extensions.mkhl.direnv
  ];

  # 2. Config (Settings)
  # We write directly to the Antigravity config path.
  xdg.configFile."Antigravity/User/settings-base.json".text = builtins.toJSON {
    "workbench.colorTheme" = "LisTheme";

    # Fonts & UI
    "editor.fontFamily" = "'JetBrains Mono', 'Droid Sans Mono', 'monospace', monospace";
    "editor.fontSize" = 14;
    "terminal.integrated.fontFamily" = "'JetBrains Mono'";
    "editor.minimap.enabled" = false;

    # Nix IDE Setup
    "nix.enableLanguageServer" = true;
    "nix.serverPath" = "nixd";
    "nix.serverSettings" = {
      "nixd" = {
        "formatting" = {
          "command" = [ "nixfmt" ];
        };
        "options" = {
          "nixos" = {
            "expr" = "(builtins.getFlake \"/home/lune/Lis-os\").nixosConfigurations.nixos.options";
          };
          "home-manager" = {
            "expr" = "(builtins.getFlake \"/home/lune/Lis-os\").homeConfigurations.lune.options";
          };
        };
      };
    };
    "[nix]" = {
      "editor.defaultFormatter" = "jnoortheen.nix-ide";
      "editor.formatOnSave" = true;
    };
  };

  # 3. Register Template for Theme Engine
  xdg.configFile."theme-engine/templates/antigravity.template".source =
    ../theme/templates/antigravity.template;

  # 4. Create Local Theme Extension
  # Antigravity stores extensions in ~/.antigravity/extensions
  home.file.".antigravity/extensions/lis-theme/package.json".text = builtins.toJSON {
    name = "lis-theme";
    displayName = "Lis Theme";
    version = "0.0.1";
    publisher = "Lis";
    engines = {
      vscode = "^1.0.0";
    };
    categories = [ "Themes" ];
    contributes = {
      themes = [
        {
          label = "LisTheme";
          uiTheme = "vs-dark";
          path = "./themes/lis-theme.json";
        }
      ];
    };
  };

  # Ensure themes dir exists
  home.file.".antigravity/extensions/lis-theme/themes/.keep".text = "";
}
