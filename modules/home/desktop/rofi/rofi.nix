{ ... }:
{
  # Package is now in modules/home/packages.nix
  xdg.configFile."rofi/config.rasi".source = ./config/launcher.rasi;
}
