{ pkgs, ... }:
{
  home.packages = with pkgs; [
    # ========================
    # ESSENTIAL APPS
    # ========================
    # ========================
    # ESSENTIAL APPS
    # ========================
    (symlinkJoin {
      name = "deezer-enhanced-fixed";
      paths = [ deezer-enhanced ];
      buildInputs = [ makeWrapper ];
      postBuild = ''
        wrapProgram $out/bin/deezer-enhanced \
          --prefix XDG_DATA_DIRS : "${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}:${gtk3}/share/gsettings-schemas/${gtk3.name}"
      '';
    })
    appimage-run # AppImage handler
    vesktop # Discord
    vivaldi # Browser
    # zed-editor # IDE # Managed in home/programs/zed.nix

    # ========================
    # UTILITIES
    # ========================
    errands # Todo app
    gemini-cli # Gemini protocol
    eza # Better ls
    bat # Better cat
    fd # Better find
    zoxide # Better cd
    yazi # Better file manager
    # antigravity # Managed in programs/antigravity.nix
    github-cli # Manage Github
    gnused # Stream editor (Added)
    hyfetch # Gay flex
    jq # JSON processor
    nvd # Nix diffs
    pavucontrol # Audio control
    corectrl # Overclocking Utility
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
    bc # colors thing

    # ========================
    # SYSTEM TOOLS
    # ========================
    brightnessctl
    ddcutil # Monitor control
    networkmanagerapplet
    playerctl # Media keys
    ripgrep # Better grep
    swayosd # Volume/brightness OSD
    pkgs.gtk4-layer-shell # Required for Astal GTK4

    # ========================
    # NIX DEVELOPMENT & TOOLS
    # ========================
    nix-output-monitor # Better nix output
    nixd # Nix Language Server
    nixfmt-rfc-style # Formatter
    statix # Linter
    deadnix # Dead code detection
    uv # Python package runner (provides uvx for MCP servers)
    # mcp-nixos # MCP Server for NixOS logic # Managed in: /home/lune/.gemini/antigravity/mcp_config.json
  ];
}
