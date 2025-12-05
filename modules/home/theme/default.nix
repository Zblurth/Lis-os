{ pkgs, ... }:
{
  imports = [
    ./libs/theme-logic.nix  # <--- CHANGED THIS
  ];

  home.packages = with pkgs; [
    swww
    imagemagick
    rofi
    pastel
    jq
    gnused
  ];

  xdg.configFile = {
    "rofi/WallSelect.rasi".source = ../desktop/rofi/config/WallSelect.rasi;
    # zed.template is now handled in theme-logic.nix, so we don't strictly need it here,
    # but theme-logic.nix handles the source mapping now.
  };

  systemd.user.services.create-theme-dirs = {
    Unit = { Description = "Create mutable theme directories"; };
    Service = {
      Type = "oneshot";
      ExecStart = "${pkgs.bash}/bin/bash -c 'mkdir -p %h/.config/niri %h/.config/rofi %h/.config/zed/themes %h/.config/vesktop/themes %h/.config/kitty %h/.config/gtk-4.0 %h/.config/gtk-3.0 %h/.cache/wal'";
    };
    Install.WantedBy = [ "default.target" ];
  };
}
