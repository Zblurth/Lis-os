{ pkgs, ... }:
{
  home.packages = with pkgs; [
    # ========================
    # ESSENTIAL APPS
    # ========================
    vivaldi           # Browser
    vesktop           # Discord
    deezer-enhanced   # Music
    zed-editor        # Code

    # ========================
    # UTILITIES
    # ========================
    gemini-cli        # Gemini protocol
    nvd               # Nix diffs
    errands           # Todo app
    github-cli        # Manage Github
    hyfetch           # Gay flex

    # ========================
    # FILE MANAGEMENT & MEDIA
    # ========================
    xfce.thunar  # File manager
    xfce.thunar-archive-plugin    # Right-click extract
    xfce.thunar-volman            # Auto-mount USB
    xfce.thunar-media-tags-plugin # Audio tags
    ffmpegthumbnailer             # Video thumbnails
    file-roller             # Archive GUI

    ffmpegthumbnailer # Thumbnails
    grim              # Screenshots
    slurp             # Area selection
    wl-clipboard      # Clipboard
    swappy            # Edit screenshots

    # ========================
    # RICING
    # ========================
    imagemagick      # Convert bitmap images
    pastel           # Palette generator
    swww             # Wallpaper switch

    # ========================
    # SYSTEM TOOLS
    # ========================
    networkmanagerapplet
    ddcutil           # Monitor control
    playerctl         # Media keys
    swayosd           # Volume/brightness OSD
    brightnessctl
  ];
}
