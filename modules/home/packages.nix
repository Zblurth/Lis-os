{ pkgs, ... }:
{
  home.packages = with pkgs; [
    # --- Internet ---
    vivaldi
    vesktop

    # --- Media ---
    deezer-enhanced
    mpv
    imv # or eog, simple image viewer

    # --- Productivity/Tools ---
    zed-editor
    repomix
    errands
    github-cli
    gemini-cli

    # --- Utilities that are user-specific ---
    networkmanagerapplet
    ffmpegthumbnailer
    nvd
    ddcutil
    playerctl
    swayosd
    brightnessctl
    pavucontrol # Audio control GUI (okay to keep in system for debugging)

  ];
}
