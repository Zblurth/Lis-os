{ pkgs, ... }:
{
  # Allow unfree packages (like drivers/codecs)
  nixpkgs.config.allowUnfree = true;

  environment.systemPackages = with pkgs; [
    # --- CLI Tools ---
    git
    wget
    curl
    ripgrep
    fd
    eza # ls replacement
    bat # cat replacement
    fzf # fuzzy finder
    killall
    unzip
    unrar

    # --- Nix Tools ---
    nixd # The Nix Language Server (Powerful analysis)
    nil # Another Nix LSP (Required by Zed extension default)
    nixfmt-rfc-style # The Nix Formatter

    # --- System Monitoring ---
    lm_sensors
    pciutils
    usbutils
    lshw

    # --- Audio/Video Backends ---
    ffmpeg
    pipewire
    wireplumber

    # --- Development ---
    gcc
    gnumake
  ];
}
