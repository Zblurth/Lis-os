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

  # Simple environment variable setting (no killing)
  updateEnv = pkgs.writeShellScript "niri-env-update" ''
    # Set critical Wayland/Niri environment variables
    export XDG_CURRENT_DESKTOP=niri
    export XDG_SESSION_DESKTOP=niri
    export XDG_SESSION_TYPE=wayland

    # Update DBus activation environment
    ${pkgs.dbus}/bin/dbus-update-activation-environment --systemd \
      XDG_CURRENT_DESKTOP \
      XDG_SESSION_DESKTOP \
      XDG_SESSION_TYPE \
      WAYLAND_DISPLAY

    # Import into systemd user instance
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

  // 3. Start SwayOSD Server (The background worker)
  spawn-at-startup "swayosd-server"

  // 4. Desktop Components
  spawn-at-startup "bash" "-c" "wl-paste --watch cliphist store &"
  spawn-at-startup "bash" "-c" "swww-daemon && sleep 1 && swww img '${stylixImage}'"
  ${barStartupCommand}
  spawn-at-startup "wal" "-R"

  // 5. Apps (Apps will trigger the portal restart automatically now)
  spawn-at-startup "vivaldi"
  spawn-at-startup "corectrl"
  spawn-at-startup "bash" "-c" "deezer-enhanced --ozone-platform=wayland & sleep 2; vesktop &"
''
