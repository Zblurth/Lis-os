{ pkgs, ... }:
{
  imports = [
    ./scripts.nix
  ];

  home.packages = with pkgs; [
    matugen
    swww
    imagemagick
    rofi
  ];

  xdg.configFile = {
    "matugen/config.toml".source = ./matugen.toml;

    # Original Templates
    "matugen/templates/niri.kdl".source = ./templates/niri.kdl;
    "matugen/templates/rofi.rasi".source = ./templates/rofi.rasi;
    "matugen/templates/discord.css".source = ./templates/discord.css;

    # NEW Templates (Essential for ricing)
    "matugen/templates/zed.json".source = ./templates/zed.json;
    "matugen/templates/kitty.conf".source = ./templates/kitty.conf;
    "matugen/templates/gtk.css".source = ./templates/gtk.css;

    # Rofi Theme
    "rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;
  };

  # Create directories so Matugen doesn't fail
  systemd.user.services.create-theme-dirs = {
    Unit = { Description = "Create mutable theme directories"; };
    Service = {
      Type = "oneshot";
      ExecStart = "${pkgs.bash}/bin/bash -c 'mkdir -p %h/.config/zed/themes %h/.config/vesktop/themes %h/.config/kitty %h/.config/gtk-4.0 %h/.config/gtk-3.0'";
    };
    Install.WantedBy = [ "default.target" ];
  };
}
