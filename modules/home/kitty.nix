{ pkgs, ... }:
let
  variables = import ../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  # Base Configuration
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

      # Important: Load the generated file
      include = "~/.cache/wal/colors-kitty.conf";
    };

    extraConfig = ''
      map ctrl+shift+t new_tab
      map ctrl+shift+q close_tab
      map alt+n new_os_window
      map alt+w close_window
    '';
  };

  # Color Template
  xdg.configFile."wal/templates/kitty.conf".text = ''
    foreground {fg}
    background {bg}
    cursor     {ui_prim}

    color0  {bg}
    color8  {ui_sec}
    color1  {sem_red}
    color9  {sem_red}
    color2  {sem_green}
    color10 {sem_green}
    color3  {sem_yellow}
    color11 {sem_yellow}
    color4  {sem_blue}
    color12 {sem_blue}
    color5  {syn_acc}
    color13 {syn_acc}
    color6  {syn_fun}
    color14 {syn_fun}
    color7  {fg}
    color15 {fg}
  '';
}
