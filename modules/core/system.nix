{ pkgs, ... }:
let
  variables = import ../../hosts/variables.nix;
  inherit (variables) consoleKeyMap timeZone;
in
{
  nix = {
    settings = {
      download-buffer-size = 250000000;
      auto-optimise-store = true;
      experimental-features = [
        "nix-command"
        "flakes"
      ];
      substituters = [
        "https://hyprland.cachix.org"
        "https://nyx.chaotic.cx"
      ];
      trusted-public-keys = [
        "hyprland.cachix.org-1:a7pgxzMz7+chwVL3/pzj6jIBMioiJM7ypFP8PwtkuGc="
        "nyx.chaotic.cx-1:HfnXSw4pjGN/t5FvAFXxI4uE8r2wkTy85vRpne3w8Fs="
      ];
      warn-dirty = false;
    };
  };
  time.timeZone = "${timeZone}";
  i18n.defaultLocale = "en_US.UTF-8";
  programs.nix-ld.enable = true;
  programs.nix-ld.libraries = with pkgs; [
    stdenv.cc.cc.lib
    zlib
    openssl
    libGL
  ];
  console.keyMap = "${consoleKeyMap}";
  system.stateVersion = "25.05";
}
