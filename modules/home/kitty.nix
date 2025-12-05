{ pkgs, ... }:
let
  variables = import ../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  programs.kitty = {
    enable = true;
    package = pkgs.kitty;
    settings = {
      shell = "${shellPackage}/bin/${defaultShell}";
      font_size = 12;
      font_family = "JetBrains Mono"; # Manually set since Stylix is off
      
      # Core Settings
      window_padding_width = 4;
      confirm_os_window_close = 0;
      enable_audio_bell = false;
      cursor_trail = 1;
      
      # HOT RELOAD SETTINGS
      allow_remote_control = "yes";
      listen_on = "unix:@mykitty"; # Socket for sending commands
      include = "~/.config/kitty/colors.conf"; # Import Matugen colors
    };
    
    # Keep your keybinds
    extraConfig = ''
      # [Copy-paste your existing keybinds from your previous file here if needed]
      # For brevity in this response, I assume you know to keep your binds.
      map ctrl+shift+t new_tab
      map ctrl+shift+q close_tab
      map alt+n new_os_window
      map alt+w close_window
    '';
  };
}
