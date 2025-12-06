{ pkgs, ... }:
let
  variables = import ../../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  programs.kitty = {
    enable = true;
    settings = {
      shell = "${shellPackage}/bin/${defaultShell}";
      font_size = 12;
      font_family = "JetBrains Mono";
      window_padding_width = 4;
      confirm_os_window_close = 0;
      enable_audio_bell = false;
      cursor_trail = 1;
      allow_remote_control = "yes";
      listen_on = "unix:@mykitty";
      include = "~/.cache/wal/colors-kitty.conf";
    };
    extraConfig = ''
      map ctrl+shift+t new_tab
      map ctrl+shift+q close_tab
      map alt+n new_os_window
      map alt+w close_window
    '';
  };

  # Source the template from the separate file
  xdg.configFile."wal/templates/kitty.conf".source = ../theme/templates/kitty.conf;
}
