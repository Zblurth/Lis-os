{ pkgs, config, ... }:
{
  # Vivaldi flags for middle-click autoscroll and Wayland
  xdg.configFile."vivaldi/flags.conf".text = ''
    --enable-features=MiddleClickAutoscroll
    --ozone-platform-hint=wayland
    --enable-wayland-ime
  '';
}
