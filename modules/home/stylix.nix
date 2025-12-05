{
  pkgs,
  lib,
  ...
}:
let
  variables = import ../../hosts/variables.nix;
  inherit (variables) stylixImage stylixEnable;
in
lib.mkIf stylixEnable {
  stylix = {
    enable = true;
    image = stylixImage;
    autoEnable = false;

    # Only disable what we are actively managing
    targets.gtk.enable = false;
    targets.kitty.enable = false;

    polarity = "dark";

    cursor = {
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Ice";
      size = 24;
    };
    fonts = {
      monospace = {
        package = pkgs.nerd-fonts.jetbrains-mono;
        name = "JetBrains Mono";
      };
      sansSerif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      serif = {
        package = pkgs.montserrat;
        name = "Montserrat";
      };
      sizes = {
        applications = 12;
        terminal = 15;
        desktop = 11;
        popups = 12;
      };
    };
  };
}
