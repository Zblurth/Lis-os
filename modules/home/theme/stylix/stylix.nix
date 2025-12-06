{ pkgs, ... }:
let
  # This points to the file sitting right next to this .nix file
  wallpaperPath = ./wallpaper.jpg;
in
{
  stylix = {
    enable = true;
    image = wallpaperPath;
    autoEnable = false;

    # We disable these targets because we handle them manually
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
