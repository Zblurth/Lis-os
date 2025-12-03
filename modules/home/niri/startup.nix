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

  # FORCEFUL Environment Update Script
  updateEnv = pkgs.writeShellScript "niri-env-update" ''
    # 1. Upload variables to Systemd/DBus
    ${pkgs.dbus}/bin/dbus-update-activation-environment --systemd --all
    ${pkgs.systemd}/bin/systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP DISPLAY XDG_SESSION_TYPE

    # 2. KILL any portals that started too early (Fixes the 30s timeout)
    ${pkgs.systemd}/bin/systemctl --user stop xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-gnome
    ${pkgs.systemd}/bin/systemctl --user reset-failed xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-gnome

    # 3. Portals will auto-start correctly when the first app (Vivaldi/Vesktop) requests them.
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
