{ pkgs, ... }: {
  fonts = {
    # 1. Ensure fontconfig is explicitly enabled
    fontconfig = {
      enable = true;

      # 2. Setup the fallback fonts so CJK works
      defaultFonts = {
        serif = [ "DejaVu Serif" "Noto Serif CJK SC" "Noto Serif CJK JP" ];
        sansSerif = [ "DejaVu Sans" "Noto Sans CJK SC" "Noto Sans CJK JP" ];
        monospace = [ "JetBrains Mono" "Noto Sans Mono CJK SC" "Noto Sans Mono CJK JP" ];
      };
    };

    # 3. Your packages
    packages = with pkgs; [
      dejavu_fonts
      fira-code
      fira-code-symbols
      noto-fonts
      noto-fonts-cjk-sans
      noto-fonts-cjk-serif
      font-awesome
      jetbrains-mono
      material-icons
      maple-mono.NF
      nerd-fonts.fira-code
      nerd-fonts.droid-sans-mono
      nerd-fonts.jetbrains-mono
      nerd-fonts.meslo-lg
      nerd-fonts.hack
      terminus_font
      inter
    ];
  };
}
