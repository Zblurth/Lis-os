{ pkgs, ... }:
{
  # Allow unfree packages (like drivers/codecs)
  nixpkgs.config.allowUnfree = true;

  environment.systemPackages = with pkgs; [
    # ============================================
    # 1. SYSTEM ESSENTIALS
    # ============================================
    git # Version control
    wget
    curl # Network fetchers
    unzip
    unrar # Archive handlers

    # ============================================
    # 3. SYSTEM INSPECTION & MONITORING
    # ============================================
    # Hardware
    lm_sensors # Temperature monitoring
    pciutils # lspci
    usbutils # lsusb
    lshw # Hardware lister

    # Performance
    htop # Interactive process viewer
    btop # Modern resource monitor (colorful!)
    iotop # Disk I/O monitoring

    # Disk/Storage
    duf # Better df alternative
    ncdu # Disk usage analyzer (TUI)
    smartmontools # SMART disk monitoring

    # ============================================
    # 4. NETWORK TOOLS
    # ============================================
    nmap # Network scanner
    iperf3 # Network performance testing
    ethtool # Ethernet interface config
    wireshark # Packet analyzer (GUI)

    # ============================================
    # 5. TEXT & FILE PROCESSING
    # ============================================
    ripgrep # Better grep
    fd # Better find
    eza # Better ls
    bat # Better cat (syntax highlighting)
    fzf # Fuzzy finder

    # File utilities
    file # Determine file type
    tree # Directory tree view
    rsync # File synchronization

    # ============================================
    # 6. MEDIA & MULTIMEDIA SUPPORT
    # ============================================
    ffmpeg # Video/audio processing
    pipewire # Audio server
    wireplumber # Session manager

  ];
}
