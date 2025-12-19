{
  pkgs,
  stylixImage,
  barChoice,
  ...
}:
let
  barStartupCommand =
    if barChoice == "noctalia" then
      ''spawn-at-startup "noctalia-shell"''
    else
      ''// ${barChoice} started via systemd service'';
  polkitAgent = "${pkgs.mate.mate-polkit}/libexec/polkit-mate-authentication-agent-1";
  updateEnv = pkgs.writeShellScript "niri-env-update" ''
    export XDG_CURRENT_DESKTOP=niri
    export XDG_SESSION_DESKTOP=niri
    export XDG_SESSION_TYPE=wayland
    ${pkgs.dbus}/bin/dbus-update-activation-environment --systemd \
      XDG_CURRENT_DESKTOP \
      XDG_SESSION_DESKTOP \
      XDG_SESSION_TYPE \
      WAYLAND_DISPLAY
    ${pkgs.systemd}/bin/systemctl --user import-environment \
      XDG_CURRENT_DESKTOP \
      XDG_SESSION_DESKTOP \
      XDG_SESSION_TYPE \
      WAYLAND_DISPLAY
  '';
in
''
  spawn-at-startup "${updateEnv}"
  spawn-at-startup "${polkitAgent}"
  spawn-at-startup "bash" "-c" "wl-paste --watch cliphist store &"
  spawn-at-startup "bash" "-c" "swww-daemon && sleep 1 && swww img '${stylixImage}'"
  ${barStartupCommand}
  spawn-at-startup "wal" "-R"
  spawn-at-startup "vivaldi"

  // FIX: Start CoreCtrl after polkit with delay
  spawn-at-startup "bash" "-c" "sleep 3 && ${pkgs.corectrl}/bin/corectrl & disown"

  spawn-at-startup "bash" "-c" "deezer-enhanced --disable-gpu --enable-features=UseOzonePlatform --ozone-platform=wayland > $HOME/.deezer-boot.log 2>&1 & sleep 4; vesktop &"
''
