{ pkgs, ... }:
let
  fontPath = "${pkgs.nerd-fonts.jetbrains-mono}/share/fonts/truetype/NerdFonts/JetBrainsMonoNerdFont-Regular.ttf";

  # Script 1: The Viewer (Python)
  clipList = pkgs.writeScriptBin "rofi-clip-list" ''
    #!${pkgs.bash}/bin/bash
    export PATH=$PATH:${pkgs.wl-clipboard}/bin:${pkgs.cliphist}/bin
    export CLIP_FONT="${fontPath}"
    ${pkgs.python3.withPackages (p: [ p.pillow ])}/bin/python3 ${./clipboard/clip-manager.py} "$@"
  '';

  # Script 2: The Wiper (Bash)
  clipWipe = pkgs.writeScriptBin "rofi-clip-wipe" ''
    #!${pkgs.bash}/bin/bash
    ${pkgs.cliphist}/bin/cliphist wipe
    rm -rf ~/.cache/rofi-clip-thumbs
    ${pkgs.libnotify}/bin/notify-send "Clipboard Cleared" "History wiped successfully"
    pkill rofi
  '';
in
{
  home.packages = [
    clipList
    clipWipe
  ];
  xdg.configFile."rofi/clipboard.rasi".source = ./clipboard/clipboard.rasi;
}
