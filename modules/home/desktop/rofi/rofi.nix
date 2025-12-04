{ pkgs, ... }:
{
  home.packages = [ pkgs.rofi ];

  # Link the main launcher config
  xdg.configFile."rofi/config.rasi".source = ./config/launcher.rasi;
}
