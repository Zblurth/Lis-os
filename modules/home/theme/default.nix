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

  # Link Templates
  xdg.configFile = {
    "matugen/config.toml".source = ./matugen.toml;
    "matugen/templates/niri.kdl".source = ./templates/niri.kdl;
    "matugen/templates/rofi.rasi".source = ./templates/rofi.rasi;
    "matugen/templates/zed.json".source = ./templates/zed.json;
    "matugen/templates/discord.css".source = ./templates/discord.css;
    
    "rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;
  };

  # Create directories for mutable themes so Matugen can write to them
  # We use a systemd one-shot to ensure they exist
  systemd.user.services.create-theme-dirs = {
    Unit = { Description = "Create mutable theme directories"; };
    Service = {
      Type = "oneshot";
      ExecStart = "${pkgs.bash}/bin/bash -c 'mkdir -p %h/.config/zed/themes %h/.config/vesktop/themes'";
    };
    Install.WantedBy = [ "default.target" ];
  };
}
