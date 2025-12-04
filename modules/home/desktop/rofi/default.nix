{ ... }:
{
  imports = [
    ./rofi.nix
    ./launcher.nix
    # ./selector.nix # We moved selector logic to theme/scripts.nix, so we don't need this here
  ];
}
