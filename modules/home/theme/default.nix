{ pkgs, ... }:
{
  imports = [
    ./scripts.nix
  ];

  home.packages = with pkgs; [
    swww
    imagemagick
    rofi
    pastel # The Math Wizard
    jq     # JSON Wizard
    gnused
  ];

  xdg.configFile = {
    # Rofi Theme Layout (Static)
    "rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;

    # We NO LONGER need to link templates here.
    # The script will write to ~/.config/niri/colors.kdl, etc.
    # But we need to ensure the Zed template exists for the script to read.
    "wal/templates/zed.template".source = ./templates/zed.template;
  };

  systemd.user.services.create-theme-dirs = {
    Unit = { Description = "Create mutable theme directories"; };
    Service = {
      Type = "oneshot";
      # Ensure all target directories exist
      ExecStart = "${pkgs.bash}/bin/bash -c 'mkdir -p %h/.config/niri %h/.config/rofi %h/.config/zed/themes %h/.config/vesktop/themes %h/.config/kitty %h/.config/gtk-4.0 %h/.config/gtk-3.0 %h/.cache/wal'";
    };
    Install.WantedBy = [ "default.target" ];
  };
}
