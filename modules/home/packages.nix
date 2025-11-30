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

    # --- Utilities that are user-specific ---
    networkmanagerapplet
    ffmpegthumbnailer
    nvd
  ];
}
