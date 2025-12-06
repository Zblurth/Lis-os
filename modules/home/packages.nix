{ pkgs, ... }:
{
  home.packages = with pkgs; [
    # ========================
    # ESSENTIAL APPS
    # ========================
    deezer-enhanced # Music
    vesktop # Discord
    vivaldi # Browser
    zed-editor # Code

    # ========================
    # UTILITIES
    # ========================
    errands # Todo app
    gemini-cli # Gemini protocol
    github-cli # Manage Github
    gnused # Stream editor (Added)
    hyfetch # Gay flex
    kitty
    nvd # Nix diffs
    rofi # Application launcher (Added)
    starship # Custom prompt shell
    libnotify # For notify-send

    # ========================
    # FILE MANAGEMENT & MEDIA
    # ========================
    ffmpegthumbnailer # Video thumbnails
    file-roller # Archive GUI
    xfce.thunar # File manager
    xfce.thunar-archive-plugin # Right-click extract
    xfce.thunar-media-tags-plugin # Audio tags
    xfce.thunar-volman # Auto-mount USB

    # ========================
    # CLIPBOARD & SCREENSHOTS
    # ========================
    grim # Screenshots
    slurp # Area selection
    swappy # Edit screenshots
    wl-clipboard # Clipboard
    cliphist # Clipboard Manager

    # ========================
    # RICING
    # ========================
    imagemagick # Convert bitmap images
    pastel # Palette generator
    swww # Wallpaper switch

    # ========================
    # SYSTEM TOOLS
    # ========================
    brightnessctl
    ddcutil # Monitor control
    eza # Better ls
    fd # Better find
    networkmanagerapplet
    playerctl # Media keys
    ripgrep # Better grep
    swayosd # Volume/brightness OSD

    # ========================
    # NIX DEVELOPMENT & TOOLS
    # ========================
    nix-output-monitor # Better nix output
    nixd # Nix Language Server
    nixfmt-rfc-style # Formatter
  ];
}
