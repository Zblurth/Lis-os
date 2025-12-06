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
  // 1. Run the Environment Fix script immediately
  spawn-at-startup "${updateEnv}"
  // 2. Start Polkit (Password prompts)
  spawn-at-startup "${polkitAgent}"

  // 3. Desktop Components
  spawn-at-startup "bash" "-c" "wl-paste --watch cliphist store &"
  spawn-at-startup "bash" "-c" "swww-daemon && sleep 1 && swww img '${stylixImage}'"
  ${barStartupCommand}
  spawn-at-startup "wal" "-R"
  // 4. Apps (Apps will trigger the portal restart automatically now)
  spawn-at-startup "vivaldi"
  spawn-at-startup "corectrl"
  // Launch Deezer first (Left), wait 4s for Electron to init, then Vesktop (Right)
  spawn-at-startup "bash" "-c" "deezer-enhanced --enable-features=UseOzonePlatform --ozone-platform=wayland & sleep 4; vesktop &"
''
