{ ... }:
{
  home.sessionVariables = {
    # --- BROWSER / DEFAULT APPS ---
    BROWSER = "xdg-open";
    EDITOR = "zeditor";
    TERMINAL = "kitty";

    # --- GRAPHICS FLAGS (The Source of Truth) ---
    # Forces Electron apps (Vesktop/Vivaldi) to use Wayland native.
    NIXOS_OZONE_WL = "1";
    MOZ_ENABLE_WAYLAND = "1";
    ELECTRON_OZONE_PLATFORM_HINT = "wayland";

    # --- PORTAL IDENTIFICATION ---
    # This helps Portals know who they are talking to
    XDG_CURRENT_DESKTOP = "niri";
    XDG_SESSION_DESKTOP = "niri";
    XDG_SESSION_TYPE = "wayland";

    # --- TOOLKIT BACKENDS ---
    GTK_USE_PORTAL = "1";
    QT_QPA_PLATFORM = "wayland";

    # --- JAVA FIX ---
    _JAVA_AWT_WM_NONREPARENTING = "1";

    FONTCONFIG_FILE = "/etc/fonts/fonts.conf";
  };

  # SwayOSD Service (Fixes brightness keys and OSD)
  services.swayosd.enable = true;
}
