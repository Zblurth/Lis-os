{ pkgs, ... }: {
  fonts = {
    fontconfig = {
      enable = true;
      defaultFonts = {
        serif = [ "Jost" "Noto Serif" "Noto Serif CJK SC" ];
        sansSerif = [ "Jost" "Noto Sans" "Noto Sans CJK SC" ];
        monospace = [ "JetBrains Mono" "Noto Sans Mono CJK SC" ];
      };
    };

    packages = with pkgs; [
      jost  # Your main font
      jetbrains-mono  # Terminal/code

      # International/emoji support
      noto-fonts
      noto-fonts-cjk-sans
      noto-fonts-cjk-serif
      noto-fonts-color-emoji
      font-awesome

      # Cool fonts to try (commented out - enable as needed)
      # inter           # Clean, modern sans
      # cascadia-code   # Nice coding font
      # iosevka         # Compact coding font
      # comic-mono      # Handwritten style
      # victor-mono     # Coding font with ligatures
    ];
  };
}
