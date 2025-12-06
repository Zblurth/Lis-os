{ pkgs, ... }:
{
  imports = [
    ./libs/theme-logic.nix
  ];

  # --- Manual Template Definitions ---
  xdg.configFile."wal/templates/vesktop.css".source = ./templates/vesktop.template;

  # --- FIX: Restore the WallSelect theme file ---
  xdg.configFile."rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;

  # --- Theme Infrastructure ---
  systemd.user.services.create-theme-dirs = {
    Unit = {
      Description = "Create mutable theme directories";
    };
    Service = {
      Type = "oneshot";
      ExecStart = "${pkgs.bash}/bin/bash -c 'mkdir -p %h/.config/niri %h/.config/rofi %h/.config/zed/themes %h/.config/vesktop/themes %h/.config/kitty %h/.config/gtk-4.0 %h/.config/gtk-3.0 %h/.cache/wal'";
    };
    Install.WantedBy = [ "default.target" ];
  };
}
