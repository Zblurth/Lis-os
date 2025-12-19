{
  pkgs,
  config,
  lib,
  ...
}:
let
  # Load the packages once
  themePkgs = pkgs.callPackage ./packages.nix { inherit config; };
in
{
  # 1. Install the scripts
  home.packages = with themePkgs; [
    # Core Scripts
    engineScript
    compareScript
    testScript
    daemonScript
    magicianScript
    precacheScript

    # Binary Dependencies (pastel/imagemagick removed - now native or disabled)
    pkgs.jq
    pkgs.swww
    pkgs.gowall # Make gowall available interactively
  ];

  # 2. Systemd Service for the Daemon
  systemd.user.services.lis-daemon = {
    Unit = {
      Description = "Lis-OS Configuration Orchestrator";
      After = [ "graphical-session-pre.target" ];
      PartOf = [ "graphical-session.target" ];
    };

    Service = {
      ExecStart = "${themePkgs.daemonScript}/bin/lis-daemon";
      Restart = "on-failure";
      RestartSec = "5s";
    };

    Install = {
      WantedBy = [ "graphical-session.target" ];
    };
  };

  # 3. Import the actual config modules
  imports = [
    ./gtk.nix
    ./qt.nix
    ./stylix/stylix.nix
  ];

  # 4. Static Config Files (Symlinks)
  xdg.configFile."theme-engine/moods.json".source = ./config/moods.json;

  # Templates (Read-Only Source)
  xdg.configFile."theme-engine/templates/kitty.conf".source = ./templates/kitty.conf;
  xdg.configFile."theme-engine/templates/starship.toml".source = ./templates/starship.toml;
  xdg.configFile."theme-engine/templates/rofi.rasi".source = ./templates/rofi.rasi;
  xdg.configFile."theme-engine/templates/ags-colors.css".source = ./templates/ags-colors.css;
  xdg.configFile."theme-engine/templates/zed.json".source = ./templates/zed.template;
  xdg.configFile."theme-engine/templates/vesktop.css".source = ./templates/vesktop.template;
  xdg.configFile."theme-engine/templates/niri.kdl".source = ./templates/niri.kdl;
  xdg.configFile."theme-engine/templates/gtk.css".source = ./templates/gtk.css;
  xdg.configFile."theme-engine/templates/wezterm.lua".source = ./templates/wezterm.lua;
  xdg.configFile."theme-engine/templates/antigravity.template".source =
    ./templates/antigravity.template;
  xdg.configFile."theme-engine/templates/zellij.kdl".source = ./templates/zellij.kdl;
  xdg.configFile."theme-engine/templates/colors.sh".source = ./templates/colors.sh;
}
