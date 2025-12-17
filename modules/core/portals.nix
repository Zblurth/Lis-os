{ pkgs, ... }:
{
  xdg.portal = {
    enable = true;
    wlr.enable = false; # Niri uses GNOME portal, not WLR
    xdgOpenUsePortal = true; # Force apps to use the portal for links/files

    extraPortals = [
      pkgs.xdg-desktop-portal-gtk
      pkgs.xdg-desktop-portal-gnome
    ];

    config = {
      # Specific rules for Niri session
      niri = {
        default = [ "gtk" ]; # Use GTK for FileChooser/etc (Faster/Reliable)
        "org.freedesktop.impl.portal.ScreenCast" = [ "gnome" ]; # Discord/Vesktop streaming
        "org.freedesktop.impl.portal.Screenshot" = [ "gnome" ];
        "org.freedesktop.impl.portal.Secret" = [ "gnome-keyring" ]; # Passwords
      };
      # Fallback rules
      common = {
        default = [ "gtk" ]; # Use GTK fallback
        "org.freedesktop.impl.portal.ScreenCast" = [ "gnome" ];
        "org.freedesktop.impl.portal.Screenshot" = [ "gnome" ];
        "org.freedesktop.impl.portal.Secret" = [ "gnome-keyring" ];
      };
    };
  };
}
